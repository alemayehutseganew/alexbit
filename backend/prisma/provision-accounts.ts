import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

function requireBootstrapPassword(name: string): string {
  const password = process.env[name];
  if (!password || password.length < 12) {
    throw new Error(`${name} must be set to at least 12 characters.`);
  }
  return password;
}

async function main() {
  const superAdminPassword = requireBootstrapPassword(
    'BOOTSTRAP_SUPERADMIN_PASSWORD',
  );
  const shareholderPassword = requireBootstrapPassword(
    'BOOTSTRAP_SHAREHOLDER_PASSWORD',
  );
  const shareholderAdminPassword = requireBootstrapPassword(
    'BOOTSTRAP_SHAREHOLDER_ADMIN_PASSWORD',
  );

  const [
    superAdminPasswordHash,
    shareholderPasswordHash,
    shareholderAdminPasswordHash,
  ] = await Promise.all([
    bcrypt.hash(superAdminPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderAdminPassword, SALT_ROUNDS),
  ]);

  // 1. Provision Superadmin (No transaction to prevent P2028 timeout)
  await prisma.user.upsert({
    where: { email: 'superadmin@primehorizon.com' },
    create: {
      email: 'superadmin@primehorizon.com',
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN',
      tenant: {
        create: { name: 'PrimeHorizon Admin', type: 'INTERNAL' },
      },
    },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: superAdminPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Superadmin provisioned');

  // 2. Provision Shared Shareholder (Read-Only)
  await prisma.user.upsert({
    where: { email: 'shareholder@primehorizon.com' },
    create: {
      email: 'shareholder@primehorizon.com',
      firstName: 'All',
      lastName: 'Shareholders',
      passwordHash: shareholderPasswordHash,
      role: 'SHAREHOLDER',
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
      passwordHash: shareholderPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
      role: 'SHAREHOLDER',
    },
  });
  console.log('✅ Shareholder provisioned');

  // 3. Provision Shareholder Admin (Full CRUD on Documents)
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
      passwordHash: shareholderAdminPasswordHash,
      role: 'SHAREHOLDER_ADMIN',
    },
    update: {
      tenantId: shareholderAdminTenant.id,
      firstName: 'Shareholder',
      lastName: 'Admin',
      passwordHash: shareholderAdminPasswordHash,
      resetToken: null,
      resetTokenExpiry: null,
      role: 'SHAREHOLDER_ADMIN',
    },
  });
  console.log('✅ Shareholder Admin provisioned');

  console.log('🎉 All accounts provisioned successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Failed to provision accounts', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });