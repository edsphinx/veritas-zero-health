import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/studies/[studyId]/criteria
 *
 * Returns the eligibility criteria for a specific study.
 * Used by the browser extension to fetch study requirements before generating ZK proofs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;

    console.log(`📋 Fetching criteria for study #${studyId}`);

    // TODO: Fetch from StudyRegistry contract on Optimism Sepolia
    // For MVP, return mock criteria

    // Mock criteria based on studyId
    const mockCriteria: Record<string, any> = {
      '1': {
        minAge: 18,
        maxAge: 65,
        requiredDiagnoses: [],
        biomarkerRanges: {},
      },
      '2': {
        minAge: 21,
        maxAge: 55,
        requiredDiagnoses: ['E11.9'], // Type 2 diabetes
        biomarkerRanges: {
          'HbA1c': { min: 6.5, max: 10.0, unit: '%' }
        },
      },
      '3': {
        minAge: 40,
        maxAge: 75,
        requiredDiagnoses: ['I10'], // Hypertension
        biomarkerRanges: {},
      },
    };

    const criteria = mockCriteria[studyId] || {
      minAge: 18,
      maxAge: 120,
      requiredDiagnoses: [],
      biomarkerRanges: {},
    };

    return NextResponse.json({
      success: true,
      criteria,
      studyId,
    });

  } catch (error) {
    console.error('Error fetching study criteria:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch study criteria',
      },
      { status: 500 }
    );
  }
}
