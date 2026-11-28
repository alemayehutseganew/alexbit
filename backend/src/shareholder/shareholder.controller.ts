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
import { CreateShareholderDto } from './dto/create-shareholder.dto';
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

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER')
  createShareholder(@Body() data: CreateShareholderDto) {
    return this.shareholderService.createShareholder(data);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER')
  updateShareholder(
    @Param('id') id: string,
    @Body() data: UpdateShareholderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shareholderService.updateShareholder(id, data, request.user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER')
  deleteShareholder(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shareholderService.deleteShareholder(id, request.user);
  }

  @Post(':id/documents')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER')
  addDocument(
    @Param('id') id: string,
    @Body() data: CreateShareholderDocumentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shareholderService.addDocument(id, data, request.user);
  }

  @Post(':id/documents/upload')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER')
  async addUploadedDocument(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const upload = await request.file();
    if (!upload) {
      throw new BadRequestException('A document file is required');
    }
    return this.shareholderService.addUploadedDocument(
      id,
      upload,
      request.user,
    );
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
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN')
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
  @Roles('ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER')
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
