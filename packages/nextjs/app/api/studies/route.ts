/**
 * API Endpoint: List Studies
 *
 * GET /api/studies
 *
 * Retrieves a list of studies with optional filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createGetStudiesUseCase } from '@/core/use-cases/studies/GetStudies';
import { createStudyRepository } from '@/infrastructure/repositories/PrismaStudyRepository';
import { prisma } from '@/lib/prisma';
import type { StudyFilters } from '@/core/domain/repositories';

/**
 * GET /api/studies
 *
 * Query parameters:
 * - status: Filter by study status (recruiting, active, completed, etc.)
 * - researcherId: Filter by researcher address
 * - isActive: Filter active studies (true/false)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build filters from query params
    const filters: StudyFilters = {};

    const status = searchParams.get('status');
    if (status) {
      filters.status = status;
    }

    const researcherId = searchParams.get('researcherId');
    if (researcherId) {
      filters.researcherId = researcherId;
    }

    const isActive = searchParams.get('isActive');
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    // Parse pagination params
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const limitClamped = Math.min(Math.max(limit, 1), 100); // Clamp between 1-100

    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const offsetClamped = Math.max(offset, 0); // Ensure non-negative

    console.log('[List Studies API] Request:', {
      filters,
      limit: limitClamped,
      offset: offsetClamped,
    });

    // Create repository and use case
    const studyRepository = createStudyRepository(prisma);
    const getStudiesUseCase = createGetStudiesUseCase(studyRepository);

    // Execute use case
    const result = await getStudiesUseCase.execute({
      filters,
      limit: limitClamped,
      offset: offsetClamped,
    });

    console.log('[List Studies API] Success:', {
      studiesCount: result.studies.length,
      total: result.total,
      hasMore: result.hasMore,
    });

    // Return paginated results
    return NextResponse.json({
      success: true,
      data: {
        studies: result.studies,
        pagination: {
          total: result.total,
          limit: limitClamped,
          offset: offsetClamped,
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    console.error('[List Studies API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch studies',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
