import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [PrismaService, AiService],
})
export class AiModule {}
