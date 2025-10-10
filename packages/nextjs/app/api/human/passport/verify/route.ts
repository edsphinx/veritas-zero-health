/**
 * API Route: Get Passport Score
 *
 * GET /api/human/passport/verify?address=0x...
 *
 * Simple proxy - no business logic
 * Delegates to GetPassportScoreUseCase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPassportClient } from '@/infrastructure/human/HumanProtocolClient';
import { GetPassportScoreUseCase } from '@/core/use-cases/auth/GetPassportScore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    // Simple validation - use case will do business validation
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter required' },
        { status: 400 }
      );
    }

    // Initialize infrastructure
    const humanClient = createPassportClient();

    // Execute use case (all business logic is here)
    const useCase = new GetPassportScoreUseCase(humanClient);
    const result = await useCase.execute({ address });

    // Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Passport score error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
