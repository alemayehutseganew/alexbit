import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClientService } from './client.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

@Controller('api/client')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('CLIENT', 'CLIENT_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('documents')
  getDocuments(@Req() request: AuthenticatedRequest) {
    return this.clientService.findDocuments(request.user);
  }

  @Post('documents/upload')
  async uploadDocument(@Req() request: AuthenticatedRequest) {
    const upload = await request.file();
    if (!upload) throw new BadRequestException('A document file is required');
    return this.clientService.addDocument(upload, request.user);
  }

  @Get('documents/:documentId/file')
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Req() request: AuthenticatedRequest,
    @Res() reply: FastifyReply,
  ) {
    const file = await this.clientService.getDocumentFile(
      documentId,
      request.user,
    );
    return reply
      .type(file.mimeType)
      .header(
        'Content-Disposition',
        `inline; filename="${file.fileName.replaceAll('"', '')}"`,
      )
      .send(file.buffer);
  }

  @Get('invoices')
  getInvoices(@Req() request: AuthenticatedRequest) {
    return this.clientService.findInvoices(request.user);
  }

  @Get('support/tickets')
  getSupportTickets(@Req() request: AuthenticatedRequest) {
    return this.clientService.findSupportTickets(request.user);
  }

  @Post('support/tickets')
  createSupportTicket(
    @Req() request: AuthenticatedRequest,
    @Body() body: { subject: string; message: string; priority?: string },
  ) {
    return this.clientService.createSupportTicket(body, request.user);
  }
}
