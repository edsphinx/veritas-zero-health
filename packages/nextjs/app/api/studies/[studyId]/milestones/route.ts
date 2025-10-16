/**
 * GET /api/studies/[studyId]/milestones
 *
 * Fetches all milestones for a study from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { studyId: string } }
) {
  try {
    const { studyId } = params;

    // Find the study to verify it exists
    const study = await prisma.study.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      return NextResponse.json(
        { success: false, error: 'Study not found' },
        { status: 404 }
      );
    }

    // Fetch milestones for this study, ordered by milestoneId
    const milestones = await prisma.milestone.findMany({
      where: { studyId },
      orderBy: { milestoneId: 'asc' },
    });

    return NextResponse.json({
      success: true,
      milestones: milestones.map(m => ({
        id: m.id,
        milestoneId: m.milestoneId,
        milestoneType: m.milestoneType,
        description: m.description,
        rewardAmount: m.rewardAmount.toString(),
        status: m.status,
        transactionHash: m.transactionHash,
        blockNumber: m.blockNumber.toString(),
        createdAt: m.createdAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch milestones',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
