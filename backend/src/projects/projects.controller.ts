import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { ProjectsService } from './projects.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

@Controller('api/projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAllForTenant(@Req() request: AuthenticatedRequest) {
    if (
      request.user.role === 'ADMIN' ||
      request.user.role === 'SUPER_ADMIN' ||
      request.user.role === 'PROJECT_MANAGER'
    ) {
      return this.projectsService.findAllAdmin();
    }
    return this.projectsService.findAllForTenant(request.user.tenantId);
  }

  @Get('admin/all')
  findAllAdmin(@Req() request: AuthenticatedRequest) {
    if (
      request.user.role !== 'ADMIN' &&
      request.user.role !== 'SUPER_ADMIN' &&
      request.user.role !== 'PROJECT_MANAGER'
    ) {
      return this.projectsService.findAllForTenant(request.user.tenantId);
    }

    return this.projectsService.findAllAdmin();
  }
}
