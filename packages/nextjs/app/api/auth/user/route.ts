/**
 * User Auth API Route
 *
 * GET  /api/auth/user?address=0x... - Get user data by address
 * PUT  /api/auth/user                - Update user role
 * POST /api/auth/user                - Create or update user (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/shared/services/user.service';
import { UserRole } from '@/shared/types/auth.types';

/**
 * GET - Fetch user by address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const user = await userService.getUserByAddress(address);

    if (!user) {
      // User not found in database
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[API /auth/user GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user role
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, role } = body;

    if (!address || !role) {
      return NextResponse.json(
        { error: 'Address and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Upsert user with new role
    const user = await userService.upsertUser(address, { role });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[API /auth/user PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update user (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      role,
      isVerified,
      humanityScore,
      displayName,
      email,
      avatar,
    } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const user = await userService.upsertUser(address, {
      role,
      isVerified,
      humanityScore,
      displayName,
      email,
      avatar,
      verifiedAt: isVerified ? new Date() : undefined,
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[API /auth/user POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}
