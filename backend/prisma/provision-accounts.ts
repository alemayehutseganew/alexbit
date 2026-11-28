import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  // Hardcoded fallbacks so you don't need terminal environment variables
  const superAdminPassword = 'SuperAdmin@2026';
  const shareholderPassword = 'Primehorizon@2026';
  const shareholderAdminPassword = 'ShAdmin@2026';

  const [
    superAdminPasswordHash,
    shareholderPasswordHash,
    shareholderAdminPasswordHash,
  ] = await Promise.all([
    bcrypt.hash(superAdminPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderAdminPassword, SALT_ROUNDS),
  ]);

  // 1. Provision Superadmin
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

  // 2. Provision Shared Shareholder (Manager - CRUD Access)
  await prisma.user.upsert({
    where: { email: 'shareholder@primehorizon.com' },
    create: {
      email: 'shareholder@primehorizon.com',
      firstName: 'All',
      lastName: 'Shareholders',
      passwordHash: shareholderPasswordHash,
      role: 'SHAREHOLDER_MANAGER', // Updated role
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
      role: 'SHAREHOLDER_MANAGER', // Updated role
    },
  });
  console.log('✅ Shared shareholder manager account provisioned');

  // 3. Provision Shareholder Admin (Read-Only or separate access)
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