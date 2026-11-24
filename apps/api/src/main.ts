import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';

const server = express();

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'https://alexbit-wine.vercel.app',
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

void bootstrap();

export default server;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  server.listen(process.env.PORT ?? 3001, () => {
    console.log('Server running on port ' + (process.env.PORT ?? 3001));
  });
}
