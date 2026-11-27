import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  const getAllAndOverride = jest.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  function executionContext(role?: string): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows requests when no role restriction is declared', () => {
    getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(executionContext())).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
  });

  it('allows only users with an explicitly permitted role', () => {
    getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(executionContext('ADMIN'))).toBe(true);
    expect(guard.canActivate(executionContext('SHAREHOLDER'))).toBe(false);
    expect(guard.canActivate(executionContext())).toBe(false);
  });
});
