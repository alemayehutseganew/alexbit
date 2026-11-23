import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import type { FastifyReply } from 'fastify';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentService } from './documents.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

@Controller('api/documents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
export class DocumentsController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('proposal/:rfpId')
  async downloadProposal(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Req() request: AuthenticatedRequest,
    @Res() reply: FastifyReply,
  ) {
    const pdf = await this.documentService.generateAcceptedRfpProposal(
      rfpId,
      request.user.role,
      request.user.tenantId,
    );

    return reply
      .type('application/pdf')
      .header(
        'Content-Disposition',
        `attachment; filename="proposal-${rfpId}.pdf"`,
      )
      .send(pdf);
  }
}
