import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

function getBootstrapPassword(name: string): string | undefined {
  const password = process.env[name];
  if (password !== undefined && password.length < 12) {
    throw new Error(`${name} must be at least 12 characters.`);
  }
  return password;
}

async function main() {
  const superAdminPassword = getBootstrapPassword(
    'BOOTSTRAP_SUPERADMIN_PASSWORD',
  );
  const shareholderPassword = getBootstrapPassword(
    'BOOTSTRAP_SHAREHOLDER_PASSWORD',
  );
  const shareholderAdminPassword = getBootstrapPassword(
    'BOOTSTRAP_SHAREHOLDER_ADMIN_PASSWORD',
  );

  if (
    !superAdminPassword &&
    !shareholderPassword &&
    !shareholderAdminPassword
  ) {
    throw new Error(
      'Set at least one BOOTSTRAP_*_PASSWORD variable to provision an account.',
    );
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
    console.log('✅ Shared shareholder admin account provisioned');
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

  console.log('🎉 Requested account provisioning completed.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Failed to provision accounts', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
