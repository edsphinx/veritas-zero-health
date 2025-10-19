/**
 * API Route: Verify Passport / Get Passport Score
 *
 * GET  /api/passport/verify?address=0x...
 * POST /api/passport/verify { address: "0x..." }
 *
 * Returns Gitcoin Passport score and verification status for an address.
 * Also saves verification result to database for caching and history.
 *
 * Clean Architecture:
 * - Simple validation at API layer
 * - All business logic delegated to use cases
 * - Infrastructure (PassportClient, Prisma) injected into use cases
 * - Uses repository pattern for database access
 */

import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth'; // TODO: Add proper auth integration
import { prisma } from '@/lib/prisma';
import { createPassportClient } from '@/infrastructure/passport';
import { PrismaPassportVerificationRepository } from '@/infrastructure/repositories';
import {
  GetPassportScoreUseCase,
  GetCachedPassportVerificationUseCase,
  SavePassportVerificationUseCase,
} from '@/core/use-cases/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const checkCache = searchParams.get('cache') !== 'false'; // Check cache by default

    // Simple validation - use case will do business validation
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter required' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional - for saving to DB)
    // TODO: Implement proper auth integration
    // const session = await auth();
    // const userId = session?.user?.id;
    const userId = undefined; // Temporarily disabled until auth is integrated

    // Initialize infrastructure
    const passportClient = createPassportClient();
    const verificationRepository = new PrismaPassportVerificationRepository(prisma);

    // Check cache first (if enabled and user authenticated)
    if (checkCache && userId) {
      const cacheUseCase = new GetCachedPassportVerificationUseCase(
        verificationRepository
      );
      const cachedResult = await cacheUseCase.execute({ userId, address });

      if (cachedResult.success && cachedResult.data && !cachedResult.isExpired) {
        console.log('[API] Returning cached verification');
        // Convert cached verification to VerificationResult format
        return NextResponse.json({
          success: true,
          data: {
            success: true,
            verified: cachedResult.data.verified,
            score: cachedResult.data.score,
            passingScore: cachedResult.data.passingScore,
            threshold: cachedResult.data.threshold,
            lastUpdated: cachedResult.data.lastScoreTimestamp,
            expiresAt: cachedResult.data.expirationTimestamp,
            stampScores: cachedResult.data.stampScores,
          },
          cached: true,
        });
      }
    }

    // Fetch from Passport API
    const scoreUseCase = new GetPassportScoreUseCase(passportClient);
    const result = await scoreUseCase.execute({ address });

    if (!result.success || !result.data) {
      return NextResponse.json(result, { status: 400 });
    }

    // Save to database (if user authenticated)
    if (userId) {
      const saveUseCase = new SavePassportVerificationUseCase(verificationRepository);
      await saveUseCase.execute({
        userId,
        address,
        verificationResult: result.data,
      });
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, checkCache = true } = body;

    // Simple validation
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address required in request body' },
        { status: 400 }
      );
    }

    // Get authenticated user (optional - for saving to DB)
    // TODO: Implement proper auth integration
    // const session = await auth();
    // const userId = session?.user?.id;
    const userId = undefined; // Temporarily disabled until auth is integrated

    // Initialize infrastructure
    const passportClient = createPassportClient();
    const verificationRepository = new PrismaPassportVerificationRepository(prisma);

    // Check cache first (if enabled and user authenticated)
    if (checkCache && userId) {
      const cacheUseCase = new GetCachedPassportVerificationUseCase(
        verificationRepository
      );
      const cachedResult = await cacheUseCase.execute({ userId, address });

      if (cachedResult.success && cachedResult.data && !cachedResult.isExpired) {
        console.log('[API] Returning cached verification');
        // Convert cached verification to VerificationResult format
        return NextResponse.json({
          success: true,
          data: {
            success: true,
            verified: cachedResult.data.verified,
            score: cachedResult.data.score,
            passingScore: cachedResult.data.passingScore,
            threshold: cachedResult.data.threshold,
            lastUpdated: cachedResult.data.lastScoreTimestamp,
            expiresAt: cachedResult.data.expirationTimestamp,
            stampScores: cachedResult.data.stampScores,
          },
          cached: true,
        });
      }
    }

    // Fetch from Passport API
    const scoreUseCase = new GetPassportScoreUseCase(passportClient);
    const result = await scoreUseCase.execute({ address });

    if (!result.success || !result.data) {
      return NextResponse.json(result, { status: 400 });
    }

    // Save to database (if user authenticated)
    if (userId) {
      const saveUseCase = new SavePassportVerificationUseCase(verificationRepository);
      await saveUseCase.execute({
        userId,
        address,
        verificationResult: result.data,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Passport verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
