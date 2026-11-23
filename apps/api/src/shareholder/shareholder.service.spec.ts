import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ShareholderService } from './shareholder.service';

describe('ShareholderService', () => {
  let service: ShareholderService;
  let findUnique: jest.Mock;
  let findMany: jest.Mock;
  let update: jest.Mock;
  let createDocument: jest.Mock;
  let findDocument: jest.Mock;
  let deleteDocument: jest.Mock;

  beforeEach(async () => {
    findUnique = jest.fn();
    findMany = jest.fn();
    update = jest.fn();
    createDocument = jest.fn();
    findDocument = jest.fn();
    deleteDocument = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareholderService,
        {
          provide: PrismaService,
          useValue: {
            shareholderProfile: { findUnique, findMany, update },
            shareholderDocument: {
              create: createDocument,
              findUnique: findDocument,
              delete: deleteDocument,
            },
          },
        },
      ],
    }).compile();

    service = module.get<ShareholderService>(ShareholderService);
  });

  it('looks up the shareholder profile by tenant ID', async () => {
    const profile = { tenantId: 'tenant-1', numberOfShares: 25 };
    findUnique.mockResolvedValue(profile);

    await expect(service.findProfileForTenant('tenant-1')).resolves.toEqual(
      profile,
    );
    expect(findUnique).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
  });

  it('returns a not found error when no profile exists for the tenant', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findProfileForTenant('tenant-2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns all profiles with their tenants and documents', async () => {
    findMany.mockResolvedValue([]);

    await expect(service.findAllShareholders()).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { tenant: { type: 'SHAREHOLDER' } },
      include: {
        tenant: { select: { id: true, name: true } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
      orderBy: { tenant: { name: 'asc' } },
    });
  });

  it('updates profile details and converts a paid date', async () => {
    update.mockResolvedValue({ id: 'profile-1' });

    await service.updateShareholder('profile-1', {
      numberOfShares: 50,
      datePaid: '2026-08-18T00:00:00.000Z',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profile-1' },
        data: {
          numberOfShares: 50,
          datePaid: new Date('2026-08-18T00:00:00.000Z'),
        },
      }),
    );
  });

  it('rejects an empty profile update', async () => {
    await expect(service.updateShareholder('profile-1', {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('allows a shareholder to add a document to their own profile', async () => {
    findUnique.mockResolvedValue({ id: 'profile-1', tenantId: 'tenant-1' });
    createDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.addDocument(
        'profile-1',
        {
          documentName: 'Receipt',
          documentUrl: 'https://files.example.test/receipt.pdf',
        },
        { userId: 'user-1', tenantId: 'tenant-1', role: 'SHAREHOLDER' },
      ),
    ).resolves.toEqual({ id: 'document-1' });
  });

  it('allows a shareholder to add a document without a hosted URL', async () => {
    findUnique.mockResolvedValue({ id: 'profile-1', tenantId: 'tenant-1' });
    createDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.addDocument(
        'profile-1',
        { documentName: 'Receipt' },
        { userId: 'user-1', tenantId: 'tenant-1', role: 'SHAREHOLDER' },
      ),
    ).resolves.toEqual({ id: 'document-1' });

    expect(createDocument).toHaveBeenCalledWith({
      data: {
        shareholderProfileId: 'profile-1',
        documentName: 'Receipt',
        documentUrl: null,
      },
    });
  });

  it('prevents a shareholder from adding documents to another profile', async () => {
    findUnique.mockResolvedValue({ id: 'profile-1', tenantId: 'tenant-2' });

    await expect(
      service.addDocument(
        'profile-1',
        {
          documentName: 'Receipt',
          documentUrl: 'https://files.example.test/receipt.pdf',
        },
        { userId: 'user-1', tenantId: 'tenant-1', role: 'SHAREHOLDER' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows an admin to delete a shareholder document', async () => {
    findDocument.mockResolvedValue({
      id: 'document-1',
      shareholderProfileId: 'profile-1',
      shareholderProfile: { tenantId: 'tenant-1' },
    });
    deleteDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.deleteDocument('profile-1', 'document-1', {
        userId: 'admin-1',
        tenantId: 'tenant-admin',
        role: 'ADMIN',
      }),
    ).resolves.toEqual({ success: true });
  });

  it('prevents a shareholder from deleting another profile document', async () => {
    findDocument.mockResolvedValue({
      id: 'document-1',
      shareholderProfileId: 'profile-1',
      shareholderProfile: { tenantId: 'tenant-2' },
    });

    await expect(
      service.deleteDocument('profile-1', 'document-1', {
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: 'SHAREHOLDER',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
