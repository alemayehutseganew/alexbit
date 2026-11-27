import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = Array.from(
    new Set(
      [
        process.env.FRONTEND_URL,
        'https://primehorizonplc.vercel.app',
        'http://localhost:3000',
      ]
        .filter((origin): origin is string => Boolean(origin))
        .map((origin) => new URL(origin).origin),
    ),
  );

  app.enableCors({
    origin: allowedOrigins,
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
