/**
 * Use Case: Apply to Clinical Trial
 *
 * Orchestrates the complete flow for applying to a clinical trial:
 * 1. Validates user prerequisites (DID, Passport verification, health data)
 * 2. Generates ZK proof of eligibility (via extension)
 * 3. Submits anonymous application to StudyRegistry contract
 *
 * This is the primary use case for patient trial enrollment.
 */

import type { HumanProtocolClient } from '@/infrastructure/human/HumanProtocolClient';
import type { NillionClient } from '@/infrastructure/nillion/NillionClient';
import type { ExtensionBridge } from '@/infrastructure/extension/ExtensionBridge';

/**
 * Prerequisites check result
 */
interface PrerequisitesCheck {
  hasDID: boolean;
  isVerified: boolean;
  hasHealthData: boolean;
  hasExtension: boolean;
  canApply: boolean;
  missingRequirements: string[];
}

/**
 * ZK proof generation result
 */
interface ProofGenerationResult {
  proof: `0x${string}`;
  publicInputs: string[];
  generatedAt: number;
}

/**
 * Request params for applying to trial
 */
export interface ApplyToTrialRequest {
  studyId: bigint;
  userAddress: string;
  patientAge: number; // Actual age (kept private, used for proof)
}

/**
 * Response from apply to trial
 */
export interface ApplyToTrialResponse {
  success: boolean;
  data?: {
    txHash: string;
    studyId: bigint;
    appliedAt: number;
    proofGenerated: boolean;
  };
  error?: string;
  errorType?: 'PREREQUISITES' | 'PROOF_GENERATION' | 'SUBMISSION' | 'UNKNOWN';
  missingRequirements?: string[];
}

/**
 * ApplyToTrial Use Case
 *
 * Coordinates between multiple infrastructure services to complete
 * the anonymous trial application process.
 *
 * @example
 * ```typescript
 * const useCase = new ApplyToTrialUseCase(
 *   humanClient,
 *   nillionClient,
 *   extensionBridge
 * );
 *
 * const result = await useCase.execute({
 *   studyId: 1n,
 *   userAddress: '0x...',
 *   patientAge: 35
 * });
 * ```
 */
export class ApplyToTrialUseCase {
  constructor(
    private humanClient: HumanProtocolClient,
    private nillionClient: NillionClient,
    private extensionBridge: ExtensionBridge
  ) {}

  /**
   * Execute the apply to trial flow
   */
  async execute(request: ApplyToTrialRequest): Promise<ApplyToTrialResponse> {
    try {
      // Step 1: Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          errorType: 'PREREQUISITES',
        };
      }

      // Step 2: Check prerequisites
      const prerequisites = await this.checkPrerequisites(request.userAddress);
      if (!prerequisites.canApply) {
        return {
          success: false,
          error: 'Prerequisites not met. Please complete the required steps.',
          errorType: 'PREREQUISITES',
          missingRequirements: prerequisites.missingRequirements,
        };
      }

      // Step 3: Generate ZK proof of eligibility
      let proofResult: ProofGenerationResult;
      try {
        proofResult = await this.generateEligibilityProof(request);
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate eligibility proof',
          errorType: 'PROOF_GENERATION',
        };
      }

      // Step 4: Submit application to contract
      // Note: The actual contract call should be done in the presentation layer
      // This use case returns the proof and validates the flow
      return {
        success: true,
        data: {
          txHash: '0x0', // Placeholder - actual tx happens in presentation layer
          studyId: request.studyId,
          appliedAt: Date.now(),
          proofGenerated: true,
        },
      };
    } catch (error) {
      console.error('[ApplyToTrialUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to apply to trial',
        errorType: 'UNKNOWN',
      };
    }
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: ApplyToTrialRequest): string | null {
    if (!request.studyId || request.studyId <= 0n) {
      return 'Invalid study ID';
    }

    if (!this.isValidEthereumAddress(request.userAddress)) {
      return 'Invalid Ethereum address';
    }

    if (!request.patientAge || request.patientAge < 0 || request.patientAge > 150) {
      return 'Invalid age value';
    }

    return null;
  }

  /**
   * Check if user meets all prerequisites for applying
   */
  private async checkPrerequisites(
    userAddress: string
  ): Promise<PrerequisitesCheck> {
    const missingRequirements: string[] = [];

    // Check 1: Does user have DID?
    let hasDID = false;
    try {
      await this.nillionClient.initialize();
      const did = await this.nillionClient.getUserDID();
      hasDID = !!did;
    } catch {
      missingRequirements.push('Create your Veritas DID via browser extension');
    }

    // Check 2: Is user verified via Human Passport?
    let isVerified = false;
    try {
      isVerified = await this.humanClient.isVerified(userAddress);
      if (!isVerified) {
        missingRequirements.push('Complete Human Passport verification');
      }
    } catch {
      missingRequirements.push('Verify your identity with Human Passport');
    }

    // Check 3: Does user have health data?
    let hasHealthData = false;
    try {
      hasHealthData = await this.nillionClient.hasHealthData();
      if (!hasHealthData) {
        missingRequirements.push('Add your health data to Nillion vault');
      }
    } catch {
      // Health data check failed, but not critical
      console.warn('Could not check health data');
    }

    // Check 4: Is extension installed?
    let hasExtension = false;
    try {
      await this.extensionBridge.initialize();
      hasExtension = this.extensionBridge.isExtensionInstalled();
      if (!hasExtension) {
        missingRequirements.push('Install Veritas browser extension');
      }
    } catch {
      missingRequirements.push('Install and setup Veritas browser extension');
    }

    return {
      hasDID,
      isVerified,
      hasHealthData,
      hasExtension,
      canApply: missingRequirements.length === 0,
      missingRequirements,
    };
  }

  /**
   * Generate ZK proof of eligibility
   *
   * Requests the browser extension to generate a proof that the patient
   * meets the study criteria without revealing actual health data.
   */
  private async generateEligibilityProof(
    request: ApplyToTrialRequest
  ): Promise<ProofGenerationResult> {
    // TODO: Implement actual proof generation via extension
    // This would involve:
    // 1. Fetching study criteria from contract
    // 2. Fetching patient health data from Nillion
    // 3. Requesting extension to generate proof
    // 4. Receiving proof bytes

    // For now, return a mock proof structure
    // The actual implementation will use window.Veritas.generateProof()

    throw new Error(
      'Proof generation not yet implemented. Extension API needs to be extended.'
    );

    // Future implementation:
    // const studyCriteria = await this.getStudyCriteria(request.studyId);
    // const healthData = await this.nillionClient.getAllHealthData();
    //
    // const proofRequest = {
    //   studyId: request.studyId.toString(),
    //   criteria: studyCriteria,
    //   patientAge: request.patientAge,
    //   healthData: healthData,
    // };
    //
    // const proof = await this.extensionBridge.generateProof(proofRequest);
    // return {
    //   proof: `0x${proof.hex}`,
    //   publicInputs: proof.publicInputs,
    //   generatedAt: Date.now(),
    // };
  }

  /**
   * Validate Ethereum address format
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

/**
 * Factory function to create ApplyToTrialUseCase with dependencies
 */
export function createApplyToTrialUseCase(
  humanClient: HumanProtocolClient,
  nillionClient: NillionClient,
  extensionBridge: ExtensionBridge
): ApplyToTrialUseCase {
  return new ApplyToTrialUseCase(humanClient, nillionClient, extensionBridge);
}
