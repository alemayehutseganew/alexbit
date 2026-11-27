import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { getAllowedCorsOrigins } from './cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.register(multipart);

  app.enableCors({
    origin: getAllowedCorsOrigins(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on port ${port}`);
}

void bootstrap().catch((error: unknown) => {
  console.error('Failed to start API server', error);
  process.exitCode = 1;
});
