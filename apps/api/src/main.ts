import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';

const server = express();

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
}

void bootstrap();

if (!process.env.VERCEL) {
  server.listen(3001, () => {
    console.log('Server is listening on http://localhost:3001');
  });
}

export default server;
