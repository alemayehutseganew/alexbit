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
  const corsOrigins = [
    'https://alexbit-wine.vercel.app',
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.CORS_ORIGINS,
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        process.env.NODE_ENV !== 'production' ||
        corsOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed: ${origin}`), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    | 'DELETE'
    | 'GET'
    | 'HEAD'
    | 'OPTIONS'
    | 'PATCH'
    | 'POST'
    | 'PUT';
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

async function bootstrap() {
  const app = await createApp();
  await app.getHttpAdapter().getInstance().listen({
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
