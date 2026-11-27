import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ContactInput } from '../schemas/contact.schema';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createMessage(data: ContactInput) {
    try {
      return await this.prisma.contactMessage.create({
        data: {
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to save contact message',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Unable to save contact message at this time.',
      );
    }
  }

  async findAllAdmin() {
    try {
      return await this.prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to fetch contact messages',
        );
      }

      throw error;
    }
  }
}
