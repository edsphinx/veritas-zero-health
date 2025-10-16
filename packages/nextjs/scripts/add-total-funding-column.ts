/**
 * Script to add totalFunding column to studies table
 * This is a fallback when prisma db push doesn't work
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTotalFundingColumn() {
  try {
    console.log('Adding totalFunding column to studies table...');

    // Check if column exists
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'studies' AND column_name = 'totalFunding'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ` as any[];

    if (result.length > 0) {
      console.log('✓ totalFunding column already exists');
      return;
    }

    // Add the column with default value
    await prisma.$executeRaw`
      ALTER TABLE studies
      ADD COLUMN IF NOT EXISTS "totalFunding" TEXT DEFAULT '0.00'
    `;

    console.log('✓ Successfully added totalFunding column');
  } catch (error) {
    console.error('Error adding totalFunding column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTotalFundingColumn();
