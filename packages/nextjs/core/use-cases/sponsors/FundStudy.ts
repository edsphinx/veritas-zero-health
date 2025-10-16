/**
 * Use Case: Fund Study
 *
 * Allows a sponsor to deposit funds into a study's escrow.
 * Handles USDC approval and deposit transactions.
 */

import type { Address } from 'viem';

/**
 * Request to fund a study
 */
export interface FundStudyRequest {
  sponsorAddress: Address;
  studyId: bigint;
  amount: bigint; // Amount in USDC (with 6 decimals)
  chainId: number;
}

/**
 * Response from funding a study
 */
export interface FundStudyResponse {
  success: boolean;
  data?: {
    transactionHash: string;
    studyId: bigint;
    amount: bigint;
    message: string;
  };
  error?: string;
}

/**
 * FundStudy Use Case
 *
 * @example
 * ```typescript
 * const useCase = new FundStudyUseCase();
 *
 * const result = await useCase.execute({
 *   sponsorAddress: "0x...",
 *   studyId: 1n,
 *   amount: 10000_000000n, // 10,000 USDC
 *   chainId: 11155420
 * });
 *
 * if (result.success) {
 *   console.log('Funding successful:', result.data.transactionHash);
 * }
 * ```
 */
export class FundStudyUseCase {
  /**
   * Execute study funding
   */
  async execute(request: FundStudyRequest): Promise<FundStudyResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // TODO: Implement actual funding logic
      // 1. Check sponsor's USDC balance
      // 2. Check/approve USDC allowance for escrow contract
      // 3. Call depositFunds on ResearchFundingEscrow contract
      // 4. Wait for transaction confirmation
      // 5. Return transaction hash

      return {
        success: false,
        error: 'Funding functionality not yet implemented. Requires wallet client integration.',
      };
    } catch (error) {
      console.error('[FundStudyUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fund study',
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: FundStudyRequest): string | null {
    if (!request.sponsorAddress || !request.sponsorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'Invalid sponsor address';
    }

    if (request.studyId === undefined || request.studyId < 0n) {
      return 'Invalid study ID';
    }

    if (!request.amount || request.amount <= 0n) {
      return 'Amount must be greater than 0';
    }

    if (!request.chainId) {
      return 'Chain ID is required';
    }

    return null;
  }
}

/**
 * Factory function
 */
export function createFundStudyUseCase(): FundStudyUseCase {
  return new FundStudyUseCase();
}
