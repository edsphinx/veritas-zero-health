import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/studies/[studyId]/criteria
 *
 * Returns the eligibility criteria for a specific study from the database.
 * Used by the browser extension to fetch study requirements before generating ZK proofs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;

    console.log(`📋 Fetching criteria for study #${studyId}`);

    // Find the study with its criteria
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: {
        criteria: true,
      },
    });

    if (!study) {
      return NextResponse.json(
        { success: false, error: 'Study not found' },
        { status: 404 }
      );
    }

    // If no criteria indexed yet, return default
    if (!study.criteria) {
      console.log(`⚠️ No criteria indexed for study #${studyId}, returning defaults`);
      return NextResponse.json({
        success: true,
        criteria: {
          minAge: 18,
          maxAge: 120,
          eligibilityCodeHash: '0',
          requiredDiagnoses: [],
          biomarkerRanges: {},
        },
        studyId,
        message: 'No criteria indexed yet, using defaults'
      });
    }

    console.log(`✅ Found criteria for study #${studyId}:`, {
      minAge: study.criteria.minAge,
      maxAge: study.criteria.maxAge,
      codeHash: study.criteria.eligibilityCodeHash
    });

    return NextResponse.json({
      success: true,
      criteria: {
        minAge: study.criteria.minAge,
        maxAge: study.criteria.maxAge,
        eligibilityCodeHash: study.criteria.eligibilityCodeHash,
        requiredDiagnoses: [], // TODO: Parse from eligibilityCodeHash if needed
        biomarkerRanges: {}, // TODO: Parse from eligibilityCodeHash if needed
        transactionHash: study.criteria.transactionHash,
        blockNumber: study.criteria.blockNumber.toString(),
      },
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
