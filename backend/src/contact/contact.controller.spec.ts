import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { getAllowedCorsOrigins } from '../cors';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';

jest.mock('../schemas/contact.schema', () => {
  const { z } = jest.requireActual('zod');
  return {
    ContactSchema: z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(254),
      phone: z.string().trim().min(7).max(24),
      subject: z.enum(['GENERAL', 'PARTNERSHIP', 'SUPPORT', 'MEDIA']),
      message: z.string().trim().min(20).max(4000),
    }),
  };
});

describe('ContactController', () => {
  let app: INestApplication;
  const jwtSecret = 'test-only-secret-that-is-at-least-thirty-two-characters';
  const contactService = {
    createMessage: jest.fn(),
    findAllAdmin: jest.fn(),
  };

  function signToken(role: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN') {
    return jwt.sign(
      {
        sub: 'user-1',
        iss: 'primehorizon-api',
        aud: 'primehorizon-api',
        tenantId: 'tenant-1',
        role,
      },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '5m' },
    );
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = jwtSecret;
    process.env.JWT_ISSUER = 'primehorizon-api';
    process.env.JWT_AUDIENCE = 'primehorizon-api';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [ContactController],
      providers: [
        JwtStrategy,
        RolesGuard,
        Reflector,
        {
          provide: ContactService,
          useValue: contactService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const allowedOrigins = getAllowedCorsOrigins({
      ...process.env,
      CORS_ORIGINS: 'https://example.com',
    });
    app.use((req, res, next) => {
      const origin =
        typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
      if (origin && !allowedOrigins.includes(origin)) {
        res.status(403).json({ statusCode: 403, message: 'Origin forbidden' });
        return;
      }
      next();
    });
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('handles OPTIONS preflight for an authorized origin', async () => {
    await request(app.getHttpServer())
      .options('/api/contact')
      .set('Origin', 'https://alexbit-wine.vercel.app')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'https://alexbit-wine.vercel.app')
      .expect('Access-Control-Allow-Credentials', 'true');
  });

  it('rejects OPTIONS preflight for an unauthorized origin', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/contact')
      .set('Origin', 'https://unauthorized.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows OPTIONS preflight for Authorization requests', async () => {
    await request(app.getHttpServer())
      .options('/api/contact/admin/all')
      .set('Origin', 'https://alexbit-wine.vercel.app')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization')
      .expect(204)
      .expect('Access-Control-Allow-Headers', /Authorization/i);
  });

  it('allows POST requests without an Origin header', async () => {
    contactService.createMessage.mockResolvedValue({ id: 'message-2' });

    await request(app.getHttpServer())
      .post('/api/contact')
      .send({
        fullName: 'Server Client',
        email: 'server@example.com',
        phone: '0914230500',
        subject: 'GENERAL',
        message: 'Please contact me about your services.',
      })
      .expect(201);
  });

  it('accepts a valid public contact submission', async () => {
    contactService.createMessage.mockResolvedValue({ id: 'message-1' });

    await request(app.getHttpServer())
      .post('/api/contact')
      .set('Origin', 'https://alexbit-wine.vercel.app')
      .send({
        fullName: 'Alex Example',
        email: 'alex@example.com',
        phone: '0914230500',
        subject: 'GENERAL',
        message: 'Please contact me about your services.',
      })
      .expect(201)
      .expect({ id: 'message-1' });

    expect(contactService.createMessage).toHaveBeenCalledWith({
      fullName: 'Alex Example',
      email: 'alex@example.com',
      phone: '0914230500',
      subject: 'GENERAL',
      message: 'Please contact me about your services.',
    });
  });

  it('rejects invalid contact submissions', async () => {
    await request(app.getHttpServer())
      .post('/api/contact')
      .set('Origin', 'https://alexbit-wine.vercel.app')
      .send({
        fullName: '',
        email: 'not-an-email',
        phone: '',
        subject: 'UNKNOWN',
        message: '',
      })
      .expect(400);

    expect(contactService.createMessage).not.toHaveBeenCalled();
  });

  it('keeps the admin contact endpoint protected', async () => {
    await request(app.getHttpServer())
      .get('/api/contact/admin/all')
      .expect(401);

    expect(contactService.findAllAdmin).not.toHaveBeenCalled();
  });

  it('rejects an invalid admin token', async () => {
    await request(app.getHttpServer())
      .get('/api/contact/admin/all')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(contactService.findAllAdmin).not.toHaveBeenCalled();
  });

  it('rejects an authenticated non-admin user', async () => {
    const token = signToken('CLIENT');

    await request(app.getHttpServer())
      .get('/api/contact/admin/all')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(contactService.findAllAdmin).not.toHaveBeenCalled();
  });

  it('allows an authenticated ADMIN user', async () => {
    const token = signToken('ADMIN');
    contactService.findAllAdmin.mockResolvedValue([{ id: 'message-1' }]);

    await request(app.getHttpServer())
      .get('/api/contact/admin/all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect([{ id: 'message-1' }]);

    expect(contactService.findAllAdmin).toHaveBeenCalled();
  });
});
