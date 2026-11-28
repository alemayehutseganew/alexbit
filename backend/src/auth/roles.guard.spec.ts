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

  function executionContext(
    role?: string,
    email?: string,
  ): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role, email } : undefined,
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

  it('blocks stale manager tokens for the shared read-only shareholder account', () => {
    getAllAndOverride.mockReturnValue(['SHAREHOLDER_MANAGER']);

    expect(
      guard.canActivate(
        executionContext('SHAREHOLDER_MANAGER', 'shareholder@primehorizon.com'),
      ),
    ).toBe(false);
    expect(
      guard.canActivate(
        executionContext('SHAREHOLDER_MANAGER', 'manager@example.com'),
      ),
    ).toBe(true);
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
      [
        ShareholderController.prototype,
        'createShareholder',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'],
      ],
      [
        ShareholderController.prototype,
        'updateShareholder',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'],
      ],
      [
        ShareholderController.prototype,
        'deleteShareholder',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'],
      ],
      [
        ShareholderController.prototype,
        'addDocument',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'],
      ],
      [
        ShareholderController.prototype,
        'addUploadedDocument',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'],
      ],
      [
        ShareholderController.prototype,
        'addCompanyDocument',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN'],
      ],
      [
        ShareholderController.prototype,
        'deleteDocument',
        ['ADMIN', 'SUPER_ADMIN', 'SHAREHOLDER_ADMIN', 'SHAREHOLDER_MANAGER'],
      ],
    ] as const;

    for (const [controller, method, roles] of shareholderWriteRoutes) {
      expect(Reflect.getMetadata(ROLES_KEY, controller[method])).toEqual(roles);
    }
  });
});
