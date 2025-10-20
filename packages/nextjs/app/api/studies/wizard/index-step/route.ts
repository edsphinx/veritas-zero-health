/**
 * POST /api/studies/wizard/index-step
 *
 * Index a completed wizard step after user signs and broadcasts transaction
 * Stores transaction hash and extracted IDs for resumability
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPublicClient } from '@/infrastructure/blockchain/blockchain-client.service';

interface IndexStepRequest {
  step: 'escrow' | 'registry' | 'criteria' | 'milestones';
  txHash: string;
  chainId?: number;
  // Additional data depending on step
  databaseId?: string; // For first step only
  escrowId?: string;
  registryId?: string;
  title?: string;
  description?: string;
  totalFunding?: number;
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

    const body: IndexStepRequest = await request.json();

    // Validate input
    if (!body.step) {
      return NextResponse.json(
        { success: false, error: 'Step is required' },
        { status: 400 }
      );
    }

    if (!body.txHash || !body.txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction hash' },
        { status: 400 }
      );
    }

    const chainId = body.chainId || 11155420; // Default to Optimism Sepolia
    const publicClient = getPublicClient(chainId);

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: body.txHash as `0x${string}`,
    });

    if (receipt.status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Transaction failed on-chain' },
        { status: 400 }
      );
    }

    // Extract data from transaction receipt based on step
    let extractedData: Record<string, unknown> = {};

    switch (body.step) {
      case 'escrow': {
        // Extract escrow ID from event logs
        const escrowId = receipt.logs[0]?.topics[1]
          ? BigInt(receipt.logs[0].topics[1]).toString()
          : null;

        extractedData = {
          escrowId,
          txHash: body.txHash,
          blockNumber: receipt.blockNumber.toString(),
        };
        break;
      }

      case 'registry': {
        // Extract registry ID from event logs
        const registryId = receipt.logs[0]?.topics[1]
          ? BigInt(receipt.logs[0].topics[1]).toString()
          : null;

        extractedData = {
          registryId,
          txHash: body.txHash,
          blockNumber: receipt.blockNumber.toString(),
        };
        break;
      }

      case 'criteria': {
        extractedData = {
          txHash: body.txHash,
          blockNumber: receipt.blockNumber.toString(),
        };
        break;
      }

      case 'milestones': {
        // Extract milestone IDs from event logs
        const milestoneIds = receipt.logs
          .filter(log => log.topics[0] !== undefined)
          .map(log => log.topics[1] ? BigInt(log.topics[1]).toString() : null)
          .filter(Boolean);

        extractedData = {
          milestoneIds,
          txHashes: [body.txHash],
          blockNumber: receipt.blockNumber.toString(),
        };
        break;
      }
    }

    console.log('[Index Step] Transaction indexed:', {
      step: body.step,
      user: session.address,
      txHash: body.txHash,
      extractedData,
    });

    // TODO: Save to database via use case
    // For now, just return the extracted data for client-side state management

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('[Index Step] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to index step',
      },
      { status: 500 }
    );
  }
}
