import {
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let create: jest.Mock;
  let findMany: jest.Mock;

  beforeEach(async () => {
    create = jest.fn();
    findMany = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: PrismaService,
          useValue: { contactMessage: { create, findMany } },
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  it('stores the public contact form fields in the database model', async () => {
    const created = { id: 'message-1' };
    create.mockResolvedValue(created);

    await expect(
      service.createMessage({
        fullName: 'Alex Example',
        email: 'alex@example.com',
        phone: '0914230500',
        subject: 'GENERAL',
        message: 'Please contact me about your services.',
      }),
    ).resolves.toEqual(created);

    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Alex Example',
        email: 'alex@example.com',
        phone: '0914230500',
        subject: 'GENERAL',
        message: 'Please contact me about your services.',
      },
    });
  });

  it('logs database errors and returns a descriptive internal server error', async () => {
    const databaseError = new Error('database unavailable');
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();
    create.mockRejectedValue(databaseError);

    await expect(
      service.createMessage({
        fullName: 'Alex Example',
        email: 'alex@example.com',
        phone: '0914230500',
        subject: 'GENERAL',
        message: 'Please contact me about your services.',
      }),
    ).rejects.toThrow(
      new InternalServerErrorException(
        'Unable to save contact message at this time.',
      ),
    );

    expect(loggerError).toHaveBeenCalledWith(
      'Failed to save contact message',
      databaseError.stack,
    );
    loggerError.mockRestore();
  });

  it('returns contact messages newest first for admins', async () => {
    const messages = [{ id: 'message-1' }];
    findMany.mockResolvedValue(messages);

    await expect(service.findAllAdmin()).resolves.toEqual(messages);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });
});
