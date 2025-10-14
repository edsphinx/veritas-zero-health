/**
 * POST /api/extension/wallet/connect
 *
 * Connect wallet for browser extension context
 * Creates or updates session with wallet information
 *
 * Request Body:
 * {
 *   method: 'web3' | 'email' | 'google' | 'twitter',
 *   address: string,
 *   identifier?: string (for email/social)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     address: string,
 *     method: string,
 *     sessionId: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

type ConnectionMethod = 'web3' | 'email' | 'google' | 'twitter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, address, identifier } = body;

    // Validate required fields
    if (!method || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: method, address' },
        { status: 400 }
      );
    }

    // Validate method
    const validMethods: ConnectionMethod[] = ['web3', 'email', 'google', 'twitter'];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { success: false, error: `Invalid method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate address format (basic ethereum address check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Store wallet info in cookies
    cookieStore.set('human_wallet_address', address, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookieStore.set('human_wallet_method', method, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (identifier) {
      cookieStore.set('human_wallet_identifier', identifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // Generate session ID for extension
    const sessionId = `ext_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    cookieStore.set('extension_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Log activity
    console.log(`Extension wallet connected: ${address} (${method})`);

    return NextResponse.json({
      success: true,
      data: {
        address,
        method,
        sessionId,
      },
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      },
      { status: 500 }
    );
  }
}
