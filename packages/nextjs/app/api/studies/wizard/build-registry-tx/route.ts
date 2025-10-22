/**
 * POST /api/studies/wizard/build-registry-tx
 *
 * Step 2: Build registry publication transaction (does NOT execute)
 * - AUTO-GENERATES compensation description from funding parameters
 * - Accepts study description and region (for DB storage)
 * - Returns unsigned transaction data for user to sign with their wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { getDefaultChainId } from '@/infrastructure/blockchain/blockchain-client.service';
import { getStudyRegistryContract } from '@/infrastructure/contracts/study-contracts';

interface BuildRegistryTxRequest {
  escrowId: string; // Sent as string, converted to bigint
  region: string;
  description: string; // Study description (stored in DB, not blockchain)
  // Funding params (for auto-generating compensation description)
  totalFunding: number;
  maxParticipants: number;
  paymentPerParticipant: number;
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

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Study description is required' },
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

    // AUTO-GENERATE compensation description from funding parameters
    const compensationDescription = `Participants will receive ${body.paymentPerParticipant} USDC total for completing the study appointments (${body.maxParticipants} participants max, ${body.totalFunding} USDC total funding)`;

    const metadataURI = body.metadataURI || `ipfs://metadata/${body.escrowId}`;

    // Build transaction data (unsigned)
    const txData = {
      address: registryContract.address,
      abi: registryContract.abi,
      functionName: 'publishStudy',
      args: [
        body.region,
        compensationDescription, // AUTO-GENERATED
        metadataURI,
      ],
      chainId,
    };

    console.log('[Build Registry TX] Transaction prepared for signing:', {
      user: session.address,
      escrowId: body.escrowId,
      region: body.region,
      compensationDescription,
      note: 'Compensation description auto-generated from funding params',
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
