/**
 * API Route: GET /api/studies
 *
 * Gets all indexed studies from database.
 * This is much faster than querying blockchain for each study.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

/**
 * GET handler - Get all studies
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const researcherAddress = searchParams.get('researcher');
    const status = searchParams.get('status');

    // Fetch studies based on filters (directly from Prisma with criteria included)
    let studies;

    if (researcherAddress) {
      studies = await prisma.study.findMany({
        where: { researcherAddress },
        include: { criteria: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      studies = await prisma.study.findMany({
        include: { criteria: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Filter by status if provided
    if (status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      studies = studies.filter((s: any) => s.status === status);
    }

    // Convert BigInt to string for JSON serialization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = studies.map((study: any) => ({
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
      // Include criteria if available
      criteria: study.criteria ? {
        ...study.criteria,
        blockNumber: study.criteria.blockNumber.toString(),
      } : null,
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
