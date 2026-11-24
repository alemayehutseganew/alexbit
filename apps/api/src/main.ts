import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { createCorsOriginCallback, isCorsOriginAllowed } from './cors';

const server = express();

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors({
    origin: createCorsOriginCallback(),
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
}

const initializationPromise = bootstrap();

server.use(async (_request, response, next) => {
  const origin = _request.headers.origin;
  if (!isCorsOriginAllowed(origin)) {
    response.status(403).json({ statusCode: 403, message: 'Origin forbidden' });
    return;
  }

  try {
    await initializationPromise;
    next();
  } catch (error) {
    console.error('Failed to initialize API server', error);
    response
      .status(503)
      .json({ statusCode: 503, message: 'Service unavailable' });
  }
});

export default server;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  void initializationPromise
    .then(() => {
      server.listen(process.env.PORT ?? 3001, () => {
        console.log('Server running on port ' + (process.env.PORT ?? 3001));
      });
    })
    .catch((error: unknown) => {
      console.error('Failed to initialize API server', error);
      process.exitCode = 1;
    });
}
