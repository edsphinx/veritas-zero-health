/**
 * API Route: POST /api/deposits/index
 *
 * Indexes a sponsor deposit transaction in the database.
 * Should be called after a successful depositFunds transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/shared/lib/prisma';
import { createSponsorDepositRepository } from '@/infrastructure/repositories/PrismaSponsorDepositRepository';
import { createIndexDepositUseCase } from '@/core/use-cases/sponsors/IndexDeposit';
import type { Address } from 'viem';

/**
 * Request body type
 */
interface IndexDepositRequestBody {
  sponsorAddress: Address;
  studyId: string;
  escrowId: number;
  amount: string; // BigInt as string for JSON
  chainId: number;
  transactionHash: string;
  blockNumber: string; // BigInt as string for JSON
  depositedAt?: string; // ISO date string
}

/**
 * POST handler - Index a deposit
 */
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

    const body: IndexDepositRequestBody = await request.json();

    // Verify sponsor is the authenticated user
    if (body.sponsorAddress.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Only the sponsor can index their own deposits' },
        { status: 403 }
      );
    }

    // Create repository and use case
    const depositRepository = createSponsorDepositRepository(prisma);
    const indexDepositUseCase = createIndexDepositUseCase(depositRepository);

    // Execute use case
    const result = await indexDepositUseCase.execute({
      sponsorAddress: body.sponsorAddress as Address,
      studyId: body.studyId,
      escrowId: body.escrowId,
      amount: BigInt(body.amount),
      chainId: body.chainId,
      transactionHash: body.transactionHash,
      blockNumber: BigInt(body.blockNumber),
      depositedAt: body.depositedAt ? new Date(body.depositedAt) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Return success with deposit ID
    return NextResponse.json({
      success: true,
      data: {
        depositId: result.data!.deposit.id,
        message: result.data!.message,
      },
    });
  } catch (error) {
    console.error('[Index Deposit API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to index deposit',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
