/**
 * Get Study By ID Use Case
 *
 * Retrieves a single study by its database ID or blockchain registry ID
 * Returns null if study not found
 */

import type { IStudyRepository } from '@/core/domain/repositories';
import type { Study } from '@/core/domain/entities';

// Request
export interface GetStudyByIdRequest {
  id?: string; // Database ID
  registryId?: bigint; // Blockchain registry ID
}

// Response
export interface GetStudyByIdResponse {
  study: Study | null;
}

// Use Case
export class GetStudyByIdUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  async execute(request: GetStudyByIdRequest): Promise<GetStudyByIdResponse> {
    // Validate input - must provide either id or registryId
    if (!request.id && !request.registryId) {
      throw new Error('Must provide either id or registryId');
    }

    let study: Study | null = null;

    // Prefer database ID for faster lookup
    if (request.id) {
      study = await this.studyRepository.findById(request.id);
    } else if (request.registryId) {
      study = await this.studyRepository.findByRegistryId(request.registryId);
    }

    return { study };
  }
}

// Factory function
export function createGetStudyByIdUseCase(repository: IStudyRepository) {
  return new GetStudyByIdUseCase(repository);
}
