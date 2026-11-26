import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const databaseUrl =
      process.env.DATABASE_URL_POOLED ??
      process.env.DATABASE_URL ??
      process.env.PRISMA_DATABASE_URL ??
      process.env.POSTGRES_URL;

    super(
      databaseUrl
        ? {
            datasources: {
              db: { url: databaseUrl },
            },
          }
        : undefined,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
