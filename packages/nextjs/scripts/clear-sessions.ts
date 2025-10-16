/**
 * Clear All Sessions Script
 *
 * Clears all active NextAuth sessions from the database
 * This forces all users to sign in again with fresh tokens
 *
 * Usage: pnpm tsx scripts/clear-sessions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSessions() {
  try {
    console.log('🧹 Clearing all active sessions...');

    // Delete all NextAuth sessions
    const result = await prisma.nextAuthSession.deleteMany({});

    console.log(`✅ Deleted ${result.count} active sessions`);
    console.log('');
    console.log('All users will need to sign in again.');
    console.log('This will ensure they get fresh JWT tokens with updated roles.');

  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
