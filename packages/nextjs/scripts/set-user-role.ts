/**
 * Set User Role Script
 *
 * Utility to set any role for a wallet address in the database
 * Usage: pnpm tsx scripts/set-user-role.ts <wallet-address> <role>
 *
 * Available roles: patient, clinic, researcher, sponsor, admin, superadmin
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ROLES = ['patient', 'clinic', 'researcher', 'sponsor', 'admin', 'superadmin', 'guest'] as const;
type ValidRole = typeof VALID_ROLES[number];

async function setUserRole(address: string, role: ValidRole) {
  try {
    console.log('🔧 Setting user role...');
    console.log('Address:', address);
    console.log('Role:', role);

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Get existing user to preserve data
    const existingUser = await prisma.user.findUnique({
      where: { address: normalizedAddress },
    });

    const oldRole = existingUser?.role || null;

    // Upsert user with new role
    const user = await prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {
        role: role,
        lastActiveAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        role: role,
        isVerified: true,
        verifiedAt: new Date(),
        displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      },
    });

    console.log('✅ User role updated successfully!');
    console.log('User:', user);

    // Create audit trail
    await prisma.roleChange.create({
      data: {
        userId: user.id,
        fromRole: oldRole,
        toRole: role,
        changedBy: 'system',
        reason: `Set via set-user-role script`,
      },
    });

    console.log('✅ Audit trail created');

  } catch (error) {
    console.error('❌ Error setting user role:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const address = process.argv[2];
const role = process.argv[3]?.toLowerCase();

if (!address || !role) {
  console.error('Usage: pnpm tsx scripts/set-user-role.ts <wallet-address> <role>');
  console.error(`Available roles: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
  console.error('❌ Invalid Ethereum address format');
  process.exit(1);
}

if (!VALID_ROLES.includes(role as ValidRole)) {
  console.error(`❌ Invalid role: ${role}`);
  console.error(`Available roles: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

setUserRole(address, role as ValidRole)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
