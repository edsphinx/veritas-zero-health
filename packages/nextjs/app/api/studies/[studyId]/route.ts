/**
 * API Route: GET /api/studies/[studyId]
 *
 * Gets study details from indexed database.
 * Much faster than querying blockchain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { createStudyRepository } from '@/infrastructure/repositories/PrismaStudyRepository';

/**
 * GET handler - Get study by escrowId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;

    // Validate input
    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { success: false, error: 'Invalid study ID' },
        { status: 400 }
      );
    }

    // Fetch study with all relations (criteria, milestones, applications, deposits)
    const study = await prisma.study.findFirst({
      where: { escrowId: Number(studyId) },
      include: {
        criteria: true,
        milestones: {
          orderBy: { milestoneId: 'asc' },
        },
        applications: {
          orderBy: { appliedAt: 'desc' },
        },
        deposits: {
          orderBy: { depositedAt: 'desc' },
        },
      },
    });

    if (!study) {
      return NextResponse.json(
        { success: false, error: 'Study not found' },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const responseData = {
      id: study.id,
      registryId: study.registryId,
      escrowId: study.escrowId,
      title: study.title,
      description: study.description,
      researcherAddress: study.researcherAddress,
      status: study.status,
      totalFunding: study.totalFunding,
      chainId: study.chainId,
      escrowTxHash: study.escrowTxHash,
      registryTxHash: study.registryTxHash,
      criteriaTxHash: study.criteriaTxHash,
      escrowBlockNumber: study.escrowBlockNumber.toString(),
      registryBlockNumber: study.registryBlockNumber.toString(),
      createdAt: study.createdAt,
      updatedAt: study.updatedAt,
      // Include relations
      criteria: study.criteria ? {
        ...study.criteria,
        blockNumber: study.criteria.blockNumber.toString(),
      } : null,
      milestones: study.milestones.map(m => ({
        ...m,
        blockNumber: m.blockNumber.toString(),
      })),
      applications: study.applications.map(a => ({
        ...a,
        applicationBlockNumber: a.applicationBlockNumber.toString(),
        proofBlockNumber: a.proofBlockNumber?.toString() || null,
        enrollmentBlockNumber: a.enrollmentBlockNumber?.toString() || null,
      })),
      deposits: study.deposits.map(d => ({
        ...d,
        amount: d.amount.toString(),
        blockNumber: d.blockNumber.toString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('[Get Study API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get study',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
