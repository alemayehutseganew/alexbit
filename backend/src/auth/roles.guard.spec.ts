import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
jest.mock('../documents/documents.service', () => ({
  DocumentService: class DocumentService {},
}));
import { RfpController } from '../rfp/rfp.controller';
import { ShareholderController } from '../shareholder/shareholder.controller';
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

  it('keeps public RFP creation open and restricts review routes', () => {
    expect(
      Reflect.getMetadata('__guards__', RfpController.prototype.createRfp),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(ROLES_KEY, RfpController.prototype.createRfp),
    ).toBeUndefined();

    for (const method of ['findAll', 'updateStatus'] as const) {
      expect(
        Reflect.getMetadata('__guards__', RfpController.prototype[method]),
      ).toHaveLength(2);
      expect(
        Reflect.getMetadata(ROLES_KEY, RfpController.prototype[method]),
      ).toEqual(['ADMIN', 'SUPER_ADMIN']);
    }

    expect(
      Reflect.getMetadata('__guards__', RfpController),
    ).toBeUndefined();
  });

  it('grants shareholder admins access to shareholder write routes', () => {
    const shareholderWriteRoutes = [
      [ShareholderController.prototype, 'updateShareholder'],
      [ShareholderController.prototype, 'addDocument'],
      [ShareholderController.prototype, 'addUploadedDocument'],
      [ShareholderController.prototype, 'addCompanyDocument'],
      [ShareholderController.prototype, 'deleteDocument'],
    ] as const;

    for (const [controller, method] of shareholderWriteRoutes) {
      expect(Reflect.getMetadata(ROLES_KEY, controller[method])).toEqual([
        'ADMIN',
        'SUPER_ADMIN',
        'SHAREHOLDER_ADMIN',
      ]);
    }
  });
});
