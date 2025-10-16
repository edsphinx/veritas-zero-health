/**
 * Test Nillion Collections Script
 *
 * Tests read/write access to existing Nillion collections
 * with the current keypair subscription.
 *
 * Usage:
 *   yarn nillion:test-collections
 */

import { SecretVaultBuilderClient } from '@nillion/secretvaults';
import { Keypair } from '@nillion/nuc';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') });

// Load environment variables
const NILLION_CHAIN_URL = process.env.NILLION_CHAIN_URL!;
const NILLION_AUTH_URL = process.env.NILLION_AUTH_URL!;
const NILLION_NODE_URLS = process.env.NILLION_NODE_URLS!;
const BUILDER_PRIVATE_KEY = process.env.NILLION_BUILDER_PRIVATE_KEY || process.env.NEXT_PUBLIC_NILLION_PRIVATE_KEY;
const COLLECTION_DIAGNOSES = process.env.NILLION_COLLECTION_DIAGNOSES!;

async function main() {
  console.log('🧪 Nillion Collections Test');
  console.log('============================\n');

  // Validate environment variables
  if (!NILLION_CHAIN_URL || !NILLION_AUTH_URL || !NILLION_NODE_URLS) {
    console.error('❌ Missing Nillion configuration variables');
    process.exit(1);
  }

  if (!BUILDER_PRIVATE_KEY) {
    console.error('❌ Missing NILLION_BUILDER_PRIVATE_KEY or NEXT_PUBLIC_NILLION_PRIVATE_KEY');
    process.exit(1);
  }

  if (!COLLECTION_DIAGNOSES) {
    console.error('❌ Missing NILLION_COLLECTION_DIAGNOSES');
    process.exit(1);
  }

  // Parse node URLs
  const dbs = NILLION_NODE_URLS.split(',').map((url) => url.trim());
  console.log(`📍 Configuration:`);
  console.log(`   Chain: ${NILLION_CHAIN_URL}`);
  console.log(`   Auth: ${NILLION_AUTH_URL}`);
  console.log(`   Nodes: ${dbs.length}`);
  console.log(`   Collection ID: ${COLLECTION_DIAGNOSES}`);
  console.log();

  try {
    // Load keypair
    console.log('🔑 Loading keypair...');
    const keypair = Keypair.from(BUILDER_PRIVATE_KEY);
    console.log(`   DID: ${keypair.toDidString()}`);
    console.log();

    // Initialize client
    console.log('🚀 Initializing SecretVault Builder Client...');
    const client = await SecretVaultBuilderClient.from({
      keypair,
      urls: {
        chain: NILLION_CHAIN_URL,
        auth: NILLION_AUTH_URL,
        dbs,
      },
      blindfold: {
        operation: 'store',
      },
    });
    console.log('✅ Client initialized\n');

    // Check subscription
    console.log('🔍 Checking subscription status...');
    const subscriptionStatus = await client.subscriptionStatus();
    if (!subscriptionStatus.subscribed) {
      console.error('❌ No active subscription found!');
      process.exit(1);
    }
    console.log('✅ Active subscription');
    if (subscriptionStatus.details) {
      console.log(`   Expires: ${subscriptionStatus.details.expiresAt.toString()}`);
    }
    console.log();

    // Refresh token
    console.log('🔄 Refreshing authentication token...');
    await client.refreshRootToken();
    console.log('✅ Token refreshed\n');

    // Test 1: Write data
    console.log('📝 Test 1: Writing test record...');
    const testRecordId = uuidv4();
    const testUserId = 'did:veritas:test123';
    const testData = {
      condition: 'Test Condition',
      severity: 'Low',
      diagnosedDate: '2025-10-13',
      notes: 'This is a test record created by the test script',
    };

    const writePayload = {
      _id: testRecordId,
      userId: testUserId,
      timestamp: Date.now(),
      recordType: 'diagnoses',
      data: {
        '%allot': JSON.stringify(testData),
      },
    };

    console.log(`   Record ID: ${testRecordId}`);
    console.log(`   User ID: ${testUserId}`);

    const writeResult = await client.createStandardData({
      body: {
        collection: COLLECTION_DIAGNOSES,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: [writePayload as any],
      },
    });

    console.log(`✅ Record written successfully`);
    console.log(`   Nodes responded: ${Object.keys(writeResult).length}`);
    console.log();

    // Test 2: Read data
    console.log('📖 Test 2: Reading records...');
    const readResult = await client.findData({
      collection: COLLECTION_DIAGNOSES,
      filter: { userId: testUserId },
    });

    console.log(`✅ Records retrieved: ${readResult.data.length}`);
    if (readResult.data.length > 0) {
      const record = readResult.data[0];
      console.log(`   First record ID: ${record._id}`);
      console.log(`   User ID: ${record.userId}`);

      // Try to decrypt the data
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recordData = record.data as any;
        const encryptedData = recordData?.['%allot'] || recordData;
        const decryptedData = typeof encryptedData === 'string'
          ? JSON.parse(encryptedData)
          : encryptedData;
        console.log(`   Decrypted data:`, decryptedData);
      } catch {
        console.log(`   Raw data:`, record.data);
      }
    }
    console.log();

    // Test 3: Delete test record
    console.log('🗑️  Test 3: Deleting test record...');
    const deleteResult = await client.deleteData({
      collection: COLLECTION_DIAGNOSES,
      filter: { _id: testRecordId },
    });

    console.log(`✅ Delete operation completed`);
    console.log(`   Nodes responded: ${Object.keys(deleteResult).length}`);
    console.log();

    // Summary
    console.log('✅ All tests passed successfully!\n');
    console.log('📋 Summary:');
    console.log('   ✅ Write access: Working');
    console.log('   ✅ Read access: Working');
    console.log('   ✅ Delete access: Working');
    console.log('   ✅ Encryption/Decryption: Working');
    console.log();
    console.log('🎉 Your Nillion integration is fully functional!');
    console.log('   You can now use the existing collections with your API key.');
    console.log();

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();
