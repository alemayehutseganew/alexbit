import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllForTenant(tenantId: string) {
    try {
      return await this.prisma.project.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        'Failed to fetch tenant projects',
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('Unable to fetch projects');
      }

      throw error;
    }
  }

  async findAllAdmin() {
    try {
      return await this.prisma.project.findMany({
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(
        'Failed to fetch all projects',
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('Unable to fetch projects');
      }

      throw error;
    }
  }
}
