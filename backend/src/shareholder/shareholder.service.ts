import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { PrismaService } from '../prisma.service';
import type { CreateShareholderDto } from './dto/create-shareholder.dto';
import type { CreateShareholderDocumentDto } from './dto/create-shareholder-document.dto';
import type { UpdateShareholderDto } from './dto/update-shareholder.dto';
import type { MultipartFile } from '@fastify/multipart';
import { readFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

@Injectable()
export class ShareholderService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly uploadDirectory = resolve(
    process.cwd(),
    'uploads',
    'shareholder-documents',
  );

  private async prepareUpload(upload: MultipartFile): Promise<{
    fileData: Buffer;
    mimeType: string;
  }> {
    const allowedTypes = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
    ]);
    if (!allowedTypes.has(upload.mimetype)) {
      throw new BadRequestException('Only PDF, PNG, and JPG files are allowed');
    }

    return {
      fileData: await upload.toBuffer(),
      mimeType: upload.mimetype,
    };
  }

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
          documents: {
            orderBy: { uploadedAt: 'desc' },
            select: {
              id: true,
              shareholderProfileId: true,
              documentName: true,
              documentUrl: true,
              uploadedAt: true,
            },
          },
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

  private canManageProfile(
    user: AuthenticatedUser,
    tenantType: string,
  ): boolean {
    return (
      user.email?.trim().toLowerCase() !== 'shareholder@primehorizon.com' &&
      (['ADMIN', 'SUPER_ADMIN'].includes(user.role) ||
        (['SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'].includes(user.role) &&
          tenantType === 'SHAREHOLDER'))
    );
  }

  async createShareholder(data: CreateShareholderDto) {
    try {
      return await this.prisma.shareholderProfile.create({
        data: {
          contactNo: data.contactNo,
          tinNumber: data.tinNumber,
          numberOfShares: data.numberOfShares,
          shareValue: data.shareValue,
          totalContribution: data.totalContribution,
          datePaid:
            data.datePaid === undefined || data.datePaid === null
              ? data.datePaid
              : new Date(data.datePaid),
          remarks: data.remarks,
          shareClass: data.shareClass,
          isAccredited: data.isAccredited,
          kycStatus: data.kycStatus,
          tenant: {
            create: {
              name: data.tenantName,
              type: 'SHAREHOLDER',
            },
          },
        },
        include: {
          tenant: { select: { id: true, name: true } },
          documents: { orderBy: { uploadedAt: 'desc' } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to create shareholder profile',
        );
      }

      throw error;
    }
  }

  async updateShareholder(
    id: string,
    data: UpdateShareholderDto,
    user: AuthenticatedUser,
  ) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    try {
      const profile = await this.prisma.shareholderProfile.findUnique({
        where: { id },
        select: { id: true, tenant: { select: { type: true } } },
      });
      if (!profile) {
        throw new NotFoundException('Shareholder profile not found');
      }
      if (!this.canManageProfile(user, profile.tenant.type)) {
        throw new ForbiddenException(
          'You are not allowed to update this shareholder profile',
        );
      }

      const { tenantName, ...profileData } = data;
      return await this.prisma.shareholderProfile.update({
        where: { id },
        data: {
          ...profileData,
          datePaid:
            data.datePaid === undefined
              ? undefined
              : data.datePaid === null
                ? null
                : new Date(data.datePaid),
          ...(tenantName === undefined
            ? {}
            : { tenant: { update: { name: tenantName } } }),
        },
        include: {
          tenant: { select: { id: true, name: true } },
          documents: { orderBy: { uploadedAt: 'desc' } },
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

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

  async deleteShareholder(id: string, user: AuthenticatedUser) {
    const profile = await this.prisma.shareholderProfile.findUnique({
      where: { id },
      include: {
        tenant: { select: { type: true } },
        documents: { select: { documentUrl: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Shareholder profile not found');
    }
    if (!this.canManageProfile(user, profile.tenant.type)) {
      throw new ForbiddenException(
        'You are not allowed to delete this shareholder profile',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.shareholderDocument.deleteMany({
        where: { shareholderProfileId: id },
      });
      await transaction.shareholderProfile.delete({ where: { id } });
    });

    for (const document of profile.documents) {
      if (document.documentUrl?.startsWith('local://')) {
        const storedName = document.documentUrl.slice('local://'.length);
        const filePath = join(this.uploadDirectory, storedName);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      }
    }

    return { success: true };
  }

  async addDocument(
    profileId: string,
    data: CreateShareholderDocumentDto,
    user: AuthenticatedUser,
  ) {
    try {
      const profile = await this.prisma.shareholderProfile.findUnique({
        where: { id: profileId },
        select: {
          id: true,
          tenantId: true,
          tenant: { select: { type: true } },
        },
      });

      if (!profile) {
        throw new NotFoundException('Shareholder profile not found');
      }

      if (!this.canManageProfile(user, profile.tenant.type)) {
        throw new ForbiddenException(
          'You are not allowed to add shareholder documents',
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

  async addUploadedDocument(
    profileId: string,
    upload: MultipartFile,
    user: AuthenticatedUser,
  ) {
    const profile = await this.prisma.shareholderProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        tenantId: true,
        tenant: { select: { type: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Shareholder profile not found');
    }
    if (!this.canManageProfile(user, profile.tenant.type)) {
      throw new ForbiddenException(
        'You are not allowed to add shareholder documents',
      );
    }

    const saved = await this.prepareUpload(upload);
    return this.prisma.shareholderDocument.create({
      data: {
        shareholderProfileId: profile.id,
        documentName: upload.filename,
        documentUrl: 'database://stored',
        fileData: new Uint8Array(saved.fileData),
        mimeType: saved.mimeType,
      },
      select: {
        id: true,
        shareholderProfileId: true,
        documentName: true,
        documentUrl: true,
        uploadedAt: true,
      },
    });
  }

  async getDocumentFile(
    profileId: string,
    documentId: string,
    user: AuthenticatedUser,
  ) {
    const document = await this.prisma.shareholderDocument.findUnique({
      where: { id: documentId },
      include: {
        shareholderProfile: {
          select: { tenantId: true, tenant: { select: { type: true } } },
        },
      },
    });
    if (!document || document.shareholderProfileId !== profileId) {
      throw new NotFoundException('Shareholder document not found');
    }
    if (
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN' &&
      !(
        (['SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'].includes(user.role) ||
          user.email?.trim().toLowerCase() ===
            'shareholder@primehorizon.com') &&
        document.shareholderProfile.tenant.type === 'SHAREHOLDER'
      ) &&
      user.role !== 'PROJECT_MANAGER' &&
      user.tenantId !== document.shareholderProfile.tenantId
    ) {
      throw new ForbiddenException('You cannot view this document');
    }
    if (document.fileData) {
      return {
        buffer: Buffer.from(document.fileData),
        mimeType:
          document.mimeType ?? this.getMimeType(document.documentName),
        fileName: document.documentName,
      };
    }
    if (!document.documentUrl?.startsWith('local://')) {
      throw new NotFoundException('This document is a hosted link');
    }

    const storedName = document.documentUrl.slice('local://'.length);
    const filePath = join(this.uploadDirectory, storedName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found');
    }
    return {
      buffer: await readFile(filePath),
      mimeType: this.getMimeType(storedName),
      fileName: document.documentName,
    };
  }

  async getCompanyDocuments() {
    return this.prisma.companyDocument.findMany({
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        documentName: true,
        documentUrl: true,
        uploadedByTenantId: true,
        uploadedAt: true,
      },
    });
  }

  async addCompanyDocument(upload: MultipartFile, user: AuthenticatedUser) {
    const saved = await this.prepareUpload(upload);
    return this.prisma.companyDocument.create({
      data: {
        documentName: upload.filename,
        documentUrl: 'database://stored',
        uploadedByTenantId: user.tenantId,
        fileData: new Uint8Array(saved.fileData),
        mimeType: saved.mimeType,
      },
      select: {
        id: true,
        documentName: true,
        documentUrl: true,
        uploadedByTenantId: true,
        uploadedAt: true,
      },
    });
  }

  async getCompanyDocumentFile(documentId: string) {
    const document = await this.prisma.companyDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        documentName: true,
        documentUrl: true,
        fileData: true,
        mimeType: true,
      },
    });
    if (!document) {
      throw new NotFoundException('Company document not found');
    }
    if (document.fileData) {
      return {
        buffer: Buffer.from(document.fileData),
        mimeType:
          document.mimeType ?? this.getMimeType(document.documentName),
        fileName: document.documentName,
      };
    }
    if (!document.documentUrl.startsWith('local://')) {
      throw new NotFoundException('Company document not found');
    }
    const storedName = document.documentUrl.slice('local://'.length);
    const filePath = join(this.uploadDirectory, storedName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Company document file not found');
    }
    return {
      buffer: await readFile(filePath),
      mimeType: this.getMimeType(storedName),
      fileName: document.documentName,
    };
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf'
      ? 'application/pdf'
      : extension === 'png'
        ? 'image/png'
        : 'image/jpeg';
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
            select: {
              tenantId: true,
              tenant: { select: { type: true } },
            },
          },
        },
      });

      if (!document || document.shareholderProfileId !== profileId) {
        throw new NotFoundException('Shareholder document not found');
      }

      if (
        !this.canManageProfile(user, document.shareholderProfile.tenant.type)
      ) {
        throw new ForbiddenException(
          'You are not allowed to delete shareholder documents',
        );
      }

      await this.prisma.shareholderDocument.delete({
        where: { id: documentId },
      });
      if (document.documentUrl?.startsWith('local://')) {
        const storedName = document.documentUrl.slice('local://'.length);
        const filePath = join(this.uploadDirectory, storedName);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      }
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
