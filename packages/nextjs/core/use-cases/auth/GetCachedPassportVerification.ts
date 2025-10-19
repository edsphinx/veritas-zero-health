/**
 * Get Cached Passport Verification Use Case
 *
 * Business logic for retrieving cached Passport verification from database.
 * Avoids unnecessary API calls by checking database first.
 *
 * Use Case: Get latest verification from cache
 * Actor: Patient, Researcher (checking verification status)
 * Preconditions: User may have previous verification in database
 * Postconditions: Latest verification returned (if exists and not expired)
 */

import type { PassportVerificationAPI } from '@veritas/types';
import { isPassportExpired } from '@veritas/types';
import type { IPassportVerificationRepository } from '@/core/domain/repositories';

/**
 * Input for GetCachedPassportVerification use case
 */
export interface GetCachedPassportVerificationInput {
  userId?: string; // User ID (preferred if available)
  address?: string; // Ethereum address (fallback if userId not available)
  includeExpired?: boolean; // Whether to return expired verifications (default: false)
}

/**
 * Output from GetCachedPassportVerification use case
 */
export interface GetCachedPassportVerificationOutput {
  success: boolean;
  data?: PassportVerificationAPI;
  isExpired?: boolean;
  error?: string;
}

/**
 * Use Case: Get Cached Passport Verification
 *
 * Retrieves latest verification from database cache.
 * Checks expiration and returns null if expired (unless includeExpired=true).
 */
export class GetCachedPassportVerificationUseCase {
  constructor(private verificationRepository: IPassportVerificationRepository) {}

  /**
   * Execute the use case
   *
   * @param input - User ID or address to check
   * @returns Latest verification or null if not found/expired
   */
  async execute(
    input: GetCachedPassportVerificationInput
  ): Promise<GetCachedPassportVerificationOutput> {
    try {
      // Validate input - need either userId or address
      if (!input.userId && !input.address) {
        return {
          success: false,
          error: 'User ID or address is required',
        };
      }

      console.log(
        `[UseCase] Getting cached passport verification for ${input.userId || input.address}`
      );

      // Get latest verification from database
      let verification: PassportVerificationAPI | null;

      if (input.userId) {
        verification = await this.verificationRepository.findLatestByUserId(
          input.userId
        );
      } else {
        verification = await this.verificationRepository.findLatestByAddress(
          input.address!
        );
      }

      // No verification found
      if (!verification) {
        console.log('[UseCase] No cached verification found');
        return {
          success: true,
          data: undefined,
        };
      }

      // Check if expired
      const expired = isPassportExpired(verification.expirationTimestamp);

      if (expired && !input.includeExpired) {
        console.log('[UseCase] Cached verification expired, returning null');
        return {
          success: true,
          data: undefined,
          isExpired: true,
        };
      }

      console.log(
        `[UseCase] Cached verification found: ${verification.id} (verified: ${verification.verified}, expired: ${expired})`
      );

      return {
        success: true,
        data: verification,
        isExpired: expired,
      };
    } catch (error) {
      console.error('[UseCase] GetCachedPassportVerification failed:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get cached passport verification',
      };
    }
  }
}
