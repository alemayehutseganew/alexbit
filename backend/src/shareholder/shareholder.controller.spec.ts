import { PayloadTooLargeException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { ShareholderController } from './shareholder.controller';
import { ShareholderService } from './shareholder.service';

type AuthenticatedRequest = FastifyRequest & { user: AuthenticatedUser };

describe('ShareholderController uploads', () => {
  const user: AuthenticatedUser = {
    userId: 'shareholder-admin',
    tenantId: 'tenant-admin',
    role: 'SHAREHOLDER_ADMIN',
  };

  it.each(['KYC', 'company document'])(
    'allows uploads up to 10 MB for %s files',
    async (uploadType) => {
      const upload = { filename: 'document.pdf' };
      const file = jest.fn().mockResolvedValue(upload);
      const service = {
        addUploadedDocument: jest.fn().mockResolvedValue({ id: 'kyc-1' }),
        addCompanyDocument: jest.fn().mockResolvedValue({ id: 'company-1' }),
      } as unknown as ShareholderService;
      const controller = new ShareholderController(service);
      const request = { user, file } as unknown as AuthenticatedRequest;

      if (uploadType === 'KYC') {
        await controller.addUploadedDocument('profile-1', request);
      } else {
        await controller.addCompanyDocument(request);
      }

      expect(file).toHaveBeenCalledWith({
        limits: { fileSize: 10 * 1024 * 1024 },
      });
    },
  );

  it('returns a clear 413 response when a KYC upload exceeds the limit', async () => {
    const file = jest.fn().mockRejectedValue(
      Object.assign(new Error('request file too large'), {
        code: 'FST_REQ_FILE_TOO_LARGE',
      }),
    );
    const service = {
      addUploadedDocument: jest.fn(),
      addCompanyDocument: jest.fn(),
    } as unknown as ShareholderService;
    const controller = new ShareholderController(service);
    const request = { user, file } as unknown as AuthenticatedRequest;

    await expect(
      controller.addUploadedDocument('profile-1', request),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });
});
