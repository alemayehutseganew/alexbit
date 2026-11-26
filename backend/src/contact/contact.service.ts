import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ContactInput } from '../schemas/contact.schema';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ContactService {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to save contact message',
        );
      }

      throw error;
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
