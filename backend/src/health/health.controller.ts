import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok'; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      const errorType = error instanceof Error ? error.name : typeof error;
      this.logger.error(`Database health check failed: ${errorType}`);
      throw new ServiceUnavailableException('Database unavailable');
    }

    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
