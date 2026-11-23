import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@primehorizon/domain/prisma';
import { PrismaService } from '../prisma.service';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let queryRaw: jest.MockedFunction<
    (statement: Prisma.Sql) => Promise<unknown>
  >;
  let capturedQuery: Prisma.Sql | undefined;
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    capturedQuery = undefined;
    queryRaw = jest.fn((statement: Prisma.Sql) => {
      capturedQuery = statement;
      return Promise.resolve([]);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: { $queryRaw: queryRaw },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ data: [{ embedding: Array(1536).fill(0.25) }] }),
          { status: 200 },
        ),
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('scopes vector searches to the authenticated tenant', async () => {
    await expect(
      service.searchSimilarDocuments('tenant-1', 'project scope'),
    ).resolves.toEqual([]);

    if (!capturedQuery) {
      throw new Error('The Prisma query was not captured');
    }
    expect(capturedQuery.strings.join('')).toContain('"tenantId" = ');
    expect(capturedQuery.values).toContain('tenant-1');
  });
});
