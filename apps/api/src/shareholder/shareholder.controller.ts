import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
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
  @Roles('SHAREHOLDER')
  findProfileForTenant(@Req() request: AuthenticatedRequest) {
    return this.shareholderService.findProfileForTenant(request.user.tenantId);
  }

  @Get('all')
  @Roles('SHAREHOLDER', 'ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
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
  @Roles('SHAREHOLDER', 'ADMIN', 'SUPER_ADMIN')
  addDocument(
    @Param('id') id: string,
    @Body() data: CreateShareholderDocumentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.shareholderService.addDocument(id, data, request.user);
  }

  @Delete(':profileId/documents/:documentId')
  @Roles('SHAREHOLDER', 'ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER')
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
