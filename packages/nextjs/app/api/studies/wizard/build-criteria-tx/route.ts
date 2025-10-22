/**
 * POST /api/studies/wizard/build-criteria-tx
 *
 * Step 3: Build criteria setting transaction (does NOT execute)
 * Returns unsigned transaction data for user to sign with their wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { getDefaultChainId } from '@/infrastructure/blockchain/blockchain-client.service';
import { getStudyRegistryContract } from '@/infrastructure/contracts/study-contracts';

interface BuildCriteriaTxRequest {
  registryId: string; // Sent as string, converted to bigint
  minAge: number;
  maxAge: number;
  eligibilityCodeHash?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: BuildCriteriaTxRequest = await request.json();

    // Validate input
    if (!body.registryId) {
      return NextResponse.json(
        { success: false, error: 'Registry ID is required' },
        { status: 400 }
      );
    }

    if (body.minAge < 0 || body.maxAge < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid age range' },
        { status: 400 }
      );
    }

    if (body.minAge > body.maxAge) {
      return NextResponse.json(
        { success: false, error: 'Min age cannot be greater than max age' },
        { status: 400 }
      );
    }

    const chainId = getDefaultChainId();
    const registryContract = getStudyRegistryContract(chainId);

    if (!registryContract) {
      return NextResponse.json(
        { success: false, error: 'StudyRegistry contract not deployed' },
        { status: 500 }
      );
    }

    const eligibilityCodeHash = body.eligibilityCodeHash || '0';

    // Build transaction data (unsigned)
    const txData = {
      address: registryContract.address,
      abi: registryContract.abi,
      functionName: 'setStudyCriteria',
      args: [
        BigInt(body.registryId),
        body.minAge,
        body.maxAge,
        BigInt(eligibilityCodeHash),
      ],
      chainId,
    };

    console.log('[Build Criteria TX] Transaction prepared for signing:', {
      user: session.address,
      registryId: body.registryId,
      ageRange: `${body.minAge}-${body.maxAge}`,
    });

    return jsonResponse({
      success: true,
      data: {
        txData,
        contractAddress: registryContract.address,
        chainId,
      },
    });
  } catch (error) {
    console.error('[Build Criteria TX] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build transaction',
      },
      { status: 500 }
    );
  }
}
