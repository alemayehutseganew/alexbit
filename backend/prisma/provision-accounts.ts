import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  // Use environment variables if available, otherwise fallback to the specified passwords
  const superAdminPassword = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD || 'SuperAdmin@2026';
  const shareholderPassword = process.env.BOOTSTRAP_SHAREHOLDER_PASSWORD || 'Primehorizon@2026';

  const [superAdminPasswordHash, shareholderPasswordHash] = await Promise.all([
    bcrypt.hash(superAdminPassword, SALT_ROUNDS),
    bcrypt.hash(shareholderPassword, SALT_ROUNDS),
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

    // 2. Provision Shared Shareholder
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
  });

  console.log('✅ Superadmin and shareholder accounts provisioned successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Failed to provision accounts', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });