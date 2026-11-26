import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AiService } from './ai.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

@Controller('api/ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('CLIENT', 'SHAREHOLDER', 'SUPER_ADMIN', 'PROJECT_MANAGER')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('search')
  searchSimilarDocuments(
    @Req() request: AuthenticatedRequest,
    @Body() body: { query?: unknown },
  ) {
    if (
      typeof body?.query !== 'string' ||
      !body.query.trim() ||
      body.query.length > 4000
    ) {
      throw new BadRequestException(
        'query must be a non-empty string of at most 4000 characters',
      );
    }

    return this.aiService.searchSimilarDocuments(
      request.user.tenantId,
      body.query.trim(),
    );
  }
}
