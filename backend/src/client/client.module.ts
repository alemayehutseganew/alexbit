import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  imports: [AuthModule],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
