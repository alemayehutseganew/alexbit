import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type RfpStatus } from '@prisma/client';
import type { RfpInput } from '../schemas/rfp.schema';
import type { AppRole } from '../auth/authenticated-user';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RfpService {
  constructor(private readonly prisma: PrismaService) {}

  async createRfp(data: RfpInput) {
    return this.prisma.$transaction(async (transaction) => {
      const tenant =
        (await transaction.tenant.findFirst({
          where: { name: data.organization, type: 'CLIENT' },
        })) ??
        (await transaction.tenant.create({
          data: { name: data.organization, type: 'CLIENT' },
        }));

      const rfp = await transaction.rfpRequest.create({
        data: { ...data, tenantId: tenant.id },
      });

      return { ...rfp, tenantId: tenant.id };
    });
  }

  async findAll(role: AppRole, tenantId: string) {
    try {
      return await this.prisma.rfpRequest.findMany({
        ...(role === 'PROJECT_MANAGER' ? { where: { tenantId } } : {}),
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('Unable to fetch RFP requests');
      }

      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: RfpStatus,
    role: AppRole,
    tenantId: string,
  ) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const rfp = await transaction.rfpRequest.findUnique({
          where: { id },
          select: {
            tenantId: true,
            organization: true,
            sector: true,
            projectDetails: true,
          },
        });

        if (!rfp || (role === 'PROJECT_MANAGER' && rfp.tenantId !== tenantId)) {
          throw new NotFoundException('RFP not found');
        }

        if (status === 'ACCEPTED') {
          const transition = await transaction.rfpRequest.updateMany({
            where: { id, status: { not: 'ACCEPTED' } },
            data: { status },
          });

          if (transition.count > 0) {
            await transaction.project.create({
              data: {
                tenantId: rfp.tenantId,
                title: `${rfp.sector} Project for ${rfp.organization}`,
                description: rfp.projectDetails,
                status: 'PLANNING',
              },
            });
          }

          const updatedRfp = await transaction.rfpRequest.findUnique({
            where: { id },
            include: { tenant: true },
          });
          if (!updatedRfp) {
            throw new NotFoundException('RFP not found');
          }

          return updatedRfp;
        }

        return transaction.rfpRequest.update({
          where: { id },
          data: { status },
          include: { tenant: true },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('RFP not found');
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('Unable to update RFP status');
      }

      throw error;
    }
  }
}
