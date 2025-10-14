/**
 * GET /api/extension/wallet/status
 *
 * Get Human Wallet connection status for browser extension
 *
 * Query Parameters:
 * - sessionId: string (optional, extension session identifier)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     connected: boolean,
 *     address?: string,
 *     method?: 'web3' | 'email' | 'google' | 'twitter',
 *     passportVerified?: boolean,
 *     passportScore?: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Get session from cookies
    const walletAddress = cookieStore.get('human_wallet_address')?.value;
    const walletMethod = cookieStore.get('human_wallet_method')?.value;
    const passportVerified = cookieStore.get('passport_verified')?.value;
    const passportScore = cookieStore.get('passport_score')?.value;

    if (!walletAddress) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        address: walletAddress,
        method: walletMethod || 'web3',
        passportVerified: passportVerified === 'true',
        passportScore: passportScore ? parseFloat(passportScore) : undefined,
      },
    });
  } catch (error) {
    console.error('Error getting wallet status:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
      },
      { status: 500 }
    );
  }
}
