/**
 * API Route: Connect Human Wallet
 *
 * POST /api/human/wallet/connect
 *
 * Handles wallet connection via Human Wallet
 * Supports Web3, Email, and Social login methods
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ConnectWalletRequest } from '@/shared/types/human.types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConnectWalletRequest;
    const { method } = body;

    // Validation
    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Connection method required' },
        { status: 400 }
      );
    }

    if (
      !['web3', 'email', 'google', 'twitter'].includes(method)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection method' },
        { status: 400 }
      );
    }

    // TODO: Implement Human Wallet connection
    // Human Wallet SDK is not yet integrated
    return NextResponse.json(
      {
        success: false,
        error: 'Human Wallet connection not yet implemented',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('[API] Human Wallet connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
