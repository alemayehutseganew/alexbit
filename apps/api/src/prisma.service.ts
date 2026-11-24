import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@primehorizon/domain/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
