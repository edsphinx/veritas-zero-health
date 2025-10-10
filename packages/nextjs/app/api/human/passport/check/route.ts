/**
 * API Route: Check Passport Verification Status
 *
 * GET /api/human/passport/check?address=0x...
 *
 * Quick check for verification status (lighter than full details)
 * Simple proxy - no business logic
 * Delegates to CheckPassportVerificationUseCase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPassportClient } from '@/infrastructure/human/HumanProtocolClient';
import { CheckPassportVerificationUseCase } from '@/core/use-cases/auth/CheckPassportVerification';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    // Simple validation
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter required' },
        { status: 400 }
      );
    }

    // Initialize infrastructure
    const humanClient = createPassportClient();

    // Execute use case (all business logic is here)
    const useCase = new CheckPassportVerificationUseCase(humanClient);
    const result = await useCase.execute({ address });

    // Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Passport check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
