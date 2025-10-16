/**
 * Use Case: Get Studies By Researcher
 *
 * Retrieves all studies created by a specific researcher address.
 * Uses the indexed data for fast queries without hitting the blockchain.
 */

import type { IStudyRepository } from '@/core/domain/IStudyRepository';
import type { Study } from '@/core/domain/Study';

/**
 * Request to get studies by researcher
 */
export interface GetStudiesByResearcherRequest {
  researcherAddress: string;
}

/**
 * Response with researcher's studies
 */
export interface GetStudiesByResearcherResponse {
  success: boolean;
  data?: {
    studies: Study[];
    total: number;
  };
  error?: string;
}

/**
 * GetStudiesByResearcher Use Case
 *
 * @example
 * ```typescript
 * const useCase = new GetStudiesByResearcherUseCase(studyRepository);
 *
 * const result = await useCase.execute({
 *   researcherAddress: "0x1234..."
 * });
 *
 * if (result.success) {
 *   console.log('Found studies:', result.data.studies.length);
 * }
 * ```
 */
export class GetStudiesByResearcherUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  /**
   * Execute query
   */
  async execute(
    request: GetStudiesByResearcherRequest
  ): Promise<GetStudiesByResearcherResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Normalize address
      const normalizedAddress = request.researcherAddress.toLowerCase();

      // Get studies
      const studies = await this.studyRepository.findByResearcher(normalizedAddress);

      // Get total count
      const total = await this.studyRepository.countByResearcher(normalizedAddress);

      return {
        success: true,
        data: {
          studies,
          total,
        },
      };
    } catch (error) {
      console.error('[GetStudiesByResearcherUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get studies',
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: GetStudiesByResearcherRequest): string | null {
    if (!request.researcherAddress) {
      return 'Researcher address is required';
    }

    if (!request.researcherAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'Invalid researcher address format';
    }

    return null;
  }
}

/**
 * Factory function
 */
export function createGetStudiesByResearcherUseCase(
  studyRepository: IStudyRepository
): GetStudiesByResearcherUseCase {
  return new GetStudiesByResearcherUseCase(studyRepository);
}
