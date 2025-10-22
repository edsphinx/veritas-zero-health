/**
 * Prisma Seed Script
 *
 * Seeds the database with:
 * - Test users from .env (with roles)
 * - Superadmins (deployer + main account)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Superadmins
  const superadmins = [
    {
      address: process.env.DEPLOYER_ADDRESS?.toLowerCase(),
      displayName: 'Deployer',
    },
    {
      address: '0xf5Ac0b87325Bf1B3Eee525EB9646faFD69D2FedC'.toLowerCase(),
      displayName: 'Main Admin',
    },
  ].filter((user) => user.address);

  // Test users from .env
  const testUsers = [
    // Researchers
    {
      address: process.env.RESEARCHER_1_ADDRESS?.toLowerCase(),
      role: 'researcher',
      displayName: 'Researcher 1',
    },
    {
      address: process.env.RESEARCHER_2_ADDRESS?.toLowerCase(),
      role: 'researcher',
      displayName: 'Researcher 2',
    },
    // Sponsors
    {
      address: process.env.SPONSOR_1_ADDRESS?.toLowerCase(),
      role: 'sponsor',
      displayName: 'Sponsor 1',
    },
    {
      address: process.env.SPONSOR_2_ADDRESS?.toLowerCase(),
      role: 'sponsor',
      displayName: 'Sponsor 2',
    },
    // Clinics
    {
      address: process.env.CLINIC_1_ADDRESS?.toLowerCase(),
      role: 'clinic',
      displayName: 'Clinic 1',
    },
    {
      address: process.env.CLINIC_2_ADDRESS?.toLowerCase(),
      role: 'clinic',
      displayName: 'Clinic 2',
    },
    // Patients
    {
      address: process.env.PATIENT_1_ADDRESS?.toLowerCase(),
      role: 'patient',
      displayName: 'Patient 1',
    },
    {
      address: process.env.PATIENT_2_ADDRESS?.toLowerCase(),
      role: 'patient',
      displayName: 'Patient 2',
    },
  ].filter((user) => user.address); // Filter out undefined addresses

  // Upsert superadmins
  for (const admin of superadmins) {
    if (!admin.address) continue;

    await prisma.user.upsert({
      where: { address: admin.address },
      update: {
        role: 'superadmin',
        displayName: admin.displayName,
        isVerified: true,
        humanityScore: 100, // Max score for admins
        lastActiveAt: new Date(),
      },
      create: {
        address: admin.address,
        role: 'superadmin',
        displayName: admin.displayName,
        isVerified: true,
        humanityScore: 100,
        verifiedAt: new Date(),
      },
    });

    console.log(`✅ Upserted superadmin: ${admin.displayName} (${admin.address})`);
  }

  // Upsert test users
  for (const user of testUsers) {
    if (!user.address || !user.role) continue;

    // Valid Prisma UserRole values: 'patient' | 'researcher' | 'sponsor' | 'clinic' | 'superadmin'
    type PrismaUserRole = 'patient' | 'researcher' | 'sponsor' | 'clinic' | 'superadmin';

    await prisma.user.upsert({
      where: { address: user.address },
      update: {
        role: user.role as PrismaUserRole,
        displayName: user.displayName,
        isVerified: true, // Test users are pre-verified
        humanityScore: 20, // Minimum passing score
        lastActiveAt: new Date(),
      },
      create: {
        address: user.address,
        role: user.role as PrismaUserRole,
        displayName: user.displayName,
        isVerified: true,
        humanityScore: 20,
        verifiedAt: new Date(),
      },
    });

    console.log(`✅ Upserted user: ${user.displayName} (${user.address})`);
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
