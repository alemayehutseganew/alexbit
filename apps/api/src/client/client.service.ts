import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MultipartFile } from '@fastify/multipart';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly uploadDirectory = resolve(
    process.cwd(),
    'uploads',
    'client-documents',
  );

  private async saveUpload(upload: MultipartFile) {
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(upload.mimetype)) {
      throw new BadRequestException('Only PDF, PNG, and JPG files are allowed');
    }
    await mkdir(this.uploadDirectory, { recursive: true });
    const extension =
      upload.filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'bin';
    const storedName = `${randomUUID()}.${extension}`;
    await writeFile(
      join(this.uploadDirectory, storedName),
      await upload.toBuffer(),
    );
    return `local://${storedName}`;
  }

  private canViewAll(user: AuthenticatedUser) {
    return ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'].includes(user.role);
  }

  async findDocuments(user: AuthenticatedUser) {
    return this.prisma.clientDocument.findMany({
      where: this.canViewAll(user) ? undefined : { tenantId: user.tenantId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async addDocument(upload: MultipartFile, user: AuthenticatedUser) {
    if (this.canViewAll(user)) {
      throw new ForbiddenException('Use an authenticated client account');
    }
    const documentUrl = await this.saveUpload(upload);
    return this.prisma.clientDocument.create({
      data: {
        tenantId: user.tenantId,
        documentName: upload.filename,
        documentUrl,
      },
    });
  }

  async getDocumentFile(documentId: string, user: AuthenticatedUser) {
    const document = await this.prisma.clientDocument.findUnique({
      where: { id: documentId },
    });
    if (
      !document ||
      (!this.canViewAll(user) && document.tenantId !== user.tenantId)
    ) {
      throw new NotFoundException('Client document not found');
    }
    if (!document.documentUrl.startsWith('local://')) {
      throw new NotFoundException('Document file not found');
    }
    const storedName = document.documentUrl.slice('local://'.length);
    const filePath = join(this.uploadDirectory, storedName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document file not found');
    }
    const extension = storedName.split('.').pop()?.toLowerCase();
    return {
      buffer: await readFile(filePath),
      mimeType:
        extension === 'pdf'
          ? 'application/pdf'
          : extension === 'png'
            ? 'image/png'
            : 'image/jpeg',
      fileName: document.documentName,
    };
  }

  async findInvoices(user: AuthenticatedUser) {
    return this.prisma.clientInvoice.findMany({
      where: this.canViewAll(user) ? undefined : { tenantId: user.tenantId },
      orderBy: { issueDate: 'desc' },
    });
  }

  async findSupportTickets(user: AuthenticatedUser) {
    return this.prisma.supportTicket.findMany({
      where: this.canViewAll(user) ? undefined : { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSupportTicket(
    body: { subject: string; message: string; priority?: string },
    user: AuthenticatedUser,
  ) {
    const subject = body.subject?.trim();
    const message = body.message?.trim();
    if (!subject || !message) {
      throw new BadRequestException('Subject and message are required');
    }
    const priority = ['low', 'normal', 'high'].includes(
      body.priority?.toLowerCase() ?? '',
    )
      ? body.priority!.toUpperCase()
      : 'NORMAL';
    return this.prisma.supportTicket.create({
      data: {
        tenantId: user.tenantId,
        subject,
        message,
        priority: priority as 'LOW' | 'NORMAL' | 'HIGH',
      },
    });
  }
}
