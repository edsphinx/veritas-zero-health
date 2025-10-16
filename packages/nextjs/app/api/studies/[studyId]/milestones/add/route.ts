/**
 * POST /api/studies/[studyId]/milestones/add
 * Adds milestones to a study
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ResearchFundingEscrow ABI
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'studyId', type: 'uint256' },
      { name: 'milestoneType', type: 'uint8' },
      { name: 'description', type: 'string' },
      { name: 'rewardAmount', type: 'uint256' },
    ],
    name: 'addMilestone',
    outputs: [{ name: 'milestoneId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;

// Milestone types (must match contract enum)
enum MilestoneType {
  Enrollment = 0,
  InitialConsultation = 1,
  FollowUpVisit = 2,
  DataSubmission = 3,
  FinalEvaluation = 4,
  Custom = 5,
}

interface Milestone {
  type: keyof typeof MilestoneType;
  description: string;
  rewardAmount: string; // In USDC (e.g., "50")
}

interface AddMilestonesRequest {
  milestones: Milestone[];
  sponsorAddress: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body: AddMilestonesRequest = await request.json();

    // Validate input
    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { error: 'Invalid study ID' },
        { status: 400 }
      );
    }

    if (!body.milestones || body.milestones.length === 0) {
      return NextResponse.json(
        { error: 'At least one milestone is required' },
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

    // NOTE: In production, use researcher's wallet via frontend
    const account = privateKeyToAccount(
      (process.env.RESEARCHER_1_PRIVATE_KEY || '0x') as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Add each milestone
    const milestoneIds: number[] = [];
    const transactionHashes: string[] = [];

    for (const milestone of body.milestones) {
      // Parse reward amount (Mock USDC has 6 decimals)
      const rewardInTokenUnits = parseUnits(milestone.rewardAmount, 6);

      // Get milestone type enum value
      const milestoneTypeValue = MilestoneType[milestone.type];

      if (milestoneTypeValue === undefined) {
        return NextResponse.json(
          { error: `Invalid milestone type: ${milestone.type}` },
          { status: 400 }
        );
      }

      const hash = await walletClient.writeContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'addMilestone',
        args: [
          BigInt(studyId),
          milestoneTypeValue,
          milestone.description,
          rewardInTokenUnits,
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Parse milestoneId from logs
      const milestoneIdLog = receipt.logs[0];
      const milestoneId = milestoneIdLog?.topics[1]
        ? parseInt(milestoneIdLog.topics[1], 16)
        : null;

      if (milestoneId) {
        milestoneIds.push(milestoneId);
      }

      transactionHashes.push(hash);
    }

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      milestonesAdded: body.milestones.length,
      milestoneIds,
      transactionHashes,
    });
  } catch (error: any) {
    console.error('Error adding milestones:', error);

    return NextResponse.json(
      {
        error: 'Failed to add milestones',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
