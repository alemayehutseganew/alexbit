import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@primehorizon/domain/prisma';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForTenant(tenantId: string) {
    try {
      return await this.prisma.project.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('Unable to fetch projects');
      }

      throw error;
    }
  }
}
