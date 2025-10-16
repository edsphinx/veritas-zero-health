/**
 * Script to check studies in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking studies in database...\n');

    // Count studies
    const count = await prisma.study.count();
    console.log(`📊 Total studies: ${count}\n`);

    if (count > 0) {
      // Get all studies
      const studies = await prisma.study.findMany({
        orderBy: { createdAt: 'desc' },
      });

      console.log('📋 Studies:\n');
      studies.forEach((study: any, index: any) => {
        console.log(`${index + 1}. ${study.title}`);
        console.log(`   ID: ${study.id}`);
        console.log(`   Registry ID: ${study.registryId}`);
        console.log(`   Escrow ID: ${study.escrowId}`);
        console.log(`   Status: ${study.status}`);
        console.log(`   Researcher: ${study.researcherAddress}`);
        console.log(`   Created: ${study.createdAt}`);
        console.log(`   Escrow TX: ${study.escrowTxHash}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No studies found in database!');
      console.log('\nPossible reasons:');
      console.log('1. Study was created before indexer was implemented');
      console.log('2. POST /api/studies/index was not called after creation');
      console.log('3. There was an error during indexing');
      console.log('\nCheck browser console or network tab for errors.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
