import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from './authenticated-user';
import { ROLES_KEY } from './roles.decorator';

type RequestWithUser = {
  user?: AuthenticatedUser;
};

const readOnlyShareholderEmail = 'shareholder@primehorizon.com';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AuthenticatedUser['role'][]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      return false;
    }

    if (
      request.user.email?.trim().toLowerCase() === readOnlyShareholderEmail
    ) {
      return false;
    }

    return roles.includes(request.user.role);
  }
}
