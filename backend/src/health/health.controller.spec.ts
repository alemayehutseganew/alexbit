import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma.service';

describe('HealthController', () => {
  let app: INestApplication;
  let queryRaw: jest.Mock;

  beforeAll(async () => {
    queryRaw = jest.fn();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { $queryRaw: queryRaw },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('GET /health/live succeeds without checking the database', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect({ status: 'ok' });

    expect(queryRaw).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok when the database is reachable', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.text).toMatch(
          /^\{"status":"ok","timestamp":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"\}$/,
        );
      });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('GET /health returns 503 when the database is unavailable', async () => {
    queryRaw.mockRejectedValueOnce(new Error('database connection failed'));

    await request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect((response) => {
        expect(response.body.message).toBe('Database unavailable');
      });
  });
});
