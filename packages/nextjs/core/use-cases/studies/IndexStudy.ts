/**
 * Use Case: Index Study
 *
 * Indexes a newly created study by storing the mapping between
 * registry ID and escrow ID, along with metadata for quick lookups.
 *
 * This allows us to maintain our own index of studies without
 * having to query multiple blockchain contracts.
 */

import type { IStudyRepository } from '@/core/domain/IStudyRepository';
import type { Study, CreateStudyData } from '@/core/domain/Study';

/**
 * Request to index a study
 */
export interface IndexStudyRequest {
  registryId: number;
  escrowId: number;
  title: string;
  description: string;
  researcherAddress: string;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: bigint;
  registryBlockNumber: bigint;
  chainId?: number;
}

/**
 * Response from indexing a study
 */
export interface IndexStudyResponse {
  success: boolean;
  data?: {
    study: Study;
    message: string;
  };
  error?: string;
}

/**
 * IndexStudy Use Case
 *
 * @example
 * ```typescript
 * const useCase = new IndexStudyUseCase(studyRepository);
 *
 * const result = await useCase.execute({
 *   registryId: 1,
 *   escrowId: 1,
 *   title: "Type 2 Diabetes Study",
 *   description: "...",
 *   researcherAddress: "0x...",
 *   escrowTxHash: "0x...",
 *   registryTxHash: "0x...",
 *   criteriaTxHash: "0x...",
 *   escrowBlockNumber: 12345n,
 *   registryBlockNumber: 12346n,
 * });
 *
 * if (result.success) {
 *   console.log('Study indexed:', result.data.study.id);
 * }
 * ```
 */
export class IndexStudyUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  /**
   * Execute study indexing
   */
  async execute(request: IndexStudyRequest): Promise<IndexStudyResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Check if study already indexed by registry ID
      const existingByRegistry = await this.studyRepository.findByRegistryId(
        request.registryId
      );
      if (existingByRegistry) {
        return {
          success: true,
          data: {
            study: existingByRegistry,
            message: 'Study already indexed (found by registry ID)',
          },
        };
      }

      // Check if study already indexed by escrow ID
      const existingByEscrow = await this.studyRepository.findByEscrowId(
        request.escrowId
      );
      if (existingByEscrow) {
        return {
          success: true,
          data: {
            study: existingByEscrow,
            message: 'Study already indexed (found by escrow ID)',
          },
        };
      }

      // Create study data
      const studyData: CreateStudyData = {
        registryId: request.registryId,
        escrowId: request.escrowId,
        title: request.title,
        description: request.description,
        researcherAddress: request.researcherAddress,
        escrowTxHash: request.escrowTxHash,
        registryTxHash: request.registryTxHash,
        criteriaTxHash: request.criteriaTxHash,
        escrowBlockNumber: request.escrowBlockNumber,
        registryBlockNumber: request.registryBlockNumber,
        chainId: request.chainId,
      };

      // Index the study
      const study = await this.studyRepository.create(studyData);

      return {
        success: true,
        data: {
          study,
          message: 'Study indexed successfully',
        },
      };
    } catch (error) {
      console.error('[IndexStudyUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to index study',
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: IndexStudyRequest): string | null {
    if (!request.registryId || request.registryId <= 0) {
      return 'Invalid registry ID';
    }

    if (!request.escrowId || request.escrowId <= 0) {
      return 'Invalid escrow ID';
    }

    if (!request.title || request.title.trim().length === 0) {
      return 'Title is required';
    }

    if (!request.description || request.description.trim().length === 0) {
      return 'Description is required';
    }

    if (!request.researcherAddress || !request.researcherAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'Invalid researcher address';
    }

    if (!request.escrowTxHash || !request.escrowTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return 'Invalid escrow transaction hash';
    }

    if (!request.registryTxHash || !request.registryTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return 'Invalid registry transaction hash';
    }

    if (!request.criteriaTxHash || !request.criteriaTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return 'Invalid criteria transaction hash';
    }

    if (!request.escrowBlockNumber || request.escrowBlockNumber <= 0n) {
      return 'Invalid escrow block number';
    }

    if (!request.registryBlockNumber || request.registryBlockNumber <= 0n) {
      return 'Invalid registry block number';
    }

    return null;
  }
}

/**
 * Factory function
 */
export function createIndexStudyUseCase(
  studyRepository: IStudyRepository
): IndexStudyUseCase {
  return new IndexStudyUseCase(studyRepository);
}
