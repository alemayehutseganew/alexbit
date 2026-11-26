import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { RfpService } from './rfp.service';

describe('RfpService', () => {
  let service: RfpService;
  let rfpRequest: {
    findMany: jest.Mock;
  };
  let transaction: {
    tenant: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    rfpRequest: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    project: { create: jest.Mock };
  };

  beforeEach(async () => {
    rfpRequest = {
      findMany: jest.fn(),
    };

    transaction = {
      tenant: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      rfpRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      project: { create: jest.fn() },
    };

    const prisma = {
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
      rfpRequest,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RfpService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RfpService>(RfpService);
  });

  it('reuses a CLIENT tenant with the same organization name', async () => {
    const tenant = { id: 'tenant-1' };
    const rfp = { id: 'rfp-1', tenantId: tenant.id };
    transaction.tenant.findFirst.mockResolvedValue(tenant);
    transaction.rfpRequest.create.mockResolvedValue(rfp);

    const result = await service.createRfp({
      organization: 'Acme',
      contactName: 'Alex Example',
      contactEmail: 'alex@example.com',
      phone: '0914230500',
      sector: 'IT_SUPPORT',
      projectDetails:
        'A project description that is at least fifty characters long.',
    });

    expect(transaction.tenant.findFirst).toHaveBeenCalledWith({
      where: { name: 'Acme', type: 'CLIENT' },
    });
    expect(transaction.tenant.create).not.toHaveBeenCalled();
    expect(result).toEqual(rfp);
  });

  it('creates a CLIENT tenant when the organization is new', async () => {
    const tenant = { id: 'tenant-2' };
    transaction.tenant.findFirst.mockResolvedValue(null);
    transaction.tenant.create.mockResolvedValue(tenant);
    transaction.rfpRequest.create.mockResolvedValue({
      id: 'rfp-2',
      tenantId: tenant.id,
    });

    await service.createRfp({
      organization: 'New Organization',
      contactName: 'Alex Example',
      contactEmail: 'alex@example.com',
      phone: '0914230500',
      sector: 'IT_SUPPORT',
      projectDetails:
        'A project description that is at least fifty characters long.',
    });

    expect(transaction.tenant.create).toHaveBeenCalledWith({
      data: { name: 'New Organization', type: 'CLIENT' },
    });
    expect(transaction.rfpRequest.create).toHaveBeenCalledWith({
      data: {
        organization: 'New Organization',
        contactName: 'Alex Example',
        contactEmail: 'alex@example.com',
        phone: '0914230500',
        sector: 'IT_SUPPORT',
        projectDetails:
          'A project description that is at least fifty characters long.',
        tenantId: tenant.id,
      },
    });
  });

  it('returns RFPs with tenant data ordered newest first', async () => {
    const records = [{ id: 'rfp-1', tenant: { id: 'tenant-1' } }];
    rfpRequest.findMany.mockResolvedValue(records);

    await expect(service.findAll('SUPER_ADMIN', 'tenant-1')).resolves.toEqual(
      records,
    );
    expect(rfpRequest.findMany).toHaveBeenCalledWith({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });

    await service.findAll('PROJECT_MANAGER', 'tenant-1');
    expect(rfpRequest.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('updates and returns an RFP status with tenant data', async () => {
    const updated = {
      id: 'rfp-1',
      status: 'UNDER_REVIEW',
      tenant: { id: 'tenant-1' },
    };
    transaction.rfpRequest.findUnique.mockResolvedValue({
      tenantId: 'tenant-1',
      organization: 'Acme',
      projectDetails: 'A project description.',
    });
    transaction.rfpRequest.update.mockResolvedValue(updated);

    await expect(
      service.updateStatus('rfp-1', 'UNDER_REVIEW', 'SUPER_ADMIN', 'tenant-1'),
    ).resolves.toEqual(updated);
    expect(transaction.rfpRequest.update).toHaveBeenCalledWith({
      where: { id: 'rfp-1' },
      data: { status: 'UNDER_REVIEW' },
      include: { tenant: true },
    });
    expect(transaction.project.create).not.toHaveBeenCalled();
  });

  it('creates a planning project in the status transaction when accepting an RFP', async () => {
    const updatedRfp = {
      id: 'rfp-1',
      status: 'ACCEPTED',
      tenant: { id: 'tenant-1' },
    };
    const createdProject = { id: 'project-1' };
    transaction.rfpRequest.findUnique
      .mockResolvedValueOnce({
        tenantId: 'tenant-1',
        organization: 'Acme',
        sector: 'IT_SUPPORT',
        projectDetails: 'Build a secure client portal.',
      })
      .mockResolvedValueOnce(updatedRfp);
    transaction.rfpRequest.updateMany.mockResolvedValue({ count: 1 });
    transaction.project.create.mockResolvedValue(createdProject);

    await expect(
      service.updateStatus('rfp-1', 'ACCEPTED', 'ADMIN', 'tenant-1'),
    ).resolves.toEqual(updatedRfp);

    expect(transaction.project.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        title: 'IT_SUPPORT Project for Acme',
        description: 'Build a secure client portal.',
        status: 'PLANNING',
      },
    });
  });

  it('does not create a duplicate project when an accepted RFP is updated again', async () => {
    const updatedRfp = {
      id: 'rfp-1',
      status: 'ACCEPTED',
      tenant: { id: 'tenant-1' },
    };
    transaction.rfpRequest.findUnique
      .mockResolvedValueOnce({
        tenantId: 'tenant-1',
        organization: 'Acme',
        sector: 'IT_SUPPORT',
        projectDetails: 'Build a secure client portal.',
      })
      .mockResolvedValueOnce(updatedRfp);
    transaction.rfpRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateStatus('rfp-1', 'ACCEPTED', 'ADMIN', 'tenant-1'),
    ).resolves.toEqual(updatedRfp);

    expect(transaction.project.create).not.toHaveBeenCalled();
  });
});
