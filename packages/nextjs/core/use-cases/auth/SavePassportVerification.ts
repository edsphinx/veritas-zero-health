/**
 * Save Passport Verification Use Case
 *
 * Business logic for persisting Passport verification results to database.
 * Enables caching and historical tracking of verification scores.
 *
 * Use Case: Save verification result after checking Passport API
 * Actor: System (automated after GetPassportScore)
 * Preconditions: Verification result obtained from Passport API
 * Postconditions: Verification saved to database, user verification status updated
 */

import type {
  VerificationResult,
  PassportVerificationAPI,
  CreatePassportVerificationData,
} from '@veritas/types';
import { toCreatePassportVerification } from '@veritas/types';
import type { IPassportVerificationRepository } from '@/core/domain/repositories';

/**
 * Input for SavePassportVerification use case
 */
export interface SavePassportVerificationInput {
  userId: string; // User ID (from auth session)
  address: string; // Ethereum address
  verificationResult: VerificationResult; // Result from Passport API
}

/**
 * Output from SavePassportVerification use case
 */
export interface SavePassportVerificationOutput {
  success: boolean;
  data?: PassportVerificationAPI;
  error?: string;
}

/**
 * Use Case: Save Passport Verification
 *
 * Saves verification result to database for caching and history.
 * Also tracks verification changes over time.
 */
export class SavePassportVerificationUseCase {
  constructor(private verificationRepository: IPassportVerificationRepository) {}

  /**
   * Execute the use case
   *
   * @param input - User ID, address, and verification result
   * @returns Saved verification or error
   */
  async execute(
    input: SavePassportVerificationInput
  ): Promise<SavePassportVerificationOutput> {
    try {
      // Validate input
      if (!input.userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      if (!input.address) {
        return {
          success: false,
          error: 'Address is required',
        };
      }

      if (!input.verificationResult) {
        return {
          success: false,
          error: 'Verification result is required',
        };
      }

      console.log(
        `[UseCase] Saving passport verification for user ${input.userId} (${input.address})`
      );

      // Convert verification result to create data
      const createData: CreatePassportVerificationData = toCreatePassportVerification(
        input.verificationResult,
        input.userId,
        input.address
      );

      // Save to database
      const savedVerification = await this.verificationRepository.create(createData);

      console.log(
        `[UseCase] Passport verification saved: ${savedVerification.id} (verified: ${savedVerification.verified})`
      );

      return {
        success: true,
        data: savedVerification,
      };
    } catch (error) {
      console.error('[UseCase] SavePassportVerification failed:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save passport verification',
      };
    }
  }
}
