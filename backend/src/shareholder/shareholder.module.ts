import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { ShareholderController } from './shareholder.controller';
import { ShareholderService } from './shareholder.service';

@Module({
  imports: [AuthModule],
  controllers: [ShareholderController],
  providers: [PrismaService, ShareholderService],
})
export class ShareholderModule {}
