/**
 * Get Passport Score Use Case
 *
 * Business logic for retrieving and validating Gitcoin Passport scores.
 * Encapsulates rules around Sybil-resistance verification.
 *
 * Use Case: Check if a user meets the humanity verification threshold
 * Actor: Patient applying to a study
 * Preconditions: User has connected wallet
 * Postconditions: Verification status determined
 */

import type { VerificationResult } from '@veritas/types';
import type { PassportClient } from '@/infrastructure/passport';

/**
 * Input for GetPassportScore use case
 */
export interface GetPassportScoreInput {
  address: string; // Ethereum address to verify
}

/**
 * Output from GetPassportScore use case
 */
export interface GetPassportScoreOutput {
  success: boolean;
  data?: VerificationResult;
  error?: string;
}

/**
 * Use Case: Get Passport Score
 *
 * Validates address format and retrieves Passport score
 * with verification status.
 */
export class GetPassportScoreUseCase {
  constructor(private passportClient: PassportClient) {}

  /**
   * Execute the use case
   *
   * @param input - Address to verify
   * @returns Verification result or error
   */
  async execute(input: GetPassportScoreInput): Promise<GetPassportScoreOutput> {
    try {
      // Validate input
      if (!input.address) {
        return {
          success: false,
          error: 'Address is required',
        };
      }

      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(input.address)) {
        return {
          success: false,
          error: 'Invalid Ethereum address format',
        };
      }

      // Normalize address to lowercase
      const address = input.address.toLowerCase();

      console.log(`[UseCase] Getting Passport score for ${address}`);

      // Get score from Passport API
      const result = await this.passportClient.getPassportScore(address);

      console.log(
        `[UseCase] Score retrieved: ${result.score} (verified: ${result.verified})`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[UseCase] GetPassportScore failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Passport score',
      };
    }
  }
}
