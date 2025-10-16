/**
 * Clear Database Script
 *
 * Deletes all data from the database tables
 * Usage: pnpm clear-db
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');

    // Delete in order to respect foreign key constraints
    console.log('Deleting sessions...');
    await prisma.session.deleteMany({});

    console.log('Deleting role changes...');
    await prisma.roleChange.deleteMany({});

    console.log('Deleting users...');
    await prisma.user.deleteMany({});

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
