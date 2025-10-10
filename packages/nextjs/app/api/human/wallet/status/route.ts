/**
 * API Route: Get Human Wallet Status
 *
 * GET /api/human/wallet/status
 *
 * Returns current wallet connection status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHumanProtocolClient } from '@/infrastructure/human/HumanProtocolClient';

export async function GET(req: NextRequest) {
  try {
    // TODO: Implement Human Wallet status check
    // Human Wallet SDK is not yet integrated
    return NextResponse.json({
      success: true,
      data: {
        connected: false,
        address: null,
        method: null,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[API] Wallet status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
