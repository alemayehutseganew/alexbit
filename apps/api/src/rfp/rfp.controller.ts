import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RfpSchema } from '@primehorizon/domain/rfp-schema';
import { UpdateRfpStatusSchema } from '@primehorizon/domain/rfp-status-schema';
import type { RfpInput } from '@primehorizon/domain/rfp-schema';
import type { UpdateRfpStatusInput } from '@primehorizon/domain/rfp-status-schema';
import type { FastifyReply } from 'fastify';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'nestjs-zod';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DocumentService } from '../documents/documents.service';
import { RfpService } from './rfp.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

@Controller('api/rfp')
export class RfpController {
  constructor(
    private readonly rfpService: RfpService,
    private readonly documentService: DocumentService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(RfpSchema))
  createRfp(@Body() data: RfpInput) {
    return this.rfpService.createRfp(data);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
  findAll(@Req() request: AuthenticatedRequest) {
    return this.rfpService.findAll(request.user.role, request.user.tenantId);
  }

  @Get(':id/pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'PROJECT_MANAGER')
  async getProposalPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Res() reply: FastifyReply,
  ) {
    const pdf = await this.documentService.generateAcceptedRfpProposal(
      id,
      request.user.role,
      request.user.tenantId,
    );
    return reply
      .type('application/pdf')
      .header(
        'Content-Disposition',
        `attachment; filename="proposal-${id}.pdf"`,
      )
      .send(pdf);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
  @UsePipes(new ZodValidationPipe(UpdateRfpStatusSchema))
  updateStatus(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() data: UpdateRfpStatusInput,
  ) {
    return this.rfpService.updateStatus(
      id,
      data.status,
      request.user.role,
      request.user.tenantId,
    );
  }
}
