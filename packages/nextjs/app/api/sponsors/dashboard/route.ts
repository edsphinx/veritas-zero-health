/**
 * API Route: GET /api/sponsors/dashboard
 *
 * Gets sponsor dashboard data including deposits, total funded, and active studies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/shared/lib/prisma';
import { createSponsorDepositRepository } from '@/infrastructure/repositories/PrismaSponsorDepositRepository';
import { createGetSponsorDashboardUseCase } from '@/core/use-cases/sponsors/GetSponsorDashboard';
import type { Address } from 'viem';

/**
 * GET handler - Get sponsor dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get address from query params (optional - defaults to authenticated user)
    const { searchParams } = new URL(request.url);
    const addressParam = searchParams.get('address');
    const sponsorAddress = (addressParam || session.address) as Address;

    // Verify user can only see their own dashboard (unless admin)
    if (sponsorAddress.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create repository and use case
    const depositRepository = createSponsorDepositRepository(prisma);
    const getSponsorDashboardUseCase = createGetSponsorDashboardUseCase(depositRepository);

    // Execute use case
    const result = await getSponsorDashboardUseCase.execute({
      sponsorAddress,
      chainId: 11155420, // Optimism Sepolia
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const responseData = {
      deposits: result.data!.deposits.map(d => ({
        ...d,
        amount: d.amount.toString(),
        blockNumber: d.blockNumber.toString(),
      })),
      totalFunded: result.data!.totalFunded.toString(),
      activeStudiesCount: result.data!.activeStudiesCount,
      totalDeposits: result.data!.totalDeposits,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('[Sponsor Dashboard API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sponsor dashboard',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
