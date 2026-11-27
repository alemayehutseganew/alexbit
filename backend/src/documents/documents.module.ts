import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsController } from './documents.controller';
import { DocumentService } from './documents.service';

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentsModule {}
