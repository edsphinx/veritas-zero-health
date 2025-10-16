/**
 * Create Nillion Collections Script
 *
 * Creates all 5 health record collections programmatically using the
 * SecretVaults SDK with the builder API key.
 *
 * Usage:
 *   yarn nillion:create-collections
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
// Try both variable names (with and without NEXT_PUBLIC prefix)
const BUILDER_PRIVATE_KEY = process.env.NILLION_BUILDER_PRIVATE_KEY || process.env.NEXT_PUBLIC_NILLION_PRIVATE_KEY;

// Collection schemas from NILLION_INFO.md
const COLLECTION_SCHEMAS = {
  diagnoses: {
    name: 'Veritas Diagnoses Collection',
    schema: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string",
            "format": "uuid",
            "description": "Unique record identifier"
          },
          "userId": {
            "type": "string",
            "description": "User's DID (did:veritas:...)"
          },
          "timestamp": {
            "type": "number",
            "description": "Unix timestamp when record was created"
          },
          "recordType": {
            "type": "string",
            "enum": ["diagnoses"],
            "description": "Type of health record"
          },
          "data": {
            "type": "object",
            "description": "Encrypted health data payload",
            "properties": {
              "%share": {
                "type": "string",
                "description": "Encrypted share of the health data"
              }
            },
            "required": ["%share"]
          }
        },
        "required": ["_id", "userId", "timestamp", "recordType", "data"]
      }
    }
  },
  biomarkers: {
    name: 'Veritas Biomarkers Collection',
    schema: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string",
            "format": "uuid",
            "description": "Unique record identifier"
          },
          "userId": {
            "type": "string",
            "description": "User's DID (did:veritas:...)"
          },
          "timestamp": {
            "type": "number",
            "description": "Unix timestamp when record was created"
          },
          "recordType": {
            "type": "string",
            "enum": ["biomarkers"],
            "description": "Type of health record"
          },
          "data": {
            "type": "object",
            "description": "Encrypted health data payload",
            "properties": {
              "%share": {
                "type": "string",
                "description": "Encrypted share of the biomarker data"
              }
            },
            "required": ["%share"]
          }
        },
        "required": ["_id", "userId", "timestamp", "recordType", "data"]
      }
    }
  },
  vitals: {
    name: 'Veritas Vitals Collection',
    schema: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string",
            "format": "uuid",
            "description": "Unique record identifier"
          },
          "userId": {
            "type": "string",
            "description": "User's DID (did:veritas:...)"
          },
          "timestamp": {
            "type": "number",
            "description": "Unix timestamp when record was created"
          },
          "recordType": {
            "type": "string",
            "enum": ["vitals"],
            "description": "Type of health record"
          },
          "data": {
            "type": "object",
            "description": "Encrypted health data payload",
            "properties": {
              "%share": {
                "type": "string",
                "description": "Encrypted share of the vital signs data"
              }
            },
            "required": ["%share"]
          }
        },
        "required": ["_id", "userId", "timestamp", "recordType", "data"]
      }
    }
  },
  medications: {
    name: 'Veritas Medications Collection',
    schema: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string",
            "format": "uuid",
            "description": "Unique record identifier"
          },
          "userId": {
            "type": "string",
            "description": "User's DID (did:veritas:...)"
          },
          "timestamp": {
            "type": "number",
            "description": "Unix timestamp when record was created"
          },
          "recordType": {
            "type": "string",
            "enum": ["medications"],
            "description": "Type of health record"
          },
          "data": {
            "type": "object",
            "description": "Encrypted health data payload",
            "properties": {
              "%share": {
                "type": "string",
                "description": "Encrypted share of the medication data"
              }
            },
            "required": ["%share"]
          }
        },
        "required": ["_id", "userId", "timestamp", "recordType", "data"]
      }
    }
  },
  allergies: {
    name: 'Veritas Allergies Collection',
    schema: {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string",
            "format": "uuid",
            "description": "Unique record identifier"
          },
          "userId": {
            "type": "string",
            "description": "User's DID (did:veritas:...)"
          },
          "timestamp": {
            "type": "number",
            "description": "Unix timestamp when record was created"
          },
          "recordType": {
            "type": "string",
            "enum": ["allergies"],
            "description": "Type of health record"
          },
          "data": {
            "type": "object",
            "description": "Encrypted health data payload",
            "properties": {
              "%share": {
                "type": "string",
                "description": "Encrypted share of the allergy data"
              }
            },
            "required": ["%share"]
          }
        },
        "required": ["_id", "userId", "timestamp", "recordType", "data"]
      }
    }
  }
};

async function main() {
  console.log('🔐 Nillion Collections Setup');
  console.log('==============================\n');

  // Validate environment variables
  if (!NILLION_CHAIN_URL || !NILLION_AUTH_URL || !NILLION_NODE_URLS) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NILLION_CHAIN_URL');
    console.error('   - NILLION_AUTH_URL');
    console.error('   - NILLION_NODE_URLS');
    console.error('\nPlease set them in your .env file.');
    process.exit(1);
  }

  // Parse node URLs
  const dbs = NILLION_NODE_URLS.split(',').map((url) => url.trim());
  console.log(`📍 Nillion Configuration:`);
  console.log(`   Chain: ${NILLION_CHAIN_URL}`);
  console.log(`   Auth: ${NILLION_AUTH_URL}`);
  console.log(`   Nodes: ${dbs.length} nodes`);
  dbs.forEach((url, i) => console.log(`     ${i + 1}. ${url}`));
  console.log();

  // Create or load keypair
  let keypair: Keypair;
  if (BUILDER_PRIVATE_KEY) {
    console.log('🔑 Using existing builder keypair from NILLION_BUILDER_PRIVATE_KEY');
    keypair = Keypair.from(BUILDER_PRIVATE_KEY);
  } else {
    console.log('🔑 Generating new builder keypair...');
    keypair = Keypair.generate();
    console.log(`   Private Key (hex): ${keypair.privateKey('hex')}`);
    console.log(`   Public Key (hex): ${keypair.publicKey('hex')}`);
    console.log(`   DID: ${keypair.toDidString()}`);
    console.log('\n⚠️  IMPORTANT: Save your private key in .env.local as NILLION_BUILDER_PRIVATE_KEY');
    console.log(`   NILLION_BUILDER_PRIVATE_KEY=${keypair.privateKey('hex')}\n`);
  }

  try {
    // Initialize SecretVault Builder Client
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

    // Check subscription status
    console.log('🔍 Checking subscription status...');
    const subscriptionStatus = await client.subscriptionStatus();
    if (!subscriptionStatus.subscribed) {
      console.error('❌ No active subscription found!');
      console.error('   Please subscribe at: https://nilpay.vercel.app/');
      console.error(`   Using DID: ${keypair.toDidString()}`);
      process.exit(1);
    }
    console.log('✅ Active subscription found');
    if (subscriptionStatus.details) {
      console.log(`   Expires: ${subscriptionStatus.details.expiresAt.toString()}`);
      console.log(`   Renewable: ${subscriptionStatus.details.renewableAt.toString()}`);
    }
    console.log();

    // Refresh root token before creating collections
    console.log('🔄 Refreshing authentication token...');
    await client.refreshRootToken();
    console.log('✅ Token refreshed\n');

    // Create collections
    console.log('📦 Creating Collections...\n');
    const collectionIds: Record<string, string> = {};

    for (const [type, config] of Object.entries(COLLECTION_SCHEMAS)) {
      const collectionId = uuidv4();
      console.log(`Creating ${config.name}...`);
      console.log(`   ID: ${collectionId}`);
      console.log(`   Type: standard`);

      try {
        const result = await client.createCollection({
          _id: collectionId,
          type: 'standard',
          name: config.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schema: config.schema as any,
        });

        console.log(`   ✅ Created successfully on ${Object.keys(result).length} nodes`);
        collectionIds[type] = collectionId;
      } catch (error) {
        console.error(`   ❌ Failed to create collection: ${error}`);
        throw error;
      }
      console.log();
    }

    // Print summary
    console.log('✅ All collections created successfully!\n');
    console.log('📋 Update your .env.local with these collection IDs:\n');
    console.log(`NILLION_COLLECTION_DIAGNOSES=${collectionIds.diagnoses}`);
    console.log(`NILLION_COLLECTION_BIOMARKERS=${collectionIds.biomarkers}`);
    console.log(`NILLION_COLLECTION_VITALS=${collectionIds.vitals}`);
    console.log(`NILLION_COLLECTION_MEDICATIONS=${collectionIds.medications}`);
    console.log(`NILLION_COLLECTION_ALLERGIES=${collectionIds.allergies}`);
    console.log();

    console.log('🔗 View collections at:');
    console.log(`   https://collection-explorer.nillion.com/collections/${collectionIds.diagnoses}`);
    console.log();

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();
