import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { RfpController } from './rfp.controller';
import { RfpService } from './rfp.service';

@Module({
  imports: [DocumentsModule],
  controllers: [RfpController],
  providers: [RfpService],
})
export class RfpModule {}
