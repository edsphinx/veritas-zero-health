/**
 * Add SuperAdmin Script
 *
 * Utility to add a wallet address as SuperAdmin in the database
 * Usage: pnpm tsx scripts/add-superadmin.ts <wallet-address>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSuperAdmin(address: string) {
  try {
    console.log('🔧 Adding SuperAdmin...');
    console.log('Address:', address);

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Upsert user with SUPERADMIN role
    const user = await prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {
        role: 'superadmin',
        lastActiveAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        role: 'superadmin',
        isVerified: true,
        verifiedAt: new Date(),
        displayName: 'SuperAdmin',
      },
    });

    console.log('✅ SuperAdmin added successfully!');
    console.log('User:', user);

    // Create audit trail
    await prisma.roleChange.create({
      data: {
        userId: user.id,
        fromRole: user.role === 'superadmin' ? 'superadmin' : null,
        toRole: 'superadmin',
        changedBy: 'system',
        reason: 'Added via add-superadmin script',
      },
    });

    console.log('✅ Audit trail created');

  } catch (error) {
    console.error('❌ Error adding SuperAdmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get address from command line
const address = process.argv[2];

if (!address) {
  console.error('Usage: pnpm tsx scripts/add-superadmin.ts <wallet-address>');
  process.exit(1);
}

if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
  console.error('❌ Invalid Ethereum address format');
  process.exit(1);
}

addSuperAdmin(address)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
