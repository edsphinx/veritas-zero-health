/**
 * POST /api/extension/passport/verify
 *
 * Verify Human Passport for the connected wallet
 * Updates session with verification status
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

    // Verify passport using Human Protocol API
    // For now, we'll use a mock implementation
    // TODO: Replace with actual Human Protocol API integration

    const PASSPORT_API_KEY = process.env.HUMAN_PASSPORT_API_KEY;
    const PASSPORT_API_URL = process.env.HUMAN_PASSPORT_API_URL || 'https://api.humanprotocol.org';

    if (!PASSPORT_API_KEY) {
      console.warn('HUMAN_PASSPORT_API_KEY not set, using mock verification');

      // Mock verification for development
      const mockScore = 85 + Math.random() * 15; // Random score 85-100
      const verified = mockScore >= 50;

      const cookieStore = await cookies();
      cookieStore.set('passport_verified', verified.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      cookieStore.set('passport_score', mockScore.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({
        success: true,
        data: {
          verified,
          score: Math.round(mockScore * 100) / 100,
          details: {
            stamps: ['GitHub', 'Twitter', 'Google'],
            lastVerified: new Date().toISOString(),
          },
        },
      });
    }

    // Real passport verification
    const response = await fetch(`${PASSPORT_API_URL}/passport/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PASSPORT_API_KEY}`,
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error('Passport verification failed');
    }

    const result = await response.json();

    const verified = result.verified || false;
    const score = result.score || 0;

    // Store verification status
    const cookieStore = await cookies();
    cookieStore.set('passport_verified', verified.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set('passport_score', score.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log(`Passport verified for ${address}: ${verified} (score: ${score})`);

    return NextResponse.json({
      success: true,
      data: {
        verified,
        score,
        details: result.details || {},
      },
    });
  } catch (error) {
    console.error('Error verifying passport:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      { status: 500 }
    );
  }
}
