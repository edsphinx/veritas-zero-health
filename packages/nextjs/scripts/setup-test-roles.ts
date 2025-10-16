/**
 * Setup Test Roles Script
 *
 * Automatically assigns roles to the test wallets defined in .env
 * This sets up the complete test environment with all roles
 *
 * Usage: pnpm tsx scripts/setup-test-roles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test wallet addresses from .env
const TEST_WALLETS = {
  researchers: [
    { address: '0xF39ca026377a84DE1ee49cB62bAC4e3aba8c73f7', name: 'Researcher 1' },
    { address: '0x037115d0179D5259D39BDa543Ab817b1398EDecE', name: 'Researcher 2' },
  ],
  sponsors: [
    { address: '0x3886DAcbd70796443676FC99bC91d04cCcB61Ce4', name: 'Sponsor 1' },
    { address: '0xFB92cD8d7F8ba6B3A56a31c3D690626e3431A0D3', name: 'Sponsor 2' },
  ],
  clinics: [
    { address: '0x37bfCf97873D7b2f45A795B0943549Bef52e59c8', name: 'Clinic 1' },
    { address: '0xF6391DAF33b77cD5edAA2b8B41dAd54C1BFEB189', name: 'Clinic 2' },
  ],
  patients: [
    { address: '0x6048bDA3729f1DECce656A5cce787692b5e501eE', name: 'Patient 1' },
    { address: '0x65BB3C31C356d7B9dc6871187ec5B908d9baa804', name: 'Patient 2' },
  ],
};

async function setupRole(address: string, role: string, name: string) {
  try {
    const normalizedAddress = address.toLowerCase();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { address: normalizedAddress },
    });

    const oldRole = existingUser?.role || null;

    // Upsert user with role
    const user = await prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {
        role: role,
        displayName: name,
        isVerified: true,
        verifiedAt: new Date(),
        lastActiveAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        role: role,
        displayName: name,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    // Create audit trail if role changed
    if (oldRole !== role) {
      await prisma.roleChange.create({
        data: {
          userId: user.id,
          fromRole: oldRole,
          toRole: role,
          changedBy: 'system',
          reason: 'Setup test environment',
        },
      });
    }

    console.log(`✅ ${name}: ${address} → ${role}`);
    return user;
  } catch (error) {
    console.error(`❌ Error setting up ${name}:`, error);
    throw error;
  }
}

async function setupAllRoles() {
  console.log('🔧 Setting up test roles...\n');

  try {
    // Setup Researchers
    console.log('👨‍🔬 Setting up Researchers...');
    for (const researcher of TEST_WALLETS.researchers) {
      await setupRole(researcher.address, 'researcher', researcher.name);
    }

    // Setup Sponsors
    console.log('\n💰 Setting up Sponsors...');
    for (const sponsor of TEST_WALLETS.sponsors) {
      await setupRole(sponsor.address, 'sponsor', sponsor.name);
    }

    // Setup Clinics
    console.log('\n🏥 Setting up Clinics...');
    for (const clinic of TEST_WALLETS.clinics) {
      await setupRole(clinic.address, 'clinic', clinic.name);
    }

    // Setup Patients
    console.log('\n👤 Setting up Patients...');
    for (const patient of TEST_WALLETS.patients) {
      await setupRole(patient.address, 'patient', patient.name);
    }

    console.log('\n✅ All test roles set up successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Researchers: ${TEST_WALLETS.researchers.length}`);
    console.log(`   - Sponsors: ${TEST_WALLETS.sponsors.length}`);
    console.log(`   - Clinics: ${TEST_WALLETS.clinics.length}`);
    console.log(`   - Patients: ${TEST_WALLETS.patients.length}`);
    console.log(`   - Total: ${TEST_WALLETS.researchers.length + TEST_WALLETS.sponsors.length + TEST_WALLETS.clinics.length + TEST_WALLETS.patients.length} wallets configured`);

  } catch (error) {
    console.error('\n❌ Fatal error setting up roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAllRoles()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
