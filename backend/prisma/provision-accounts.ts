import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

function bootstrapPassword(name: string): string | undefined {
  const password = process.env[name];
  if (password && password.length < 12) {
    throw new Error(`${name} must be at least 12 characters long.`);
  }
  return password || undefined;
}

async function main() {
  const superAdminPassword = bootstrapPassword('BOOTSTRAP_SUPERADMIN_PASSWORD');
  const shareholderPassword = bootstrapPassword(
    'BOOTSTRAP_SHAREHOLDER_PASSWORD',
  );
  const shareholderAdminPassword = bootstrapPassword(
    'BOOTSTRAP_SHAREHOLDER_ADMIN_PASSWORD',
  );

  if (
    !superAdminPassword &&
    !shareholderPassword &&
    !shareholderAdminPassword
  ) {
    throw new Error('Set at least one BOOTSTRAP_*_PASSWORD before provisioning.');
  }

  if (superAdminPassword) {
    const passwordHash = await bcrypt.hash(superAdminPassword, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: 'superadmin@primehorizon.com' },
      create: {
        email: 'superadmin@primehorizon.com',
        firstName: 'Super',
        lastName: 'Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        tenant: {
          create: { name: 'PrimeHorizon Admin', type: 'INTERNAL' },
        },
      },
      update: {
        firstName: 'Super',
        lastName: 'Admin',
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('✅ Superadmin provisioned');
  }

  if (shareholderPassword) {
    const passwordHash = await bcrypt.hash(shareholderPassword, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: 'shareholder@primehorizon.com' },
      create: {
        email: 'shareholder@primehorizon.com',
        firstName: 'All',
        lastName: 'Shareholders',
        passwordHash,
        role: 'SHAREHOLDER_MANAGER',
        tenant: {
          create: {
            name: 'PrimeHorizon Shareholders',
            type: 'SHAREHOLDER',
          },
        },
      },
      update: {
        firstName: 'All',
        lastName: 'Shareholders',
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        role: 'SHAREHOLDER_MANAGER',
      },
    });
    console.log('✅ Shared shareholder manager account provisioned');
  }

  if (shareholderAdminPassword) {
    const passwordHash = await bcrypt.hash(
      shareholderAdminPassword,
      SALT_ROUNDS,
    );
    const shareholderAdminTenant =
      (await prisma.tenant.findFirst({
        where: { name: 'Shareholder Admin', type: 'SHAREHOLDER' },
        select: { id: true },
      })) ??
      (await prisma.tenant.create({
        data: { name: 'Shareholder Admin', type: 'SHAREHOLDER' },
        select: { id: true },
      }));

    await prisma.user.upsert({
      where: { email: 'shareholderadmin@primehorizon.com' },
      create: {
        tenantId: shareholderAdminTenant.id,
        email: 'shareholderadmin@primehorizon.com',
        firstName: 'Shareholder',
        lastName: 'Admin',
        passwordHash,
        role: 'SHAREHOLDER_ADMIN',
      },
      update: {
        tenantId: shareholderAdminTenant.id,
        firstName: 'Shareholder',
        lastName: 'Admin',
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        role: 'SHAREHOLDER_ADMIN',
      },
    });
    console.log('✅ Shareholder Admin provisioned');
  }

  console.log('🎉 Selected accounts provisioned successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Failed to provision accounts', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
