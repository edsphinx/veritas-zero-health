/**
 * Use Case: Index Sponsor Deposit
 *
 * Indexes a sponsor's deposit transaction in the database.
 * Called after a successful depositFunds transaction.
 */

import type { Address } from 'viem';
import type { ISponsorDepositRepository } from '@/core/domain/ISponsorDepositRepository';
import type { SponsorDeposit } from '@/core/domain/SponsorDeposit';

/**
 * Request to index a deposit
 */
export interface IndexDepositRequest {
  sponsorAddress: Address;
  studyId: string;
  escrowId: number;
  amount: bigint;
  chainId: number;
  transactionHash: string;
  blockNumber: bigint;
  depositedAt?: Date;
}

/**
 * Response from indexing deposit
 */
export interface IndexDepositResponse {
  success: boolean;
  data?: {
    deposit: SponsorDeposit;
    message: string;
  };
  error?: string;
}

/**
 * IndexDeposit Use Case
 *
 * @example
 * ```typescript
 * const useCase = new IndexDepositUseCase(depositRepository);
 *
 * const result = await useCase.execute({
 *   sponsorAddress: "0x...",
 *   studyId: "study_123",
 *   escrowId: 1,
 *   amount: 10000_000000n,
 *   chainId: 11155420,
 *   transactionHash: "0xabc...",
 *   blockNumber: 12345n
 * });
 *
 * if (result.success) {
 *   console.log('Deposit indexed:', result.data.deposit.id);
 * }
 * ```
 */
export class IndexDepositUseCase {
  constructor(private depositRepository: ISponsorDepositRepository) {}

  /**
   * Execute deposit indexing
   */
  async execute(request: IndexDepositRequest): Promise<IndexDepositResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Check if deposit already indexed
      const existing = await this.depositRepository.findByTransactionHash(
        request.transactionHash
      );

      if (existing) {
        return {
          success: true,
          data: {
            deposit: existing,
            message: 'Deposit already indexed',
          },
        };
      }

      // Create deposit record
      const deposit = await this.depositRepository.create({
        sponsorAddress: request.sponsorAddress,
        studyId: request.studyId,
        escrowId: request.escrowId,
        amount: request.amount,
        chainId: request.chainId,
        transactionHash: request.transactionHash,
        blockNumber: request.blockNumber,
        depositedAt: request.depositedAt || new Date(),
      });

      return {
        success: true,
        data: {
          deposit,
          message: 'Deposit indexed successfully',
        },
      };
    } catch (error) {
      console.error('[IndexDepositUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to index deposit',
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: IndexDepositRequest): string | null {
    if (!request.sponsorAddress || !request.sponsorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'Invalid sponsor address';
    }

    if (!request.studyId) {
      return 'Study ID is required';
    }

    if (request.escrowId === undefined || request.escrowId < 0) {
      return 'Invalid escrow ID';
    }

    if (!request.amount || request.amount <= 0n) {
      return 'Amount must be greater than 0';
    }

    if (!request.transactionHash || !request.transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return 'Invalid transaction hash';
    }

    if (!request.blockNumber || request.blockNumber < 0n) {
      return 'Invalid block number';
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
export function createIndexDepositUseCase(
  depositRepository: ISponsorDepositRepository
): IndexDepositUseCase {
  return new IndexDepositUseCase(depositRepository);
}
