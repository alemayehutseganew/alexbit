import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateShareholderDocumentDto } from './dto/create-shareholder-document.dto';
import { UpdateShareholderDto } from './dto/update-shareholder.dto';
import { ShareholderService } from './shareholder.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

@Controller('api/shareholder')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ShareholderController {
  constructor(private readonly shareholderService: ShareholderService) {}

  @Get('profile')
  findProfileForTenant(@Req() request: AuthenticatedRequest) {
    return this.shareholderService.findProfileForTenant(request.user.tenantId);
  }

  @Get('all')
  findAllShareholders() {
    return this.shareholderService.findAllShareholders();
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateShareholder(
    @Param('id') id: string,
    @Body() data: UpdateShareholderDto,
  ) {
    return this.shareholderService.updateShareholder(id, data);
  }

  @Post(':id/documents')
  @Roles('ADMIN', 'SUPER_ADMIN')
  addDocument(
    @Param('id') id: string,
    @Body() data: CreateShareholderDocumentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shareholderService.addDocument(id, data, request.user);
  }

  @Post(':id/documents/upload')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addUploadedDocument(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const upload = await request.file();
    if (!upload) {
      throw new BadRequestException('A document file is required');
    }
    return this.shareholderService.addUploadedDocument(id, upload, request.user);
  }

  @Get(':profileId/documents/:documentId/file')
  async downloadDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() request: AuthenticatedRequest,
    @Res() reply: FastifyReply,
  ) {
    const file = await this.shareholderService.getDocumentFile(
      profileId,
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

  @Get('company-documents')
  getCompanyDocuments() {
    return this.shareholderService.getCompanyDocuments();
  }

  @Post('company-documents/upload')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addCompanyDocument(@Req() request: AuthenticatedRequest) {
    const upload = await request.file();
    if (!upload) {
      throw new BadRequestException('A document file is required');
    }
    return this.shareholderService.addCompanyDocument(upload, request.user);
  }

  @Get('company-documents/:documentId/file')
  async downloadCompanyDocument(
    @Param('documentId') documentId: string,
    @Req() request: AuthenticatedRequest,
    @Res() reply: FastifyReply,
  ) {
    const file =
      await this.shareholderService.getCompanyDocumentFile(documentId);
    return reply
      .type(file.mimeType)
      .header(
        'Content-Disposition',
        `inline; filename="${file.fileName.replaceAll('"', '')}"`,
      )
      .send(file.buffer);
  }

  @Delete(':profileId/documents/:documentId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  deleteDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shareholderService.deleteDocument(
      profileId,
      documentId,
      request.user,
    );
  }
}
