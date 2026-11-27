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
  aud?: unknown;
  [key: string]: unknown;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    const tenantId =
      typeof payload.tenantId === 'string'
        ? payload.tenantId
        : typeof payload.tenant_id === 'string'
          ? payload.tenant_id
          : undefined;

    if (
      typeof payload.sub !== 'string' ||
      !tenantId?.trim()
    ) {
      throw new UnauthorizedException('Invalid access token claims');
    }

    const role = Array.isArray(payload.role)
      ? payload.role.filter((r): r is string => typeof r === 'string')[0]
      : typeof payload.role === 'string'
        ? payload.role
        : undefined;

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
