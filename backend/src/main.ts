import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { getAllowedCorsOrigins } from './cors';

async function bootstrap(): Promise<void> {
  try {
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

    const port = Number(process.env.PORT ?? 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid PORT value: ${process.env.PORT}`);
    }

    await app.listen(port, '0.0.0.0');
    console.log(`Backend successfully started on port ${port}`);
  } catch (error: unknown) {
    console.error('FATAL STARTUP ERROR:', error);
    process.exit(1);
  }
}

void bootstrap();
