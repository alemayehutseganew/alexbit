import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import type { AppRole, AuthenticatedUser } from './authenticated-user';

type JwtPayload = {
  sub?: unknown;
  iss?: unknown;
  email?: unknown;
  tenantId?: unknown;
  tenant_id?: unknown;
  role?: unknown;
  roles?: unknown;
  realm_access?: unknown;
  aud?: unknown;
  [key: string]: unknown;
};

const appRoles: readonly AppRole[] = [
  'CLIENT',
  'SHAREHOLDER',
  'ADMIN',
  'SUPER_ADMIN',
  'PROJECT_MANAGER',
  'CLIENT_ADMIN',
  'SHAREHOLDER_ADMIN',
  'SHAREHOLDER_MANAGER',
];

function isAppRole(value: unknown): value is AppRole {
  return appRoles.some((role) => role === value);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be configured with at least 32 characters',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    const tenantId =
      typeof payload.tenantId === 'string'
        ? payload.tenantId
        : typeof payload.tenant_id === 'string'
          ? payload.tenant_id
          : undefined;

    if (typeof payload.sub !== 'string' || !tenantId?.trim()) {
      throw new UnauthorizedException('Invalid access token claims');
    }

    const realmAccess = payload.realm_access;
    const realmRoles =
      realmAccess && typeof realmAccess === 'object' && 'roles' in realmAccess
        ? realmAccess.roles
        : undefined;
    const roles = [
      ...(typeof payload.role === 'string' ? [payload.role] : []),
      ...(Array.isArray(payload.role) ? payload.role : []),
      ...(typeof payload.roles === 'string' ? [payload.roles] : []),
      ...(Array.isArray(payload.roles) ? payload.roles : []),
      ...(Array.isArray(realmRoles) ? realmRoles : []),
    ];
    const role = roles.find(isAppRole);

    if (!role) {
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
