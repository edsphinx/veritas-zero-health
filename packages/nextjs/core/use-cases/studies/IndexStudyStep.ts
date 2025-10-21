/**
 * Use Case: Index Study Step
 *
 * Updates a study with wizard step completion information.
 * Called after each wizard step transaction is confirmed on-chain.
 *
 * This use case:
 * - Tracks which wizard steps have been completed
 * - Stores transaction hashes and block numbers for each step
 * - Marks wizard as complete when all steps are done
 * - Indexes milestones to database after milestone creation
 */

import type { IStudyRepository } from '@/core/domain/repositories';
import type { UpdateStudyData } from '@/core/domain/entities';

/**
 * Valid wizard step names
 */
export type WizardStepName = 'escrow' | 'registry' | 'criteria' | 'milestones';

/**
 * Request to index a wizard step
 */
export interface IndexStepRequest {
  // Study identification (use either registryId OR escrowId)
  registryId?: number;
  escrowId?: number;

  // Step information
  step: WizardStepName;
  transactionHash: string;
  blockNumber: bigint;
  chainId?: number;

  // Step-specific data (optional, depends on step)
  stepData?: {
    // For escrow step
    escrowId?: number;
    totalFunding?: string;
    sponsor?: string;

    // For registry step
    registryId?: number;
    title?: string;
    description?: string;
    maxParticipants?: number;

    // For criteria step
    minAge?: number;
    maxAge?: number;
    eligibilityCodeHash?: string;

    // For milestones step
    milestones?: Array<{
      milestoneId: number;
      milestoneType: number;
      description: string;
      rewardAmount: string;
    }>;
  };
}

/**
 * Response from indexing a step
 */
export interface IndexStepResponse {
  success: boolean;
  data?: {
    studyId: string;
    step: WizardStepName;
    stepsCompleted: string[];
    wizardComplete: boolean;
    message: string;
  };
  error?: string;
}

/**
 * IndexStudyStep Use Case
 *
 * @example
 * ```typescript
 * const useCase = new IndexStudyStepUseCase(studyRepository);
 *
 * // Index escrow step
 * await useCase.execute({
 *   step: 'escrow',
 *   transactionHash: '0x...',
 *   blockNumber: 12345n,
 *   stepData: {
 *     escrowId: 1,
 *     totalFunding: '10000.00',
 *     sponsor: '0x...'
 *   }
 * });
 *
 * // Index registry step
 * await useCase.execute({
 *   escrowId: 1,
 *   step: 'registry',
 *   transactionHash: '0x...',
 *   blockNumber: 12346n,
 *   stepData: {
 *     registryId: 1,
 *     title: 'Study Title',
 *     description: '...',
 *     maxParticipants: 100
 *   }
 * });
 *
 * // Index milestones step
 * await useCase.execute({
 *   registryId: 1,
 *   step: 'milestones',
 *   transactionHash: '0x...',
 *   blockNumber: 12348n,
 *   stepData: {
 *     milestones: [
 *       { milestoneId: 0, milestoneType: 0, description: 'Enrollment', rewardAmount: '100.00' }
 *     ]
 *   }
 * });
 * ```
 */
