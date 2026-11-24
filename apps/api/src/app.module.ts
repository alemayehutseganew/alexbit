import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { DocumentsModule } from './documents/documents.module';
import { ProjectsModule } from './projects/projects.module';
import { RfpModule } from './rfp/rfp.module';
import { ShareholderModule } from './shareholder/shareholder.module';
import { ClientModule } from './client/client.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AiModule,
    ContactModule,
    DocumentsModule,
    RfpModule,
    ProjectsModule,
    ShareholderModule,
    ClientModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
