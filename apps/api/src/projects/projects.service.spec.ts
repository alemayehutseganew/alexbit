import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: { project: { findMany } },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('filters every project query by the supplied tenant ID', async () => {
    const projects = [{ id: 'project-1', tenantId: 'tenant-1' }];
    findMany.mockResolvedValue(projects);

    await expect(service.findAllForTenant('tenant-1')).resolves.toEqual(
      projects,
    );
    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns all projects with tenant names ordered newest first for admins', async () => {
    const projects = [
      {
        id: 'project-1',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', name: 'Acme' },
      },
    ];
    findMany.mockResolvedValue(projects);

    await expect(service.findAllAdmin()).resolves.toEqual(projects);
    expect(findMany).toHaveBeenCalledWith({
      include: { tenant: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });
});
