import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwksClient } from 'jwks-rsa';
import type { AppRole, AuthenticatedUser } from './authenticated-user';

type JwtPayload = {
  sub?: unknown;
  iss?: unknown;
  email?: unknown;
  tenantId?: unknown;
  tenant_id?: unknown;
  role?: unknown;
  roles?: unknown;
  realm_access?: { roles?: unknown };
  resource_access?: Record<string, { roles?: unknown }>;
  aud?: unknown;
  [key: string]: unknown;
};

const jwksClients = new Map<string, JwksClient>();

function isObjectWithClaim<K extends 'iss' | 'kid'>(
  value: unknown,
  claim: K,
): value is Record<K, unknown> {
  return typeof value === 'object' && value !== null && claim in value;
}

function isAppRole(role: string): role is AppRole {
  return [
    'CLIENT',
    'SHAREHOLDER',
    'ADMIN',
    'SUPER_ADMIN',
    'PROJECT_MANAGER',
    'CLIENT_ADMIN',
  ].some((candidate) => candidate === role);
}

function jwtStrategyOptions() {
  const localSecret = getLocalJwtSecret();
  const issuers = configuredIssuers();
  const audience = process.env.KEYCLOAK_API_AUDIENCE;
  if (process.env.NODE_ENV === 'production') {
    if (issuers.length < 2) {
      throw new Error('Both Keycloak realm issuers must be configured');
    }
    if (!audience) {
      throw new Error('KEYCLOAK_API_AUDIENCE must be configured');
    }
  }

  if (localSecret && localSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    algorithms: ['HS256' as const, 'RS256' as const],
    secretOrKeyProvider: (
      _request: unknown,
      rawToken: string,
      done: (error: Error | null, key?: string) => void,
    ) => {
      const header = decodeUnverifiedHeader(rawToken);
      const payload = decodeUnverifiedPayload(rawToken);
      if (!header || !payload || typeof payload.iss !== 'string') {
        done(new UnauthorizedException('Token issuer is not allowed'));
        return;
      }

      if (
        header.alg === 'HS256' &&
        localSecret &&
        payload.iss === localJwtIssuer()
      ) {
        done(null, localSecret);
        return;
      }

      if (
        header.alg !== 'RS256' ||
        !issuers.includes(payload.iss) ||
        typeof header.kid !== 'string'
      ) {
        done(new UnauthorizedException('Token signing key is not allowed'));
        return;
      }

      let jwks = jwksClients.get(payload.iss);
      if (!jwks) {
        jwks = new JwksClient({
          jwksUri: `${payload.iss.replace(/\/$/, '')}/protocol/openid-connect/certs`,
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 10,
          timeout: 5000,
        });
        jwksClients.set(payload.iss, jwks);
      }
      jwks.getSigningKey(header.kid).then(
        (key) => done(null, key.getPublicKey()),
        () => done(new UnauthorizedException('Unable to verify access token')),
      );
    },
  };
}

function decodeTokenPart(rawToken: string, index: number): unknown {
  try {
    const encodedPart = rawToken.split('.')[index];
    return encodedPart
      ? JSON.parse(Buffer.from(encodedPart, 'base64url').toString('utf8'))
      : undefined;
  } catch {
    return undefined;
  }
}

function decodeUnverifiedPayload(
  rawToken: string,
): { iss?: unknown } | undefined {
  const payload = decodeTokenPart(rawToken, 1);
  return isObjectWithClaim(payload, 'iss') ? payload : undefined;
}

function decodeUnverifiedHeader(
  rawToken: string,
): { kid?: unknown; alg?: unknown } | undefined {
  const header = decodeTokenPart(rawToken, 0);
  if (typeof header !== 'object' || header === null) {
    return undefined;
  }

  return {
    ...('kid' in header ? { kid: header.kid } : {}),
    ...('alg' in header ? { alg: header.alg } : {}),
  };
}

function configuredIssuers(): string[] {
  return [
    process.env.AUTH_KEYCLOAK_CLIENT_ISSUER ?? process.env.KEYCLOAK_ISSUER,
    process.env.AUTH_KEYCLOAK_SHAREHOLDER_ISSUER,
  ].filter((issuer): issuer is string => Boolean(issuer));
}

function getLocalJwtSecret(): string | undefined {
  return process.env.JWT_SECRET;
}

function localJwtIssuer(): string {
  return process.env.JWT_ISSUER ?? 'primehorizon-api';
}

function localJwtAudience(): string {
  return process.env.JWT_AUDIENCE ?? 'primehorizon-api';
}

function hasAudience(value: unknown, audience: string): boolean {
  return (
    value === audience || (Array.isArray(value) && value.includes(audience))
  );
}

function stringRoles(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === 'string')
    : [];
}

function resolveRole(payload: JwtPayload): AppRole | undefined {
  const resourceRoles = Object.values(payload.resource_access ?? {}).flatMap(
    (resource) => stringRoles(resource?.roles),
  );
  const roles = [
    ...stringRoles(payload.role),
    ...stringRoles(payload.roles),
    ...stringRoles(payload.realm_access?.roles),
    ...resourceRoles,
  ];

  return roles.find(isAppRole);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly issuers = configuredIssuers();
  private readonly usesLocalJwtSecret = Boolean(getLocalJwtSecret());

  constructor() {
    super(jwtStrategyOptions());
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    const tenantId =
      typeof payload.tenantId === 'string'
        ? payload.tenantId
        : typeof payload.tenant_id === 'string'
          ? payload.tenant_id
          : undefined;
    const role = resolveRole(payload);
    const isLocalToken =
      this.usesLocalJwtSecret && payload.iss === localJwtIssuer();
    const expectedAudience = isLocalToken
      ? localJwtAudience()
      : process.env.KEYCLOAK_API_AUDIENCE;

    if (
      typeof payload.sub !== 'string' ||
      !tenantId?.trim() ||
      !role ||
      (!isLocalToken &&
        (typeof payload.iss !== 'string' ||
          !this.issuers.includes(payload.iss))) ||
      (expectedAudience && !hasAudience(payload.aud, expectedAudience))
    ) {
      throw new UnauthorizedException('Invalid access token claims');
    }

    return {
      userId: payload.sub,
      tenantId: tenantId.trim(),
      role,
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
    };
  }
}
