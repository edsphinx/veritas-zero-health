/**
 * POST /api/studies/[studyId]/milestones/verify
 * Verifies a completed milestone (called by verifier role)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ResearchFundingEscrow ABI
const ESCROW_ABI = [
  {
    inputs: [{ name: 'milestoneId', type: 'uint256' }],
    name: 'verifyMilestone',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;

interface VerifyMilestoneRequest {
  milestoneId: number;
  verifierAddress: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body: VerifyMilestoneRequest = await request.json();

    // Validate input
    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { error: 'Invalid study ID' },
        { status: 400 }
      );
    }

    if (!body.milestoneId || body.milestoneId <= 0) {
      return NextResponse.json(
        { error: 'Invalid milestone ID' },
        { status: 400 }
      );
    }

    if (!ESCROW_ADDRESS) {
      return NextResponse.json(
        { error: 'ResearchFundingEscrow address not configured' },
        { status: 500 }
      );
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // NOTE: In production, use verifier's wallet via frontend
    // Verifier could be researcher, admin, or designated verifier
    const account = privateKeyToAccount(
      (process.env.RESEARCHER_1_PRIVATE_KEY || '0x') as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Verify milestone
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'verifyMilestone',
      args: [BigInt(body.milestoneId)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      milestoneId: body.milestoneId,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    console.error('Error verifying milestone:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify milestone',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
