/**
 * GET /api/studies/[studyId]
 * Fetches study details from ResearchFundingEscrow contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { optimismSepolia } from 'viem/chains';

// ResearchFundingEscrow ABI
const ESCROW_ABI = [
  {
    inputs: [{ name: 'studyId', type: 'uint256' }],
    name: 'getStudy',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'sponsor', type: 'address' },
          { name: 'certifiedProviders', type: 'address[]' },
          { name: 'status', type: 'uint8' },
          { name: 'totalFunding', type: 'uint256' },
          { name: 'remainingFunding', type: 'uint256' },
          { name: 'participantCount', type: 'uint256' },
          { name: 'maxParticipants', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'startedAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'studyId', type: 'uint256' }],
    name: 'getStudyMilestones',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'milestoneId', type: 'uint256' }],
    name: 'getMilestone',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'studyId', type: 'uint256' },
          { name: 'milestoneType', type: 'uint8' },
          { name: 'description', type: 'string' },
          { name: 'rewardAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'verificationDataHash', type: 'bytes32' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
          { name: 'verifiedAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;

const STATUS_MAP: Record<number, string> = {
  0: 'Created',
  1: 'Funding',
  2: 'Active',
  3: 'Paused',
  4: 'Completed',
  5: 'Cancelled',
};

const MILESTONE_STATUS_MAP: Record<number, string> = {
  0: 'Pending',
  1: 'Completed',
  2: 'Verified',
  3: 'Paid',
};

const MILESTONE_TYPE_MAP: Record<number, string> = {
  0: 'Enrollment',
  1: 'Initial Consultation',
  2: 'Follow-Up Visit',
  3: 'Data Submission',
  4: 'Final Evaluation',
  5: 'Custom',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;

    // Validate input
    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { error: 'Invalid study ID' },
        { status: 400 }
      );
    }

    if (!ESCROW_ADDRESS) {
      return NextResponse.json(
        { error: 'ResearchFundingEscrow address not configured' },
        { status: 500 }
      );
    }

    // Create public client
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Fetch study details
    const study = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getStudy',
      args: [BigInt(studyId)],
    });

    // Fetch milestone IDs
    const milestoneIds = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getStudyMilestones',
      args: [BigInt(studyId)],
    });

    // Fetch milestone details
    const milestones = await Promise.all(
      milestoneIds.map(async (milestoneId) => {
        const milestone = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: 'getMilestone',
          args: [milestoneId],
        });

        return {
          id: Number(milestone.id),
          studyId: Number(milestone.studyId),
          milestoneType: MILESTONE_TYPE_MAP[Number(milestone.milestoneType)] || 'Unknown',
          description: milestone.description,
          rewardAmount: formatUnits(milestone.rewardAmount, 6), // USDC has 6 decimals
          status: MILESTONE_STATUS_MAP[Number(milestone.status)] || 'Unknown',
          verificationDataHash: milestone.verificationDataHash,
          createdAt: Number(milestone.createdAt),
          completedAt: Number(milestone.completedAt),
          verifiedAt: Number(milestone.verifiedAt),
        };
      })
    );

    // Format response
    const response = {
      id: Number(study.id),
      title: study.title,
      description: study.description,
      sponsor: study.sponsor,
      certifiedProviders: study.certifiedProviders,
      status: STATUS_MAP[Number(study.status)] || 'Unknown',
      totalFunding: formatUnits(study.totalFunding, 6), // USDC has 6 decimals
      remainingFunding: formatUnits(study.remainingFunding, 6),
      participantCount: Number(study.participantCount),
      maxParticipants: Number(study.maxParticipants),
      createdAt: Number(study.createdAt),
      startedAt: Number(study.startedAt),
      completedAt: Number(study.completedAt),
      milestones,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching study:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch study',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
