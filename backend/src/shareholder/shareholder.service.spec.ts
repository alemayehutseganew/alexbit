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
  let createProfile: jest.Mock;
  let deleteProfile: jest.Mock;
  let createDocument: jest.Mock;
  let findDocument: jest.Mock;
  let deleteDocument: jest.Mock;
  let deleteManyDocuments: jest.Mock;
  let transaction: jest.Mock;

  beforeEach(async () => {
    findUnique = jest.fn();
    findMany = jest.fn();
    update = jest.fn();
    createProfile = jest.fn();
    deleteProfile = jest.fn();
    createDocument = jest.fn();
    findDocument = jest.fn();
    deleteDocument = jest.fn();
    deleteManyDocuments = jest.fn();
    transaction = jest.fn(
      (
        callback: (tx: {
          shareholderDocument: { deleteMany: jest.Mock };
          shareholderProfile: { delete: jest.Mock };
        }) => Promise<unknown>,
      ) =>
        callback({
          shareholderDocument: { deleteMany: deleteManyDocuments },
          shareholderProfile: { delete: deleteProfile },
        }),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareholderService,
        {
          provide: PrismaService,
          useValue: {
            shareholderProfile: {
              findUnique,
              findMany,
              update,
              create: createProfile,
              delete: deleteProfile,
            },
            shareholderDocument: {
              create: createDocument,
              findUnique: findDocument,
              delete: deleteDocument,
              deleteMany: deleteManyDocuments,
            },
            $transaction: transaction,
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
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenant: { type: 'SHAREHOLDER' },
    });
    update.mockResolvedValue({ id: 'profile-1' });

    await service.updateShareholder(
      'profile-1',
      {
        numberOfShares: 50,
        datePaid: '2026-08-18T00:00:00.000Z',
      },
      {
        userId: 'shareholder-1',
        tenantId: 'shared-shareholders',
        role: 'SHAREHOLDER_ADMIN',
      },
    );

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

  it('allows the scoped shareholder manager to update shareholder profiles', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenant: { type: 'SHAREHOLDER' },
    });
    update.mockResolvedValue({ id: 'profile-1' });

    await expect(
      service.updateShareholder(
        'profile-1',
        { numberOfShares: 25 },
        {
          userId: 'shared-shareholder-1',
          tenantId: 'shared-shareholders',
          role: 'SHAREHOLDER_MANAGER',
        },
      ),
    ).resolves.toEqual({ id: 'profile-1' });
  });

  it('rejects an empty profile update', async () => {
    await expect(
      service.updateShareholder(
        'profile-1',
        {},
        {
          userId: 'shareholder-1',
          tenantId: 'shared-shareholders',
          role: 'SHAREHOLDER_ADMIN',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps ordinary shareholders from editing shareholder profiles', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenant: { type: 'SHAREHOLDER' },
    });

    await expect(
      service.updateShareholder(
        'profile-1',
        { numberOfShares: 25 },
        {
          userId: 'shareholder-1',
          tenantId: 'shared-shareholders',
          role: 'SHAREHOLDER',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates profiles only under a shareholder tenant', async () => {
    createProfile.mockResolvedValue({ id: 'profile-new' });

    await expect(
      service.createShareholder({ tenantName: 'New Shareholder' }),
    ).resolves.toEqual({ id: 'profile-new' });
    expect(createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenant: {
            create: { name: 'New Shareholder', type: 'SHAREHOLDER' },
          },
        }),
      }),
    );
  });

  it('deletes a shareholder profile and its documents but leaves its tenant', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenant: { type: 'SHAREHOLDER' },
      documents: [],
    });
    deleteManyDocuments.mockResolvedValue({ count: 0 });
    deleteProfile.mockResolvedValue({ id: 'profile-1' });

    await expect(
      service.deleteShareholder('profile-1', {
        userId: 'shareholder-1',
        tenantId: 'shared-shareholders',
        role: 'SHAREHOLDER_ADMIN',
      }),
    ).resolves.toEqual({ success: true });

    expect(deleteManyDocuments).toHaveBeenCalledWith({
      where: { shareholderProfileId: 'profile-1' },
    });
    expect(deleteProfile).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
    });
  });

  it('allows a shareholder admin to add a document to any profile', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenantId: 'tenant-1',
      tenant: { type: 'SHAREHOLDER' },
    });
    createDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.addDocument(
        'profile-1',
        {
          documentName: 'Receipt',
          documentUrl: 'https://files.example.test/receipt.pdf',
        },
        {
          userId: 'admin-1',
          tenantId: 'tenant-admin',
          role: 'SHAREHOLDER_ADMIN',
        },
      ),
    ).resolves.toEqual({ id: 'document-1' });
  });

  it('allows the scoped shareholder manager to add shareholder documents', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenantId: 'tenant-1',
      tenant: { type: 'SHAREHOLDER' },
    });
    createDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.addDocument(
        'profile-1',
        { documentName: 'KYC record' },
        {
          userId: 'shared-shareholder-1',
          tenantId: 'shared-shareholders',
          role: 'SHAREHOLDER_MANAGER',
        },
      ),
    ).resolves.toEqual({ id: 'document-1' });
  });

  it('allows a shareholder admin to add a document without a hosted URL', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenantId: 'tenant-1',
      tenant: { type: 'SHAREHOLDER' },
    });
    createDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.addDocument(
        'profile-1',
        { documentName: 'Receipt' },
        {
          userId: 'admin-1',
          tenantId: 'tenant-admin',
          role: 'SHAREHOLDER_ADMIN',
        },
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

  it('keeps ordinary shareholders from adding documents to shareholder profiles', async () => {
    findUnique.mockResolvedValue({
      id: 'profile-1',
      tenantId: 'tenant-1',
      tenant: { type: 'SHAREHOLDER' },
    });
    createDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.addDocument(
        'profile-1',
        {
          documentName: 'Receipt',
          documentUrl: 'https://files.example.test/receipt.pdf',
        },
        {
          userId: 'user-1',
          tenantId: 'shared-shareholders',
          role: 'SHAREHOLDER',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows an admin to delete a shareholder document', async () => {
    findDocument.mockResolvedValue({
      id: 'document-1',
      shareholderProfileId: 'profile-1',
      shareholderProfile: {
        tenantId: 'tenant-1',
        tenant: { type: 'SHAREHOLDER' },
      },
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

  it('allows a shareholder admin to delete any shareholder document', async () => {
    findDocument.mockResolvedValue({
      id: 'document-1',
      shareholderProfileId: 'profile-1',
      shareholderProfile: {
        tenantId: 'tenant-1',
        tenant: { type: 'SHAREHOLDER' },
      },
    });
    deleteDocument.mockResolvedValue({ id: 'document-1' });

    await expect(
      service.deleteDocument('profile-1', 'document-1', {
        userId: 'shareholder-admin-1',
        tenantId: 'tenant-admin',
        role: 'SHAREHOLDER_ADMIN',
      }),
    ).resolves.toEqual({ success: true });
  });

  it('keeps ordinary shareholders from deleting documents in shareholder tenants', async () => {
    findDocument.mockResolvedValue({
      id: 'document-1',
      shareholderProfileId: 'profile-1',
      shareholderProfile: {
        tenantId: 'tenant-1',
        tenant: { type: 'SHAREHOLDER' },
      },
    });

    await expect(
      service.deleteDocument('profile-1', 'document-1', {
        userId: 'user-1',
        tenantId: 'shared-shareholders',
        role: 'SHAREHOLDER',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents shareholder admins from deleting documents in other tenant types', async () => {
    findDocument.mockResolvedValue({
      id: 'document-1',
      shareholderProfileId: 'profile-1',
      shareholderProfile: {
        tenantId: 'tenant-1',
        tenant: { type: 'CLIENT' },
      },
    });

    await expect(
      service.deleteDocument('profile-1', 'document-1', {
        userId: 'user-1',
        tenantId: 'shared-shareholders',
        role: 'SHAREHOLDER_ADMIN',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
