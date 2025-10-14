/**
 * POST /api/nillion/store
 *
 * Store encrypted health record in Nillion
 *
 * Request Body:
 * {
 *   type: 'diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies',
 *   userId: string (User's DID),
 *   data: any (Health data to encrypt and store)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     recordId: string,
 *     collectionId: string,
 *     timestamp: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@nillion/nuc';
import { SecretVaultBuilderClient } from '@nillion/secretvaults';
import { v4 as uuidv4 } from 'uuid';

// Valid health record types
type HealthRecordType = 'diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies';
const VALID_TYPES: HealthRecordType[] = ['diagnoses', 'biomarkers', 'vitals', 'medications', 'allergies'];

// Environment variables
const NILLION_BUILDER_PRIVATE_KEY = process.env.NILLION_BUILDER_PRIVATE_KEY;
const NILLION_CHAIN_URL = process.env.NILLION_CHAIN_URL!;
const NILLION_AUTH_URL = process.env.NILLION_AUTH_URL!;
const NILLION_NODE_URLS = process.env.NILLION_NODE_URLS!;

// Collection IDs
const COLLECTIONS = {
  diagnoses: process.env.NILLION_COLLECTION_DIAGNOSES!,
  biomarkers: process.env.NILLION_COLLECTION_BIOMARKERS!,
  vitals: process.env.NILLION_COLLECTION_VITALS!,
  medications: process.env.NILLION_COLLECTION_MEDICATIONS!,
  allergies: process.env.NILLION_COLLECTION_ALLERGIES!,
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { type, userId, data } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: data' },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Type assertion after validation
    const validatedType = type as HealthRecordType;

    // Validate userId format (should be a DID)
    if (!userId.startsWith('did:')) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId format. Must be a DID (did:...)' },
        { status: 400 }
      );
    }

    // Validate environment
    if (!NILLION_BUILDER_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing NILLION_BUILDER_PRIVATE_KEY' },
        { status: 500 }
      );
    }

    const collectionId = COLLECTIONS[validatedType];
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: `No collection ID configured for type: ${type}` },
        { status: 500 }
      );
    }

    // Initialize Nillion client
    const dbs = NILLION_NODE_URLS.split(',').map((url) => url.trim());
    const builder = await SecretVaultBuilderClient.from({
      keypair: Keypair.from(NILLION_BUILDER_PRIVATE_KEY),
      urls: {
        chain: NILLION_CHAIN_URL,
        auth: NILLION_AUTH_URL,
        dbs,
      },
      blindfold: { operation: 'store' },
    });

    // Refresh token and store data
    await builder.refreshRootToken();

    const recordId = uuidv4();
    const payload = {
      _id: recordId,
      userId,
      timestamp: Date.now(),
      recordType: type,
      data: {
        '%allot': JSON.stringify(data),
      },
    };

    await builder.createStandardData({
      body: {
        collection: collectionId,
        data: [payload as any],
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        recordId,
        collectionId,
        timestamp: payload.timestamp,
      },
    });
  } catch (error) {
    console.error('Error storing record in Nillion:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store record',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to store records.' },
    { status: 405 }
  );
}
