/**
 * Use Case: Complete Onboarding
 *
 * Orchestrates the complete onboarding flow for new patients:
 * 1. Verifies Human Passport (Sybil-resistance)
 * 2. Creates Nillion vault for health data (via extension)
 * 3. Generates Veritas DID (via extension)
 * 4. Initializes user profile
 *
 * This is the primary use case for new user setup.
 */

import type { HumanProtocolClient } from '@/infrastructure/human/HumanProtocolClient';
import type { NillionClient } from '@/infrastructure/nillion/NillionClient';
import type { ExtensionBridge } from '@/infrastructure/extension/ExtensionBridge';

/**
 * Onboarding step status
 */
export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  WALLET_CONNECTED = 'wallet_connected',
  PASSPORT_VERIFIED = 'passport_verified',
  VAULT_CREATED = 'vault_created',
  DID_GENERATED = 'did_generated',
  COMPLETED = 'completed',
}

/**
 * Individual onboarding step result
 */
interface StepResult {
  step: OnboardingStep;
  completed: boolean;
  error?: string;
  data?: any;
}

/**
 * Request params for onboarding
 */
export interface CompleteOnboardingRequest {
  address: string;
  skipPassportVerification?: boolean; // For testing
}

/**
 * Response from onboarding
 */
export interface CompleteOnboardingResponse {
  success: boolean;
  data?: {
    currentStep: OnboardingStep;
    isComplete: boolean;
    did?: string;
    vaultCreated: boolean;
    passportVerified: boolean;
    passportScore?: number;
    completedAt?: number;
    steps: StepResult[];
  };
  error?: string;
  errorStep?: OnboardingStep;
}

/**
 * CompleteOnboarding Use Case
 *
 * Manages the multi-step onboarding process for new patients.
 * Each step is idempotent - can be safely retried.
 *
 * @example
 * ```typescript
 * const useCase = new CompleteOnboardingUseCase(
 *   humanClient,
 *   nillionClient,
 *   extensionBridge
 * );
 *
 * const result = await useCase.execute({
 *   address: '0x...'
 * });
 *
 * if (result.success && result.data?.isComplete) {
 *   console.log('Onboarding complete!');
 * }
 * ```
 */
export class CompleteOnboardingUseCase {
  constructor(
    private humanClient: HumanProtocolClient,
    private nillionClient: NillionClient,
    private extensionBridge: ExtensionBridge
  ) {}

  /**
   * Execute the complete onboarding flow
   */
  async execute(
    request: CompleteOnboardingRequest
  ): Promise<CompleteOnboardingResponse> {
    const steps: StepResult[] = [];
    let currentStep = OnboardingStep.NOT_STARTED;

    try {
      // Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          errorStep: OnboardingStep.NOT_STARTED,
        };
      }

      // Step 1: Verify wallet is connected
      currentStep = OnboardingStep.WALLET_CONNECTED;
      steps.push({
        step: OnboardingStep.WALLET_CONNECTED,
        completed: true,
        data: { address: request.address },
      });

      // Step 2: Verify Human Passport
      currentStep = OnboardingStep.PASSPORT_VERIFIED;
      const passportResult = await this.verifyPassport(
        request.address,
        request.skipPassportVerification
      );

      if (!passportResult.completed) {
        return {
          success: false,
          error: passportResult.error || 'Passport verification failed',
          errorStep: OnboardingStep.PASSPORT_VERIFIED,
          data: {
            currentStep,
            isComplete: false,
            vaultCreated: false,
            passportVerified: false,
            steps,
          },
        };
      }

      steps.push(passportResult);

      // Step 3: Initialize Nillion (via extension)
      currentStep = OnboardingStep.VAULT_CREATED;
      const vaultResult = await this.initializeNillion();

      if (!vaultResult.completed) {
        return {
          success: false,
          error: vaultResult.error || 'Vault creation failed',
          errorStep: OnboardingStep.VAULT_CREATED,
          data: {
            currentStep,
            isComplete: false,
            vaultCreated: false,
            passportVerified: passportResult.completed,
            passportScore: passportResult.data?.score,
            steps,
          },
        };
      }

      steps.push(vaultResult);

      // Step 4: Generate DID (via extension)
      currentStep = OnboardingStep.DID_GENERATED;
      const didResult = await this.generateDID();

      if (!didResult.completed) {
        return {
          success: false,
          error: didResult.error || 'DID generation failed',
          errorStep: OnboardingStep.DID_GENERATED,
          data: {
            currentStep,
            isComplete: false,
            vaultCreated: vaultResult.completed,
            passportVerified: passportResult.completed,
            passportScore: passportResult.data?.score,
            steps,
          },
        };
      }

      steps.push(didResult);

      // Step 5: Mark as completed
      currentStep = OnboardingStep.COMPLETED;
      steps.push({
        step: OnboardingStep.COMPLETED,
        completed: true,
        data: { completedAt: Date.now() },
      });

