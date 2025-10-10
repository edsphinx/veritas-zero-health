/**
 * API Route: Connect Human Wallet
 *
 * POST /api/human/wallet/connect
 *
 * Handles wallet connection via Human Wallet
 * Supports Web3, Email, and Social login methods
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHumanProtocolClient } from '@/infrastructure/human/HumanProtocolClient';
import type { ConnectWalletRequest } from '@/shared/types/human.types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ConnectWalletRequest;
    const { method, identifier } = body;

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

    // Initialize Human Protocol client
    const humanClient = createHumanProtocolClient({
      network: 'testnet',
      wallet: {
        enableWeb2Login: true,
        supportedAuthProviders: ['email', 'google', 'twitter'],
      },
    });

    // Connect wallet
    const result = await humanClient.connectWallet(method, identifier);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Connection failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        address: result.address,
        method: result.method,
      },
      timestamp: Date.now(),
    });
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
