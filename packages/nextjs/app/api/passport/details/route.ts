/**
 * API Route: Get Passport Verification Details
 *
 * GET  /api/passport/details?address=0x...
 * POST /api/passport/details { address: "0x..." }
 *
 * Returns detailed Gitcoin Passport verification information including
 * stamps, scores, and expiration data.
 *
 * Clean Architecture:
 * - Simple validation at API layer
 * - All business logic delegated to GetVerificationDetailsUseCase
 * - Infrastructure (PassportClient) injected into use case
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPassportClient } from '@/infrastructure/passport';
import { GetVerificationDetailsUseCase } from '@/core/use-cases/auth';

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
    const passportClient = createPassportClient();

    // Execute use case (all business logic is here)
    const useCase = new GetVerificationDetailsUseCase(passportClient);
    const result = await useCase.execute({ address });

    // Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Passport details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;

    // Simple validation
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address required in request body' },
        { status: 400 }
      );
    }

    // Initialize infrastructure
    const passportClient = createPassportClient();

    // Execute use case (all business logic is here)
    const useCase = new GetVerificationDetailsUseCase(passportClient);
    const result = await useCase.execute({ address });

    // Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Passport details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
