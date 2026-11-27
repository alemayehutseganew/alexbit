import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private retryTimer: NodeJS.Timeout | undefined;
  private retryDelayMs = 5_000;
  private isShuttingDown = false;

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

  onModuleInit(): void {
    void this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      await this.$connect();
      this.retryDelayMs = 5_000;
      this.logger.log('Database connected successfully');
    } catch (error: unknown) {
      const delay = this.retryDelayMs;
      const details =
        error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error(
        `Database connection failed; retrying in ${delay}ms`,
        details,
      );

      if (!this.isShuttingDown) {
        this.retryTimer = setTimeout(() => {
          this.retryTimer = undefined;
          void this.connectWithRetry();
        }, delay);
        this.retryTimer.unref();
        this.retryDelayMs = Math.min(delay * 2, 60_000);
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    await this.$disconnect();
  }
}
