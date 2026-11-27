import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterApiInput,
  ResetPasswordInput,
} from '../schemas/auth.schema';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterApiInput) {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const tenant = await transaction.tenant.create({
          data: {
            name: data.organization,
            type: 'CLIENT',
          },
        });

        const user = await transaction.user.create({
          data: {
            tenantId: tenant.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            passwordHash,
            role: 'CLIENT_ADMIN',
          },
          select: {
            id: true,
            tenantId: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });
        return { message: 'Account created successfully', user };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async login(data: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        role: true,
      },
    });

    console.log('Login attempt:', 'Role found:', user?.role ?? 'not-found');

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new InternalServerErrorException(
        'JWT_SECRET must be configured with at least 32 characters',
      );
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email,
      },
      {
        secret,
        algorithm: 'HS256',
        expiresIn: '15m',
        issuer: process.env.JWT_ISSUER ?? 'primehorizon-api',
        audience: process.env.JWT_AUDIENCE ?? 'primehorizon-api',
      },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (user) {
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `Mock password reset token for ${data.email}: ${resetToken}`,
        );
      }
    }

    return { message: 'Reset link sent' };
  }

  async resetPassword(data: ResetPasswordInput) {
    const user = await this.prisma.user.findUnique({
      where: { resetToken: data.token },
      select: { id: true, resetTokenExpiry: true },
    });

    if (!user?.resetTokenExpiry || user.resetTokenExpiry <= new Date()) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    const result = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        resetToken: data.token,
        resetTokenExpiry: { gt: new Date() },
      },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    if (result.count !== 1) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    return { message: 'Password reset successfully' };
  }
}
