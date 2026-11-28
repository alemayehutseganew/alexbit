import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterApiSchema } from '../schemas/auth.schema';
import type {
  RegisterApiInput,
  ResetPasswordInput,
} from '../schemas/auth.schema';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

type UserUpdateManyArgs = {
  where: {
    id: string;
    resetToken: string;
    resetTokenExpiry: { gt: Date };
  };
  data: {
    passwordHash: string;
    resetToken: null;
    resetTokenExpiry: null;
  };
};

describe('AuthService', () => {
  let service: AuthService;
  let tenantCreate: jest.Mock;
  let userCreate: jest.Mock;
  let userFindUnique: jest.Mock;
  let userUpdate: jest.Mock;
  let userUpdateMany: jest.Mock;
  let jwtSign: jest.Mock;
  let lastUserUpdateData: Record<string, unknown> | undefined;
  let lastUserUpdateManyArgs: UserUpdateManyArgs | undefined;
  let resetTokenLog: jest.SpyInstance;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(async () => {
    process.env.JWT_SECRET =
      'test-only-secret-that-is-at-least-thirty-two-characters';
    tenantCreate = jest.fn();
    userCreate = jest.fn();
    userFindUnique = jest.fn();
    lastUserUpdateData = undefined;
    lastUserUpdateManyArgs = undefined;
    userUpdate = jest.fn((args: { data: Record<string, unknown> }) => {
      lastUserUpdateData = args.data;
      return Promise.resolve({});
    });
    userUpdateMany = jest.fn((args: UserUpdateManyArgs) => {
      lastUserUpdateManyArgs = args;
      return Promise.resolve({ count: 1 });
    });
    jwtSign = jest.fn().mockResolvedValue('signed-test-token');
    const transactionClient = {
      tenant: { create: tenantCreate },
      user: { create: userCreate },
    };
    const prisma = {
      $transaction: jest.fn(
        (
          callback: (transaction: typeof transactionClient) => Promise<unknown>,
        ) => callback(transactionClient),
      ),
      user: {
        findUnique: userFindUnique,
        update: userUpdate,
        updateMany: userUpdateMany,
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jwtSign } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    resetTokenLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
    jest.restoreAllMocks();
  });

  it('accepts the API registration fields without frontend-only fields', () => {
    const registration = {
      firstName: 'Alex',
      lastName: 'User',
      organization: 'Example Co',
      email: 'alex@example.com',
      password: 'strong-password',
    };

    expect(RegisterApiSchema.parse(registration)).toEqual(registration);
  });

  it('creates a client tenant and stores only a bcrypt hash', async () => {
    const registration: RegisterApiInput = {
      firstName: 'Alex',
      lastName: 'User',
      organization: 'Example Co',
      email: 'alex@example.com',
      password: 'strong-password',
    };
    const createdUser = {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: registration.email,
      firstName: registration.firstName,
      lastName: registration.lastName,
      role: 'CLIENT_ADMIN',
    };
    tenantCreate.mockResolvedValue({ id: 'tenant-1' });
    let userCreateData: Record<string, unknown> | undefined;
    userCreate.mockImplementation((args: { data: Record<string, unknown> }) => {
      userCreateData = args.data;
      return Promise.resolve(createdUser);
    });

    const result = await service.register(registration);

    expect(result).toEqual({
      message: 'Account created successfully',
      user: createdUser,
    });
    expect(tenantCreate).toHaveBeenCalledWith({
      data: { name: 'Example Co', type: 'CLIENT' },
    });
    expect(userCreateData?.tenantId).toBe('tenant-1');
    expect(userCreateData?.role).toBe('CLIENT_ADMIN');
    expect(typeof userCreateData?.passwordHash).toBe('string');
    if (typeof userCreateData?.passwordHash === 'string') {
      expect(userCreateData.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    }
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('authenticates a shareholder user with the matching password', async () => {
    const passwordHash = await bcrypt.hash('strong-password', 12);
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'User',
      passwordHash,
      role: 'SHAREHOLDER',
      tenant: { type: 'SHAREHOLDER' },
    });
    const result = await service.login({
      email: 'alex@example.com',
      password: 'strong-password',
    });
    expect(result).toMatchObject({
      user: {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'SHAREHOLDER',
      },
    });
    expect(typeof result.accessToken).toBe('string');
  });

  it.each([
    {
      email: 'superadmin@primehorizon.com',
      password: 'SuperAdmin@2026',
      role: 'SUPER_ADMIN',
    },
    {
      email: 'shareholder@primehorizon.com',
      password: 'Primehorizon@2026',
      role: 'SHAREHOLDER',
      databaseRole: 'SHAREHOLDER_MANAGER',
    },
    {
      email: 'shareholderadmin@primehorizon.com',
      password: 'ShAdmin@2026',
      role: 'SHAREHOLDER_ADMIN',
    },
  ])(
    'uses the configured role when authenticating the fixed $role account',
    async ({ email, password, role, databaseRole }) => {
      userFindUnique.mockResolvedValue({
        id: `user-${role.toLowerCase()}`,
        tenantId: `tenant-${role.toLowerCase()}`,
        email,
        firstName: 'Fixed',
        lastName: 'Account',
        passwordHash: null,
        role: databaseRole ?? role,
      });

      const result = await service.login({ email, password });

      expect(result.user.role).toBe(role);
      expect(result.accessToken).toBe('signed-test-token');
      expect(jwtSign).toHaveBeenCalledWith(
        expect.objectContaining({ role }),
        expect.any(Object),
      );
    },
  );

  it('rejects an incorrect password for a fixed account', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-shareholder',
      tenantId: 'tenant-shareholder',
      email: 'shareholder@primehorizon.com',
      firstName: 'All',
      lastName: 'Shareholders',
      passwordHash: null,
      role: 'SHAREHOLDER_MANAGER',
    });

    await expect(
      service.login({
        email: 'shareholder@primehorizon.com',
        password: 'incorrect-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtSign).not.toHaveBeenCalled();
  });

  it('returns the shareholder admin role with successful login', async () => {
    const passwordHash = await bcrypt.hash('strong-password', 12);
    userFindUnique.mockResolvedValue({
      id: 'user-shareholder-admin',
      tenantId: 'tenant-shareholder-admin',
      email: 'shareholder-admin@example.com',
      firstName: 'Shareholder',
      lastName: 'Admin',
      passwordHash,
      role: 'SHAREHOLDER_ADMIN',
    });

    const result = await service.login({
      email: 'shareholder-admin@example.com',
      password: 'strong-password',
    });

    expect(result.user).toMatchObject({
      id: 'user-shareholder-admin',
      tenantId: 'tenant-shareholder-admin',
      role: 'SHAREHOLDER_ADMIN',
    });
    expect(jwtSign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'SHAREHOLDER_ADMIN' }),
      expect.any(Object),
    );
  });

  it('returns the shareholder manager role and tenant on successful login', async () => {
    const passwordHash = await bcrypt.hash('strong-password', 12);
    userFindUnique.mockResolvedValue({
      id: 'user-shareholder-manager',
      tenantId: 'tenant-shareholders',
      email: 'shareholder-manager@example.com',
      firstName: 'Shareholder',
      lastName: 'Manager',
      passwordHash,
      role: 'SHAREHOLDER_MANAGER',
    });

    const result = await service.login({
      email: 'shareholder-manager@example.com',
      password: 'strong-password',
    });

    expect(result.user).toMatchObject({
      id: 'user-shareholder-manager',
      tenantId: 'tenant-shareholders',
      role: 'SHAREHOLDER_MANAGER',
    });
    expect(jwtSign).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-shareholders',
        role: 'SHAREHOLDER_MANAGER',
      }),
      expect.any(Object),
    );
    expect(resetTokenLog).toHaveBeenCalledWith(
      'Backend Login Success:',
      'SHAREHOLDER_MANAGER',
    );
  });

  it('authenticates a client user with the matching password', async () => {
    const passwordHash = await bcrypt.hash('strong-password', 12);
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'User',
      passwordHash,
      role: 'CLIENT_ADMIN',
      tenant: { type: 'CLIENT' },
    });

    const result = await service.login({
      email: 'alex@example.com',
      password: 'strong-password',
    });
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Test JWT_SECRET was not set');
    }

    expect(result).toMatchObject({
      user: {
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'User',
        role: 'CLIENT_ADMIN',
      },
    });
    expect(result.accessToken).toBe('signed-test-token');
    expect(jwtSign).toHaveBeenCalledWith(
      {
        sub: 'user-1',
        tenantId: 'tenant-1',
        role: 'CLIENT_ADMIN',
        email: 'alex@example.com',
      },
      {
        secret,
        algorithm: 'HS256',
        expiresIn: '15m',
        issuer: 'primehorizon-api',
        audience: 'primehorizon-api',
      },
    );
  });

  it('returns a generic forgot-password response for unknown accounts', async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'missing@example.com' }),
    ).resolves.toEqual({ message: 'Reset link sent' });
    expect(resetTokenLog).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('logs a mock reset token for an existing client account', async () => {
    const now = Date.now();
    userFindUnique.mockResolvedValue({
      id: 'user-1',
    });

    await expect(
      service.forgotPassword({ email: 'alex@example.com' }),
    ).resolves.toEqual({ message: 'Reset link sent' });
    expect(resetTokenLog).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Mock password reset token for alex@example\.com: [a-f0-9]{64}$/,
      ),
    );
    expect(lastUserUpdateData?.resetToken).toMatch(/^[a-f0-9]{64}$/);
    const resetTokenExpiry = lastUserUpdateData?.resetTokenExpiry;
    expect(resetTokenExpiry).toBeInstanceOf(Date);
    if (resetTokenExpiry instanceof Date) {
      const expiryInMs = resetTokenExpiry.getTime() - now;
      expect(expiryInMs).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000);
      expect(expiryInMs).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    }
  });

  it('resets the password once for a valid reset token and clears token fields', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      resetTokenExpiry: new Date(Date.now() + 60_000),
    });
    const input: ResetPasswordInput = {
      token: 'valid-reset-token',
      newPassword: 'new-strong-password',
    };

    await expect(service.resetPassword(input)).resolves.toEqual({
      message: 'Password reset successfully',
    });

    expect(lastUserUpdateManyArgs?.where).toMatchObject({
      id: 'user-1',
      resetToken: input.token,
    });
    expect(lastUserUpdateManyArgs?.data).toMatchObject({
      resetToken: null,
      resetTokenExpiry: null,
    });
    await expect(
      bcrypt.compare(
        input.newPassword,
        lastUserUpdateManyArgs?.data.passwordHash ?? '',
      ),
    ).resolves.toBe(true);
  });

  it('rejects expired reset tokens without updating the password', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      resetTokenExpiry: new Date(Date.now() - 1),
    });

    await expect(
      service.resetPassword({
        token: 'expired-reset-token',
        newPassword: 'new-strong-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userUpdateMany).not.toHaveBeenCalled();
  });
});
