/**
 * POST /api/extension/passport/verify
 *
 * Verify Human Passport for the connected wallet
 * Updates session with verification status
 * Uses HumanProtocolClient with test address bypass
 *
 * Request Body:
 * {
 *   address: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     verified: boolean,
 *     score: number,
 *     details: object
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createPassportClient } from '@/infrastructure/human/HumanProtocolClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: address' },
        { status: 400 }
      );
    }

    // Use HumanProtocolClient which has bypass for test addresses
    const humanClient = createPassportClient();
    const result = await humanClient.getPassportScore(address);

    const verified = result.verified;
    const score = result.score;

    // Store verification status in cookies
    const cookieStore = await cookies();
    cookieStore.set('passport_verified', verified.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    cookieStore.set('passport_score', score.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log(`[Extension API] Passport verified for ${address}: ${verified} (score: ${score})`);

    return NextResponse.json({
      success: true,
      data: {
        verified,
        score,
        details: {
          threshold: result.threshold,
          lastVerified: result.lastUpdated.toISOString(),
          expiresAt: result.expiresAt.toISOString(),
          stampScores: result.stampScores,
        },
      },
    });
  } catch (error) {
    console.error('[Extension API] Error verifying passport:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      { status: 500 }
    );
  }
}
