/**
 * GET /api/studies/[studyId]/applications
 * Get list of anonymous applications for a study
 * Uses clean architecture: API -> Service layer -> Blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudyApplications } from '@/shared/services/studies-blockchain.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;

    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { error: 'Invalid study ID' },
        { status: 400 }
      );
    }

    // Call service layer
    const result = await getStudyApplications(BigInt(studyId));

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      ...result,
    });

  } catch (error: any) {
    console.error('Error fetching study applications:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch applications',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
