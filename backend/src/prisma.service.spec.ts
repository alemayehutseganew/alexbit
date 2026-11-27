import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let prisma: PrismaService;
  let connect: jest.SpyInstance<Promise<void>>;

  beforeEach(() => {
    jest.useFakeTimers();
    prisma = new PrismaService();
    connect = jest.spyOn(prisma, '$connect');
    jest.spyOn(prisma, '$disconnect').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('does not block module initialization when the database is unavailable', async () => {
    connect.mockRejectedValue(new Error('database unavailable'));

    expect(prisma.onModuleInit()).toBeUndefined();
    await jest.advanceTimersByTimeAsync(0);

    expect(connect).toHaveBeenCalledTimes(1);
    await prisma.onModuleDestroy();
  });

  it('retries a failed connection and stops after the database recovers', async () => {
    connect
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce();

    prisma.onModuleInit();
    await jest.advanceTimersByTimeAsync(0);
    expect(connect).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5_000);
    expect(connect).toHaveBeenCalledTimes(2);

    await prisma.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(connect).toHaveBeenCalledTimes(2);
  });
});
