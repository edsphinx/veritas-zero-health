/**
 * API Endpoint: Get Study by ID
 *
 * GET /api/studies/[studyId]
 *
 * Retrieves a single study by its database ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGetStudyByIdUseCase } from '@/core/use-cases/studies/GetStudyById';
import { createStudyRepository } from '@/infrastructure/repositories/PrismaStudyRepository';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    studyId: string;
  };
}

/**
 * GET /api/studies/[studyId]
 *
 * Returns study details including:
 * - Basic information (title, description, status)
 * - Funding information
 * - Participant counts
 * - Blockchain tracking data
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { studyId } = params;

    console.log('[Get Study API] Request:', { studyId });

    // Validate studyId
    if (!studyId || studyId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Study ID is required',
        },
        { status: 400 }
      );
    }

    // Create repository and use case
    const studyRepository = createStudyRepository(prisma);
    const getStudyByIdUseCase = createGetStudyByIdUseCase(studyRepository);

    // Execute use case
    const result = await getStudyByIdUseCase.execute({
      id: studyId,
    });

    if (!result.study) {
      console.warn('[Get Study API] Study not found:', { studyId });
      return NextResponse.json(
        {
          success: false,
          error: 'Study not found',
        },
        { status: 404 }
      );
    }

    console.log('[Get Study API] Success:', {
      studyId: result.study.id,
      title: result.study.title,
      status: result.study.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        study: result.study,
      },
    });
  } catch (error) {
    console.error('[Get Study API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch study',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
