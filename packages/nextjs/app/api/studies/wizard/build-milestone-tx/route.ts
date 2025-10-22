/**
 * POST /api/studies/wizard/build-milestone-tx
 *
 * Step 4: Build milestone creation transaction(s) (does NOT execute)
 * Returns unsigned transaction data for user to sign with their wallet
 * Supports both sequential (multiple TXs) and batch (single TX) modes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { getDefaultChainId } from '@/infrastructure/blockchain/blockchain-client.service';
import { getResearchFundingEscrowContract } from '@/infrastructure/contracts/study-contracts';

interface MilestoneData {
  type: string;
  description: string;
  rewardAmount: number;
}

interface BuildMilestoneTxRequest {
  escrowId: string; // Sent as string, converted to bigint
  milestones: MilestoneData[];
  mode: 'sequential' | 'batch'; // Sequential: ≤6 milestones, Batch: >6
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

    const body: BuildMilestoneTxRequest = await request.json();

    // Validate input
    if (!body.escrowId) {
      return NextResponse.json(
        { success: false, error: 'Escrow ID is required' },
        { status: 400 }
      );
    }

    if (!body.milestones || body.milestones.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one milestone is required' },
        { status: 400 }
      );
    }

    if (body.milestones.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 milestones allowed' },
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

    const escrowIdBigInt = BigInt(body.escrowId);

    // Determine mode if not specified
    const mode = body.mode || (body.milestones.length <= 6 ? 'sequential' : 'batch');

    if (mode === 'batch') {
      // Build single batch transaction
      const descriptions = body.milestones.map(m => m.description);
      const amounts = body.milestones.map(m => BigInt(Math.floor(m.rewardAmount * 1e6))); // USDC decimals

      const txData = {
        address: escrowContract.address,
        abi: escrowContract.abi,
        functionName: 'addMilestonesBatch',
        args: [escrowIdBigInt, descriptions, amounts],
        chainId,
      };

      console.log('[Build Milestone TX] Batch transaction prepared:', {
        user: session.address,
        escrowId: body.escrowId,
        milestoneCount: body.milestones.length,
        mode: 'batch',
      });

      return jsonResponse({
        success: true,
        data: {
          mode: 'batch',
          txData,
          contractAddress: escrowContract.address,
          chainId,
          milestoneCount: body.milestones.length,
        },
      });
    } else {
      // Build multiple sequential transactions
      const txDataArray = body.milestones.map((milestone) => ({
        address: escrowContract.address,
        abi: escrowContract.abi,
        functionName: 'addMilestone',
        args: [
          escrowIdBigInt,
          milestone.description,
          BigInt(Math.floor(milestone.rewardAmount * 1e6)), // USDC decimals
        ],
        chainId,
      }));

      console.log('[Build Milestone TX] Sequential transactions prepared:', {
        user: session.address,
        escrowId: body.escrowId,
        milestoneCount: body.milestones.length,
        mode: 'sequential',
      });

      return jsonResponse({
        success: true,
        data: {
          mode: 'sequential',
          txDataArray,
          contractAddress: escrowContract.address,
          chainId,
          milestoneCount: body.milestones.length,
        },
      });
    }
  } catch (error) {
    console.error('[Build Milestone TX] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build transaction',
      },
      { status: 500 }
    );
  }
}
