import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  imports: [AuthModule],
  controllers: [ClientController],
  providers: [PrismaService, ClientService],
})
export class ClientModule {}
