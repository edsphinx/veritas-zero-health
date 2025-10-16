/**
 * POST /api/studies/[studyId]/milestones/complete
 * Marks a milestone as completed for a participant (called by certified clinic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, keccak256, toHex } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ResearchFundingEscrow ABI
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'studyId', type: 'uint256' },
      { name: 'milestoneId', type: 'uint256' },
      { name: 'participant', type: 'address' },
      { name: 'verificationDataHash', type: 'bytes32' },
    ],
    name: 'completeMilestone',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;

interface CompleteMilestoneRequest {
  milestoneId: number;
  participantAddress: string;
  verificationData?: string; // Optional: IPFS CID, medical record hash, etc.
  clinicAddress: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body: CompleteMilestoneRequest = await request.json();

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

    // Create verification data hash
    const verificationDataHash = body.verificationData
      ? keccak256(toHex(body.verificationData))
      : keccak256(toHex(`milestone-${body.milestoneId}-${body.participantAddress}-${Date.now()}`));

    // Create clients
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // NOTE: In production, use clinic's wallet via frontend
    const account = privateKeyToAccount(
      (process.env.CLINIC_1_PRIVATE_KEY || '0x') as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Complete milestone
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'completeMilestone',
      args: [
        BigInt(studyId),
        BigInt(body.milestoneId),
        body.participantAddress as `0x${string}`,
        verificationDataHash,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      milestoneId: body.milestoneId,
      participantAddress: body.participantAddress,
      verificationDataHash,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    console.error('Error completing milestone:', error);

    return NextResponse.json(
      {
        error: 'Failed to complete milestone',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
