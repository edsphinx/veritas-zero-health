/**
 * POST /api/studies/[studyId]/milestones/release-payment
 * Releases payment for a verified milestone to participant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ResearchFundingEscrow ABI
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'studyId', type: 'uint256' },
      { name: 'milestoneId', type: 'uint256' },
      { name: 'participant', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    name: 'releasePayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;
const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS as `0x${string}`;

interface ReleasePaymentRequest {
  milestoneId: number;
  participantAddress: string;
  tokenAddress?: string; // Optional, defaults to Mock USDC
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body: ReleasePaymentRequest = await request.json();

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

    if (!body.participantAddress || !body.participantAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid participant address' },
        { status: 400 }
      );
    }

    if (!ESCROW_ADDRESS) {
      return NextResponse.json(
        { error: 'ResearchFundingEscrow address not configured' },
        { status: 500 }
      );
    }

    const tokenAddress = (body.tokenAddress || MOCK_USDC_ADDRESS) as `0x${string}`;

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Token address not configured' },
        { status: 500 }
      );
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // NOTE: In production, this could be called by participant themselves or automated
    // For testing, use researcher or admin wallet
    const account = privateKeyToAccount(
      (process.env.RESEARCHER_1_PRIVATE_KEY || '0x') as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Release payment
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'releasePayment',
      args: [
        BigInt(studyId),
        BigInt(body.milestoneId),
        body.participantAddress as `0x${string}`,
        tokenAddress,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      milestoneId: body.milestoneId,
      participantAddress: body.participantAddress,
      token: tokenAddress,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: unknown) {
    console.error('Error releasing payment:', error);

    return NextResponse.json(
      {
        error: 'Failed to release payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
