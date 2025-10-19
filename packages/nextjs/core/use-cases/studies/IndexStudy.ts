/**
 * Use Case: Index Study
 *
 * Indexes a newly created study by storing the mapping between
 * registry ID and escrow ID, along with metadata for quick lookups.
 *
 * This allows us to maintain our own index of studies without
 * having to query multiple blockchain contracts.
 *
 * Updated to include all new fields: sponsor, maxParticipants,
 * certifiedProviders, participantCount, remainingFunding
 */

import type { IStudyRepository } from '@/core/domain/repositories';
import type { Study } from '@/core/domain/entities';
import type { CreateStudyData } from '@/core/domain/entities';
import { StudyStatus } from '@veritas/types';

/**
 * Request to index a study
 */
export interface IndexStudyRequest {
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
 *   sponsor: "0x...",
 *   maxParticipants: 100,
 *   totalFunding: "10000.00",
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
        BigInt(request.registryId)
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

      // Create study data
      const studyData: CreateStudyData = {
        registryId: request.registryId,
        escrowId: request.escrowId,
        title: request.title,
        description: request.description,
        researcherAddress: request.researcherAddress,
        status: StudyStatus.Recruiting, // New studies start as recruiting

        // Funding & Participants
        totalFunding: request.totalFunding,
        sponsor: request.sponsor,
        maxParticipants: request.maxParticipants,
        certifiedProviders: request.certifiedProviders,
        participantCount: request.participantCount,
        remainingFunding: request.remainingFunding,

        // Blockchain tracking
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

    if (!request.sponsor || !request.sponsor.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'Invalid sponsor address';
    }

    if (!request.maxParticipants || request.maxParticipants <= 0) {
      return 'Max participants must be greater than 0';
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

    if (!request.escrowBlockNumber || request.escrowBlockNumber <= BigInt(0)) {
      return 'Invalid escrow block number';
    }

    if (!request.registryBlockNumber || request.registryBlockNumber <= BigInt(0)) {
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