      // Success!
      return {
        success: true,
        data: {
          currentStep: OnboardingStep.COMPLETED,
          isComplete: true,
          did: didResult.data?.did,
          vaultCreated: vaultResult.completed,
          passportVerified: passportResult.completed,
          passportScore: passportResult.data?.score,
          completedAt: Date.now(),
          steps,
        },
      };
    } catch (error) {
      console.error('[CompleteOnboardingUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to complete onboarding',
        errorStep: currentStep,
        data: {
          currentStep,
          isComplete: false,
          vaultCreated: false,
          passportVerified: false,
          steps,
        },
      };
    }
  }

  /**
   * Check current onboarding status without making changes
   */
  async checkStatus(address: string): Promise<CompleteOnboardingResponse> {
    const steps: StepResult[] = [];
    let currentStep = OnboardingStep.NOT_STARTED;

    try {
      // Check wallet
      if (!address) {
        return {
          success: true,
          data: {
            currentStep: OnboardingStep.NOT_STARTED,
            isComplete: false,
            vaultCreated: false,
            passportVerified: false,
            steps,
          },
        };
      }

      currentStep = OnboardingStep.WALLET_CONNECTED;
      steps.push({
        step: OnboardingStep.WALLET_CONNECTED,
        completed: true,
      });

      // Check Passport
      let passportVerified = false;
      let passportScore: number | undefined;

      try {
        passportVerified = await this.humanClient.isVerified(address);
        if (passportVerified) {
          const details = await this.humanClient.getVerificationDetails(address);
          passportScore = details.score;
          currentStep = OnboardingStep.PASSPORT_VERIFIED;
          steps.push({
            step: OnboardingStep.PASSPORT_VERIFIED,
            completed: true,
            data: { score: passportScore },
          });
        }
      } catch (error) {
        console.warn('Could not check passport status:', error);
      }

      // Check Nillion/DID (via extension)
      let hasDID = false;
      let did: string | undefined;

      try {
        await this.extensionBridge.initialize();
        did = await this.extensionBridge.requestDID();
        hasDID = !!did;

        if (hasDID) {
          currentStep = OnboardingStep.DID_GENERATED;
          steps.push({
            step: OnboardingStep.VAULT_CREATED,
            completed: true,
          });
          steps.push({
            step: OnboardingStep.DID_GENERATED,
            completed: true,
            data: { did },
          });
        }
      } catch (error) {
        console.warn('Could not check DID status:', error);
      }

      // Determine completion
      const isComplete = passportVerified && hasDID;

      if (isComplete) {
        currentStep = OnboardingStep.COMPLETED;
        steps.push({
          step: OnboardingStep.COMPLETED,
          completed: true,
        });
      }

      return {
        success: true,
        data: {
          currentStep,
          isComplete,
          did,
          vaultCreated: hasDID, // If DID exists, vault was created
          passportVerified,
          passportScore,
          steps,
        },
      };
    } catch (error) {
      console.error('[CompleteOnboardingUseCase] Status check error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed',
        data: {
          currentStep,
          isComplete: false,
          vaultCreated: false,
          passportVerified: false,
          steps,
        },
      };
    }
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: CompleteOnboardingRequest): string | null {
    if (!request.address || !this.isValidEthereumAddress(request.address)) {
      return 'Invalid Ethereum address';
    }

    return null;
  }

  /**
   * Step: Verify Human Passport
   */
  private async verifyPassport(
    address: string,
    skip?: boolean
  ): Promise<StepResult> {
    if (skip) {
      return {
        step: OnboardingStep.PASSPORT_VERIFIED,
        completed: true,
        data: { skipped: true },
      };
    }

    try {
      // Check if already verified
      const isVerified = await this.humanClient.isVerified(address);

      if (!isVerified) {
        return {
          step: OnboardingStep.PASSPORT_VERIFIED,
          completed: false,
          error: 'User must complete Human Passport verification first',
        };
      }

      // Get verification details
      const details = await this.humanClient.getVerificationDetails(address);

      return {
        step: OnboardingStep.PASSPORT_VERIFIED,
        completed: true,
        data: {
          score: details.score,
          verifiedAt: details.verifiedAt,
        },
      };
    } catch (error) {
      return {
        step: OnboardingStep.PASSPORT_VERIFIED,
        completed: false,
        error:
          error instanceof Error
            ? error.message
            : 'Passport verification check failed',
      };
    }
  }

  /**
   * Step: Initialize Nillion vault
   */
  private async initializeNillion(): Promise<StepResult> {
    try {
      // Initialize Nillion client (which talks to extension)
      await this.nillionClient.initialize();

      // Check if vault already exists by checking for DID
      const hasDID = await this.nillionClient.hasDID();

      return {
        step: OnboardingStep.VAULT_CREATED,
        completed: true,
        data: {
          vaultExists: hasDID,
          message: hasDID ? 'Vault already exists' : 'Vault will be created with DID'
        },
      };
    } catch (error) {
      return {
        step: OnboardingStep.VAULT_CREATED,
        completed: false,
        error:
          error instanceof Error
            ? error.message
            : 'Nillion initialization failed',
      };
    }
  }

  /**
   * Step: Generate DID via extension
   */
  private async generateDID(): Promise<StepResult> {
    try {
      // Initialize extension bridge
      await this.extensionBridge.initialize();

      // Request DID from extension
      // If DID doesn't exist, extension will create it
      const did = await this.extensionBridge.requestDID();

      if (!did) {
        return {
          step: OnboardingStep.DID_GENERATED,
          completed: false,
          error: 'Failed to generate DID. Extension may not be set up.',
        };
      }

      return {
        step: OnboardingStep.DID_GENERATED,
        completed: true,
        data: { did },
      };
    } catch (error) {
      return {
        step: OnboardingStep.DID_GENERATED,
        completed: false,
        error:
          error instanceof Error
            ? error.message
            : 'DID generation failed',
      };
    }
  }

  /**
   * Validate Ethereum address format
   */
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

/**
 * Factory function to create CompleteOnboardingUseCase with dependencies
 */
export function createCompleteOnboardingUseCase(
  humanClient: HumanProtocolClient,
  nillionClient: NillionClient,
  extensionBridge: ExtensionBridge
): CompleteOnboardingUseCase {
  return new CompleteOnboardingUseCase(
    humanClient,
    nillionClient,
    extensionBridge
  );
}
