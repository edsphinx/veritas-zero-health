/**
 * POST /api/studies/[studyId]/enroll
 * Enrolls a patient in a study (called by certified clinic)
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
      { name: 'participant', type: 'address' },
    ],
    name: 'enrollParticipant',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;

interface EnrollParticipantRequest {
  participantAddress: string; // DASHI Smart Account address
  clinicAddress: string; // Certified provider address
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body: EnrollParticipantRequest = await request.json();

    // Validate input
    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { error: 'Invalid study ID' },
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

    // Create clients
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // NOTE: In production, use clinic's wallet via frontend
    // For testing, use clinic test wallet from .env
    const account = privateKeyToAccount(
      (process.env.CLINIC_1_PRIVATE_KEY || '0x') as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Enroll participant
    const hash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'enrollParticipant',
      args: [BigInt(studyId), body.participantAddress as `0x${string}`],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      participantAddress: body.participantAddress,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    console.error('Error enrolling participant:', error);

    return NextResponse.json(
      {
        error: 'Failed to enroll participant',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
