/**
 * API Route: GET /api/studies
 *
 * Gets all indexed studies from database.
 * This is much faster than querying blockchain for each study.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { createStudyRepository } from '@/infrastructure/repositories/PrismaStudyRepository';

/**
 * GET handler - Get all studies
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const researcherAddress = searchParams.get('researcher');
    const status = searchParams.get('status');

    // Create repository
    const studyRepository = createStudyRepository(prisma);

    // Fetch studies based on filters
    let studies;

    if (researcherAddress) {
      studies = await studyRepository.findByResearcher(researcherAddress);
    } else {
      studies = await studyRepository.findAll();
    }

    // Filter by status if provided
    if (status) {
      studies = studies.filter(s => s.status === status);
    }

    // Convert BigInt to string for JSON serialization
    const responseData = studies.map(study => ({
      id: study.id,
      registryId: study.registryId,
      escrowId: study.escrowId,
      title: study.title,
      description: study.description,
      researcherAddress: study.researcherAddress,
      status: study.status,
      chainId: study.chainId,
      escrowTxHash: study.escrowTxHash,
      registryTxHash: study.registryTxHash,
      criteriaTxHash: study.criteriaTxHash,
      escrowBlockNumber: study.escrowBlockNumber.toString(),
      registryBlockNumber: study.registryBlockNumber.toString(),
      createdAt: study.createdAt,
      updatedAt: study.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: responseData,
      count: responseData.length,
    });
  } catch (error) {
    console.error('[Get Studies API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get studies',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
