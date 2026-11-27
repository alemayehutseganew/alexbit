import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { RfpController } from './rfp.controller';
import { RfpService } from './rfp.service';

@Module({
  imports: [AuthModule, DocumentsModule],
  controllers: [RfpController],
  providers: [RfpService],
})
export class RfpModule {}