export class IndexStudyStepUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  /**
   * Execute step indexing
   */
  async execute(request: IndexStepRequest): Promise<IndexStepResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Find study by registryId or escrowId
      const study = await this.findStudy(request);
      if (!study) {
        return {
          success: false,
          error: 'Study not found. Please create study first via IndexStudy use case.',
        };
      }

      // Update study based on step
      const updatedStudy = await this.updateStudyForStep(
        study.id,
        request.step,
        request.transactionHash,
        request.blockNumber,
        request.stepData,
        request.chainId
      );

      // Check if wizard is complete
      const wizardComplete = this.isWizardComplete(updatedStudy.wizardStepsCompleted);

      return {
        success: true,
        data: {
          studyId: updatedStudy.id,
          step: request.step,
          stepsCompleted: updatedStudy.wizardStepsCompleted,
          wizardComplete,
          message: wizardComplete
            ? 'Wizard completed! All steps indexed successfully.'
            : `Step '${request.step}' indexed successfully.`,
        },
      };
    } catch (error) {
      console.error('[IndexStudyStepUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to index study step',
      };
    }
  }

  /**
   * Find study by registryId or escrowId
   */
  private async findStudy(request: IndexStepRequest) {
    if (request.registryId) {
      return await this.studyRepository.findByRegistryId(BigInt(request.registryId));
    }

    if (request.escrowId) {
      return await this.studyRepository.findByEscrowId(BigInt(request.escrowId));
    }

    // If neither provided, try to extract from stepData
    if (request.stepData?.registryId) {
      return await this.studyRepository.findByRegistryId(BigInt(request.stepData.registryId));
    }

    if (request.stepData?.escrowId) {
      return await this.studyRepository.findByEscrowId(BigInt(request.stepData.escrowId));
    }

    return null;
  }

  /**
   * Update study with step-specific data
   */
  private async updateStudyForStep(
    studyId: string,
    step: WizardStepName,
    transactionHash: string,
    blockNumber: bigint,
    stepData: IndexStepRequest['stepData'],
    chainId?: number
  ) {
    const updateData: UpdateStudyData = {};

    // Step-specific updates
    switch (step) {
      case 'escrow':
        updateData.escrowTxHash = transactionHash;
        updateData.escrowBlockNumber = blockNumber.toString();
        // Note: escrowId is immutable and set at creation, cannot update it
        if (stepData?.totalFunding) updateData.totalFunding = stepData.totalFunding;
        if (stepData?.sponsor) updateData.sponsor = stepData.sponsor;
        if (chainId) updateData.chainId = chainId;
        break;

      case 'registry':
        updateData.registryTxHash = transactionHash;
        updateData.registryBlockNumber = blockNumber.toString();
        // Note: registryId is immutable and set at creation, cannot update it
        if (stepData?.title) updateData.title = stepData.title;
        if (stepData?.description) updateData.description = stepData.description;
        if (stepData?.maxParticipants) updateData.maxParticipants = stepData.maxParticipants;
        break;

      case 'criteria':
        updateData.criteriaTxHash = transactionHash;
        // Criteria details stored in separate StudyCriteria table (handled elsewhere)
        break;

      case 'milestones':
        updateData.milestonesTxHash = transactionHash;
        updateData.milestonesBlockNumber = blockNumber.toString();
        updateData.milestonesIndexedAt = new Date();
        // Milestones stored in separate StudyMilestone table (handled elsewhere)
        break;
    }

    // Get current steps
    const currentStudy = await this.studyRepository.findById(studyId);
    if (!currentStudy) {
      throw new Error('Study not found during update');
    }

    // Add step to completed steps array (avoid duplicates)
    const stepsCompleted = currentStudy.wizardStepsCompleted || [];
    if (!stepsCompleted.includes(step)) {
      stepsCompleted.push(step);
    }

    updateData.wizardStepsCompleted = stepsCompleted;

    // Check if wizard is complete
    const wizardComplete = this.isWizardComplete(stepsCompleted);
    if (wizardComplete) {
      updateData.wizardCompleted = true;
      updateData.wizardCompletedAt = new Date();
    }

    // Update study
    return await this.studyRepository.update(studyId, updateData);
  }

  /**
   * Check if all wizard steps are completed
   */
  private isWizardComplete(stepsCompleted: string[]): boolean {
    const requiredSteps: WizardStepName[] = ['escrow', 'registry', 'criteria', 'milestones'];
    return requiredSteps.every((step) => stepsCompleted.includes(step));
  }

  /**
   * Validate request
   */
  private validateRequest(request: IndexStepRequest): string | null {
    // Must have either registryId or escrowId or stepData with IDs
    if (
      !request.registryId &&
      !request.escrowId &&
      !request.stepData?.registryId &&
      !request.stepData?.escrowId
    ) {
      return 'Either registryId or escrowId is required';
    }

    // Validate step name
    const validSteps: WizardStepName[] = ['escrow', 'registry', 'criteria', 'milestones'];
    if (!validSteps.includes(request.step)) {
      return `Invalid step. Must be one of: ${validSteps.join(', ')}`;
    }

    // Validate transaction hash
    if (!request.transactionHash || !request.transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return 'Invalid transaction hash';
    }

    // Validate block number
    if (!request.blockNumber || request.blockNumber <= BigInt(0)) {
      return 'Invalid block number';
    }

    return null;
  }
}

/**
 * Factory function
 */
export function createIndexStudyStepUseCase(
  studyRepository: IStudyRepository
): IndexStudyStepUseCase {
  return new IndexStudyStepUseCase(studyRepository);
}
