/**
 * POST /api/extension/wallet/disconnect
 *
 * Disconnect wallet for browser extension
 * Clears session and wallet information
 *
 * Response:
 * {
 *   success: true
 * }
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear all wallet-related cookies
    cookieStore.delete('human_wallet_address');
    cookieStore.delete('human_wallet_method');
    cookieStore.delete('human_wallet_identifier');
    cookieStore.delete('passport_verified');
    cookieStore.delete('passport_score');
    cookieStore.delete('extension_session_id');

    console.log('Extension wallet disconnected');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error disconnecting wallet:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect',
      },
      { status: 500 }
    );
  }
}
