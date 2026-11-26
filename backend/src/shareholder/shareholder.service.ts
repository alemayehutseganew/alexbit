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
import type { CreateShareholderDocumentDto } from './dto/create-shareholder-document.dto';
import type { UpdateShareholderDto } from './dto/update-shareholder.dto';
import type { MultipartFile } from '@fastify/multipart';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ShareholderService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly uploadDirectory = resolve(
    process.cwd(),
    'uploads',
    'shareholder-documents',
  );

  private async saveUpload(upload: MultipartFile): Promise<{
    fileName: string;
    documentUrl: string;
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

    await mkdir(this.uploadDirectory, { recursive: true });
    const extension =
      upload.filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'bin';
    const storedName = `${randomUUID()}.${extension}`;
    const storedPath = join(this.uploadDirectory, storedName);
    await writeFile(storedPath, await upload.toBuffer());

    return {
      fileName: upload.filename,
      documentUrl: `local://${storedName}`,
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

  async addUploadedDocument(
    profileId: string,
    upload: MultipartFile,
    user: AuthenticatedUser,
  ) {
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

    const saved = await this.saveUpload(upload);
    return this.prisma.shareholderDocument.create({
      data: {
        shareholderProfileId: profile.id,
        documentName: upload.filename,
        documentUrl: saved.documentUrl,
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
      include: { shareholderProfile: { select: { tenantId: true } } },
    });
    if (!document || document.shareholderProfileId !== profileId) {
      throw new NotFoundException('Shareholder document not found');
    }
    if (
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'PROJECT_MANAGER' &&
      user.tenantId !== document.shareholderProfile.tenantId
    ) {
      throw new ForbiddenException('You cannot view this document');
    }
    if (!document.documentUrl?.startsWith('local://')) {
      throw new NotFoundException('This document is a hosted link');
    }

    const storedName = document.documentUrl.slice('local://'.length);
    const filePath = join(this.uploadDirectory, storedName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found');
    }
    const extension = storedName.split('.').pop()?.toLowerCase();
    const mimeType =
      extension === 'pdf'
        ? 'application/pdf'
        : extension === 'png'
          ? 'image/png'
          : 'image/jpeg';
    return {
      buffer: await readFile(filePath),
      mimeType,
      fileName: document.documentName,
    };
  }

  async getCompanyDocuments() {
    return this.prisma.companyDocument.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async addCompanyDocument(upload: MultipartFile, user: AuthenticatedUser) {
    const saved = await this.saveUpload(upload);
    return this.prisma.companyDocument.create({
      data: {
        documentName: upload.filename,
        documentUrl: saved.documentUrl,
        uploadedByTenantId: user.tenantId,
      },
    });
  }

  async getCompanyDocumentFile(documentId: string) {
    const document = await this.prisma.companyDocument.findUnique({
      where: { id: documentId },
    });
    if (!document?.documentUrl.startsWith('local://')) {
      throw new NotFoundException('Company document not found');
    }
    const storedName = document.documentUrl.slice('local://'.length);
    const filePath = join(this.uploadDirectory, storedName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Company document file not found');
    }
    const extension = storedName.split('.').pop()?.toLowerCase();
    const mimeType =
      extension === 'pdf'
        ? 'application/pdf'
        : extension === 'png'
          ? 'image/png'
          : 'image/jpeg';
    return {
      buffer: await readFile(filePath),
      mimeType,
      fileName: document.documentName,
    };
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
