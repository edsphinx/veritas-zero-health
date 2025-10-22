/**
 * API Endpoint: Index Study
 *
 * POST /api/studies/index
 *
 * Indexes a newly created study by storing the mapping between
 * registry ID and escrow ID, along with metadata for quick lookups.
 *
 * Updated to include all new fields: sponsor, maxParticipants,
 * certifiedProviders, participantCount, remainingFunding
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { createIndexStudyUseCase } from '@/core/use-cases/studies/IndexStudy';
import { createStudyRepository } from '@/infrastructure/repositories/PrismaStudyRepository';
import { prisma } from '@/lib/prisma';

/**
 * Request body interface
 */
interface IndexStudyRequestBody {
  registryId: number;
  escrowId: number;
  title: string;
  description: string;
  researcherAddress: string;

  // Funding & Participants
  totalFunding?: string;
  sponsor: string;
  maxParticipants: number;
  certifiedProviders?: string[];
  participantCount?: number;
  remainingFunding?: string;

  // Blockchain tracking
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: string; // Sent as string from frontend
  registryBlockNumber: string; // Sent as string from frontend
  chainId?: number;
}

/**
 * POST /api/studies/index
 *
 * Index a newly created study
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: IndexStudyRequestBody = await request.json();

    console.log('[Index Study API] Request:', {
      registryId: body.registryId,
      escrowId: body.escrowId,
      title: body.title,
      researcherAddress: body.researcherAddress,
      sponsor: body.sponsor,
      maxParticipants: body.maxParticipants,
      userAddress: session.address,
      escrowTxHash: body.escrowTxHash,
      registryTxHash: body.registryTxHash,
      criteriaTxHash: body.criteriaTxHash,
      escrowBlockNumber: body.escrowBlockNumber,
      registryBlockNumber: body.registryBlockNumber,
    });

    // Verify the requester is the researcher
    if (body.researcherAddress.toLowerCase() !== session.address.toLowerCase()) {
      console.warn('[Index Study API] Address mismatch:', {
        bodyAddress: body.researcherAddress,
        sessionAddress: session.address,
      });
      return NextResponse.json(
        { success: false, error: 'Only the study creator can index the study' },
        { status: 403 }
      );
    }

    // Create repository and use case
    const studyRepository = createStudyRepository(prisma);
    const indexStudyUseCase = createIndexStudyUseCase(studyRepository);

    // Execute use case
    const result = await indexStudyUseCase.execute({
      registryId: body.registryId,
      escrowId: body.escrowId,
      title: body.title,
      description: body.description,
      researcherAddress: body.researcherAddress,

      // Funding & Participants
      totalFunding: body.totalFunding,
      sponsor: body.sponsor,
      maxParticipants: body.maxParticipants,
      certifiedProviders: body.certifiedProviders,
      participantCount: body.participantCount,
      remainingFunding: body.remainingFunding,

      // Blockchain tracking
      escrowTxHash: body.escrowTxHash,
      registryTxHash: body.registryTxHash,
      criteriaTxHash: body.criteriaTxHash,
      escrowBlockNumber: BigInt(body.escrowBlockNumber),
      registryBlockNumber: BigInt(body.registryBlockNumber),
      chainId: body.chainId,
    });

    if (!result.success) {
      console.error('[Index Study API] Use case error:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    console.log('[Index Study API] Success:', {
      studyId: result.data?.study.id,
      message: result.data?.message,
    });

    // Return success with indexed study
    return jsonResponse({
      success: true,
      data: {
        id: result.data!.study.id, // Use 'id' for consistency
        studyId: result.data!.study.id, // Keep for backwards compatibility
        registryId: result.data!.study.registryId,
        escrowId: result.data!.study.escrowId,
        message: result.data!.message,
      },
    });
  } catch (error) {
    console.error('[Index Study API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to index study',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
