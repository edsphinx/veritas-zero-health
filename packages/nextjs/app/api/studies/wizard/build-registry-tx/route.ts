/**
 * POST /api/studies/wizard/build-registry-tx
 *
 * Step 2: Build registry publication transaction (does NOT execute)
 * Returns unsigned transaction data for user to sign with their wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { getDefaultChainId } from '@/infrastructure/blockchain/blockchain-client.service';
import { getStudyRegistryContract } from '@/infrastructure/contracts/study-contracts';

interface BuildRegistryTxRequest {
  escrowId: string; // Sent as string, converted to bigint
  region: string;
  compensation: string;
  metadataURI?: string;
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

    const body: BuildRegistryTxRequest = await request.json();

    // Validate input
    if (!body.escrowId) {
      return NextResponse.json(
        { success: false, error: 'Escrow ID is required' },
        { status: 400 }
      );
    }

    if (!body.region || body.region.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Region is required' },
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

    const metadataURI = body.metadataURI || `ipfs://metadata/${body.escrowId}`;

    // Build transaction data (unsigned)
    const txData = {
      address: registryContract.address,
      abi: registryContract.abi,
      functionName: 'publishStudy',
      args: [
        body.region,
        body.compensation,
        metadataURI,
      ],
      chainId,
    };

    console.log('[Build Registry TX] Transaction prepared for signing:', {
      user: session.address,
      escrowId: body.escrowId,
      region: body.region,
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
    console.error('[Build Registry TX] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build transaction',
      },
      { status: 500 }
    );
  }
}
