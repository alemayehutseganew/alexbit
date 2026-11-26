import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [AuthModule],
  controllers: [ContactController],
  providers: [PrismaService, ContactService],
})
export class ContactModule {}
