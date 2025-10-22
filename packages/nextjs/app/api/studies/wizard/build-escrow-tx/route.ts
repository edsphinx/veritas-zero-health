/**
 * POST /api/studies/wizard/build-escrow-tx
 *
 * Step 1: Build escrow creation transaction (does NOT execute)
 * Returns unsigned transaction data for user to sign with their wallet
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { getDefaultChainId } from '@/infrastructure/blockchain/blockchain-client.service';
import { getResearchFundingEscrowContract } from '@/infrastructure/contracts/study-contracts';
import { type Address } from 'viem';

interface BuildEscrowTxRequest {
  title: string;
  // NOTE: description removed - moved to Registry step
  // Contract still requires it, so we'll pass empty string
  totalFunding: number;
  maxParticipants: number;
  certifiedProviders?: Address[];
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

    const body: BuildEscrowTxRequest = await request.json();

    // Validate input
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.maxParticipants || body.maxParticipants <= 0) {
      return NextResponse.json(
        { success: false, error: 'Max participants must be greater than 0' },
        { status: 400 }
      );
    }

    const chainId = getDefaultChainId();
    const escrowContract = getResearchFundingEscrowContract(chainId);

    if (!escrowContract) {
      return NextResponse.json(
        { success: false, error: 'ResearchFundingEscrow contract not deployed' },
        { status: 500 }
      );
    }

    const certifiedProviders = body.certifiedProviders && body.certifiedProviders.length > 0
      ? body.certifiedProviders
      : [session.address as Address];

    // Build transaction data (unsigned)
    const txData = {
      address: escrowContract.address,
      abi: escrowContract.abi,
      functionName: 'createStudy',
      args: [
        body.title,
        '', // Empty string - description moved to Registry step (saved in DB only)
        certifiedProviders,
        BigInt(body.maxParticipants), // Will be auto-converted to string by jsonResponse
      ],
      chainId,
    };

    console.log('[Build Escrow TX] Transaction prepared for signing:', {
      user: session.address,
      title: body.title,
      maxParticipants: body.maxParticipants,
      note: 'Description passed as empty string (moved to Registry step)',
    });

    // Return with BigInt-safe serialization
    return jsonResponse({
      success: true,
      data: {
        txData,
        contractAddress: escrowContract.address,
        chainId,
      },
    });
  } catch (error) {
    console.error('[Build Escrow TX] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build transaction',
      },
      { status: 500 }
    );
  }
}
