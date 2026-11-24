import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import type { LightMyRequestResponse } from 'fastify';
import { AppModule } from './app.module';

let serverlessApp: NestFastifyApplication | null = null;

async function createApp(): Promise<NestFastifyApplication> {
  if (serverlessApp) {
    return serverlessApp;
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  serverlessApp = app;
  return app;
}

export async function handler(request: Request): Promise<Response> {
  const app = await createApp();
  const fastify = app.getHttpAdapter().getInstance();
  const url = new URL(request.url);
  const method = request.method.toUpperCase() as
    'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';
  const result = (await fastify.inject({
    method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body ? await request.text() : undefined,
  })) as unknown as LightMyRequestResponse;
  return new Response(result.payload, {
    status: result.statusCode,
    headers: result.headers as HeadersInit,
  });
}

export async function bootstrap() {
  const app = await createApp();
  await app
    .getHttpAdapter()
    .getInstance()
    .listen({
      port: Number(process.env.PORT ?? 3001),
      host: '0.0.0.0',
    });
}

if (!process.env.VERCEL) {
  void bootstrap().catch((error: unknown) => {
    console.error('Failed to start API', error);
    process.exitCode = 1;
  });
}
