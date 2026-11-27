import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  // Use environment variables if available, otherwise fallback to the specified credentials
  const superAdminPassword = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD || 'SuperAdmin@2026';
  const shareholderPassword = process.env.BOOTSTRAP_SHAREHOLDER_PASSWORD || 'Primehorizon@2026';
  const shareholderAdminPassword = process.env.BOOTSTRAP_SHAREHOLDER_ADMIN_PASSWORD || 'ShAdmin@2026';

  const [
    superAdminPasswordHash,
    shareholderPasswordHash,
    shareholderAdminPasswordHash,
  ] = await Promise.all([
    bcrypt.hash(superAdminPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderAdminPassword, SALT_ROUNDS),
  ]);

  await prisma.$transaction(async (transaction) => {
    // 1. Provision Superadmin
    await transaction.user.upsert({
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

    // 2. Provision Shared Shareholder (Read-Only)
    await transaction.user.upsert({
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

    // 3. Provision Shareholder Admin (Full CRUD on Documents)
    const shareholderAdminTenant =
      (await transaction.tenant.findFirst({
        where: { name: 'Shareholder Admin', type: 'SHAREHOLDER' },
        select: { id: true },
      })) ??
      (await transaction.tenant.create({
        data: { name: 'Shareholder Admin', type: 'SHAREHOLDER' },
        select: { id: true },
      }));

    await transaction.user.upsert({
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
  });

  console.log('✅ Superadmin, shareholder, and shareholder admin accounts provisioned successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Failed to provision accounts', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });