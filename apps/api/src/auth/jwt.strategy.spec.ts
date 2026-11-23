import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalIssuer = process.env.AUTH_KEYCLOAK_CLIENT_ISSUER;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtIssuer = process.env.JWT_ISSUER;
  const originalJwtAudience = process.env.JWT_AUDIENCE;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalIssuer === undefined) {
      delete process.env.AUTH_KEYCLOAK_CLIENT_ISSUER;
    } else {
      process.env.AUTH_KEYCLOAK_CLIENT_ISSUER = originalIssuer;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
    if (originalJwtIssuer === undefined) {
      delete process.env.JWT_ISSUER;
    } else {
      process.env.JWT_ISSUER = originalJwtIssuer;
    }
    if (originalJwtAudience === undefined) {
      delete process.env.JWT_AUDIENCE;
    } else {
      process.env.JWT_AUDIENCE = originalJwtAudience;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('extracts tenant ID and an allowed role from verified token claims', () => {
    delete process.env.JWT_SECRET;
    process.env.AUTH_KEYCLOAK_CLIENT_ISSUER =
      'https://identity.example.test/realms/client';
    const strategy = new JwtStrategy();

    expect(
      strategy.validate({
        sub: 'user-1',
        iss: process.env.AUTH_KEYCLOAK_CLIENT_ISSUER,
        tenant_id: 'tenant-1',
        realm_access: { roles: ['CLIENT'] },
      }),
    ).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'CLIENT',
    });
  });

  it('rejects token claims missing a tenant ID or role', () => {
    delete process.env.JWT_SECRET;
    process.env.AUTH_KEYCLOAK_CLIENT_ISSUER =
      'https://identity.example.test/realms/client';
    const strategy = new JwtStrategy();

    expect(() =>
      strategy.validate({
        sub: 'user-1',
        iss: process.env.AUTH_KEYCLOAK_CLIENT_ISSUER,
        realm_access: { roles: ['CLIENT'] },
      }),
    ).toThrow(UnauthorizedException);
  });

  it('accepts a local HS256 identity without requiring a Keycloak issuer', () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET =
      'test-only-secret-that-is-at-least-thirty-two-characters';
    const strategy = new JwtStrategy();

    expect(
      strategy.validate({
        sub: 'user-1',
        iss: process.env.JWT_ISSUER ?? 'primehorizon-api',
        aud: process.env.JWT_AUDIENCE ?? 'primehorizon-api',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      }),
    ).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'ADMIN',
    });
  });
});
