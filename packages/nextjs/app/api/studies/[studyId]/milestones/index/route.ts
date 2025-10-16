/**
 * POST /api/studies/[studyId]/milestones/index
 *
 * Indexes milestones for a study after they have been added to the blockchain.
 * This endpoint is called after all milestone transactions are confirmed.
 *
 * Body:
 * {
 *   escrowId: number,
 *   milestones: [{
 *     milestoneId: number,
 *     milestoneType: number,
 *     description: string,
 *     rewardAmount: string,
 *     transactionHash: string,
 *     blockNumber: string
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http } from 'viem';
import { optimismSepolia } from 'viem/chains';

const prisma = new PrismaClient();

// Create public client to verify transactions
const publicClient = createPublicClient({
  chain: optimismSepolia,
  transport: http(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { studyId: string } }
) {
  try {
    const { studyId } = params;
    const body = await request.json();
    const { escrowId, milestones } = body;

    // Validate input
    if (!escrowId || !milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, milestones[]' },
        { status: 400 }
      );
    }

    // Find the study in our database
    const study = await prisma.study.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }

    // Verify escrowId matches
    if (study.escrowId !== escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID mismatch' },
        { status: 400 }
      );
    }

    // Verify all transactions exist on the blockchain and index milestones
    const indexedMilestones = [];

    for (const milestone of milestones) {
      const { milestoneId, milestoneType, description, rewardAmount, transactionHash, blockNumber } = milestone;

      // Validate milestone data
      if (
        milestoneId === undefined ||
        milestoneType === undefined ||
        !description ||
        !rewardAmount ||
        !transactionHash ||
        !blockNumber
      ) {
        return NextResponse.json(
          { error: `Invalid milestone data for milestone ${milestoneId}` },
          { status: 400 }
        );
      }

      // Verify transaction exists on blockchain
      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash as `0x${string}`,
        });

        if (!receipt || !receipt.status || receipt.status !== 'success') {
          return NextResponse.json(
            { error: `Transaction ${transactionHash} not found or failed` },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error(`Error verifying transaction ${transactionHash}:`, error);
        return NextResponse.json(
          { error: `Failed to verify transaction ${transactionHash}` },
          { status: 500 }
        );
      }

      // Check if milestone already indexed
      const existingMilestone = await prisma.milestone.findUnique({
        where: {
          escrowId_milestoneId: {
            escrowId: Number(escrowId),
            milestoneId: Number(milestoneId),
          },
        },
      });

      if (existingMilestone) {
        console.log(`Milestone ${milestoneId} already indexed, skipping`);
        indexedMilestones.push(existingMilestone);
        continue;
      }

      // Index the milestone
      const indexed = await prisma.milestone.create({
        data: {
          studyId: study.id,
          escrowId: Number(escrowId),
          milestoneId: Number(milestoneId),
          milestoneType: Number(milestoneType),
          description,
          rewardAmount: BigInt(rewardAmount),
          status: 'Active',
          chainId: optimismSepolia.id,
          transactionHash,
          blockNumber: BigInt(blockNumber),
        },
      });

      indexedMilestones.push(indexed);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${indexedMilestones.length} milestones`,
      milestones: indexedMilestones.map(m => ({
        id: m.id,
        milestoneId: m.milestoneId,
        description: m.description,
        rewardAmount: m.rewardAmount.toString(),
        transactionHash: m.transactionHash,
      })),
    });

  } catch (error) {
    console.error('Error indexing milestones:', error);
    return NextResponse.json(
      { error: 'Failed to index milestones', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
