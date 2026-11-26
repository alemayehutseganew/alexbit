import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaService } from '../prisma.service';
import { RfpController } from './rfp.controller';
import { RfpService } from './rfp.service';

@Module({
  imports: [DocumentsModule],
  controllers: [RfpController],
  providers: [PrismaService, RfpService],
})
export class RfpModule {}
