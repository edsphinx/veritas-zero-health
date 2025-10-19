/**
 * Get Studies Use Case
 *
 * Retrieves list of studies with optional filtering
 * Used for displaying studies list in patient/researcher portals
 */

import type { IStudyRepository, StudyFilters } from '@/core/domain/repositories';
import type { Study } from '@/core/domain/entities';

// Request
export interface GetStudiesRequest {
  filters?: StudyFilters;
  limit?: number;
  offset?: number;
}

// Response
export interface GetStudiesResponse {
  studies: Study[];
  total: number;
  hasMore: boolean;
}

// Use Case
export class GetStudiesUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  async execute(request: GetStudiesRequest = {}): Promise<GetStudiesResponse> {
    // Validate pagination params
    const limit = request.limit && request.limit > 0 ? request.limit : 50;
    const offset = request.offset && request.offset >= 0 ? request.offset : 0;

    // Get total count for pagination
    const total = await this.studyRepository.count(request.filters);

    // Get studies
    const allStudies = await this.studyRepository.findAll(request.filters);

    // Apply pagination
    const studies = allStudies.slice(offset, offset + limit);

    // Check if there are more results
    const hasMore = offset + studies.length < total;

    return {
      studies,
      total,
      hasMore,
    };
  }
}

// Factory function for easy instantiation
export function createGetStudiesUseCase(repository: IStudyRepository) {
  return new GetStudiesUseCase(repository);
}
