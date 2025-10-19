/**
 * Get Verification Details Use Case
 *
 * Business logic for retrieving detailed Passport verification information
 * including stamps, scores, and expiration data.
 *
 * Use Case: Display detailed verification status to user
 * Actor: Patient viewing their verification status
 * Preconditions: User has connected wallet
 * Postconditions: Detailed verification info retrieved
 */

import type { VerificationDetails } from '@veritas/types';
import type { PassportClient } from '@/infrastructure/passport';

/**
 * Input for GetVerificationDetails use case
 */
export interface GetVerificationDetailsInput {
  address: string; // Ethereum address to check
}

/**
 * Output from GetVerificationDetails use case
 */
export interface GetVerificationDetailsOutput {
  success: boolean;
  data?: VerificationDetails;
  error?: string;
}

/**
 * Use Case: Get Verification Details
 *
 * Retrieves comprehensive verification information including
 * stamps, scores, and expiration data.
 */
export class GetVerificationDetailsUseCase {
  constructor(private passportClient: PassportClient) {}

  /**
   * Execute the use case
   *
   * @param input - Address to check
   * @returns Detailed verification information
   */
  async execute(
    input: GetVerificationDetailsInput
  ): Promise<GetVerificationDetailsOutput> {
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

      console.log(`[UseCase] Getting verification details for ${address}`);

      // Get detailed verification info
      const details = await this.passportClient.getVerificationDetails(address);

      console.log(
        `[UseCase] Details retrieved: verified=${details.verified}, stamps=${details.stamps?.length || 0}`
      );

      return {
        success: true,
        data: details,
      };
    } catch (error) {
      console.error('[UseCase] GetVerificationDetails failed:', error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get verification details',
      };
    }
  }
}
