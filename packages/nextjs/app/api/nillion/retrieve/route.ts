/**
 * GET /api/nillion/retrieve
 *
 * Retrieve encrypted health records from Nillion
 *
 * Query Parameters:
 * - type: 'diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies' (required)
 * - userId: string (optional, filter by user's DID)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     records: Array<{
 *       id: string,
 *       userId: string,
 *       timestamp: number,
 *       type: string,
 *       data: any (decrypted health data)
 *     }>,
 *     count: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@nillion/nuc';
import { SecretVaultBuilderClient } from '@nillion/secretvaults';

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

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as HealthRecordType | null;
    const userId = searchParams.get('userId');

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Missing required query parameter: type' },
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

    // Validate userId format if provided
    if (userId && !userId.startsWith('did:')) {
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

    // Refresh token and retrieve data
    await builder.refreshRootToken();

    const filter = userId ? { userId } : {};
    const response = await builder.findData({
      collection: collectionId,
      filter,
    });

    // Parse records
    const records = (response.data || []).map((record: any) => {
      try {
        const decryptedData = record.data?.['%allot'] || record.data;
        const parsedData = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;

        return {
          id: record._id,
          userId: record.userId,
          timestamp: record.timestamp,
          type: record.recordType,
          data: parsedData,
        };
      } catch (parseError) {
        console.warn(`Failed to parse record ${record._id}:`, parseError);
        return null;
      }
    }).filter((record: any) => record !== null);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        records,
        count: records.length,
      },
    });
  } catch (error) {
    console.error('Error retrieving records from Nillion:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve records',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use GET to retrieve records.' },
    { status: 405 }
  );
}
