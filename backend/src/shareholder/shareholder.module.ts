import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ShareholderController } from './shareholder.controller';
import { ShareholderService } from './shareholder.service';

@Module({
  imports: [AuthModule],
  controllers: [ShareholderController],
  providers: [ShareholderService],
})
export class ShareholderModule {}
