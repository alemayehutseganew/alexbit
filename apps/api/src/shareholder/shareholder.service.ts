import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@primehorizon/domain/prisma';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { PrismaService } from '../prisma.service';
import type { CreateShareholderDocumentDto } from './dto/create-shareholder-document.dto';
import type { UpdateShareholderDto } from './dto/update-shareholder.dto';

@Injectable()
export class ShareholderService {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileForTenant(tenantId: string) {
    try {
      const profile = await this.prisma.shareholderProfile.findUnique({
        where: { tenantId },
      });

      if (!profile) {
        throw new NotFoundException('Shareholder profile not found');
      }

      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to fetch shareholder profile',
        );
      }

      throw error;
    }
  }

  async findAllShareholders() {
    try {
      return await this.prisma.shareholderProfile.findMany({
        where: { tenant: { type: 'SHAREHOLDER' } },
        include: {
          tenant: { select: { id: true, name: true } },
          documents: { orderBy: { uploadedAt: 'desc' } },
        },
        orderBy: { tenant: { name: 'asc' } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to fetch shareholder records',
        );
      }

      throw error;
    }
  }

  async updateShareholder(id: string, data: UpdateShareholderDto) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    try {
      return await this.prisma.shareholderProfile.update({
        where: { id },
        data: {
          ...data,
          datePaid:
            data.datePaid === undefined
              ? undefined
              : data.datePaid === null
                ? null
                : new Date(data.datePaid),
        },
        include: {
          tenant: { select: { id: true, name: true } },
          documents: { orderBy: { uploadedAt: 'desc' } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Shareholder profile not found');
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to update shareholder profile',
        );
      }

      throw error;
    }
  }

  async addDocument(
    profileId: string,
    data: CreateShareholderDocumentDto,
    user: AuthenticatedUser,
  ) {
    try {
      const profile = await this.prisma.shareholderProfile.findUnique({
        where: { id: profileId },
        select: { id: true, tenantId: true },
      });

      if (!profile) {
        throw new NotFoundException('Shareholder profile not found');
      }

      if (
        user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN' &&
        user.tenantId !== profile.tenantId
      ) {
        throw new ForbiddenException(
          'Shareholders can only add documents to their own profile',
        );
      }

      return await this.prisma.shareholderDocument.create({
        data: {
          shareholderProfileId: profile.id,
          documentName: data.documentName,
          documentUrl: data.documentUrl?.trim() || null,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to save shareholder document',
        );
      }

      throw error;
    }
  }

  async deleteDocument(
    profileId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    try {
      const document = await this.prisma.shareholderDocument.findUnique({
        where: { id: documentId },
        include: {
          shareholderProfile: {
            select: { tenantId: true },
          },
        },
      });

      if (!document || document.shareholderProfileId !== profileId) {
        throw new NotFoundException('Shareholder document not found');
      }

      const isPrivileged =
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN' ||
        user.role === 'PROJECT_MANAGER';
      if (
        !isPrivileged &&
        user.tenantId !== document.shareholderProfile.tenantId
      ) {
        throw new ForbiddenException(
          'Shareholders can only delete documents from their own profile',
        );
      }

      await this.prisma.shareholderDocument.delete({
        where: { id: documentId },
      });
      return { success: true };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to delete shareholder document',
        );
      }

      throw error;
    }
  }
}
