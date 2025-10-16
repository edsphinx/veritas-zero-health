/**
 * Use Case: Fund Study
 *
 * Business logic for sponsors to fund clinical studies through ERC20 token deposits.
 * Implements a 3-step process:
 * 1. Approve ERC20 token spending
 * 2. Call fundStudyERC20 on ResearchFundingEscrow contract
 * 3. Index the deposit in the database
 */

import type { Address } from 'viem';

export interface FundStudyInput {
  studyId: string;
  escrowId: number;
  tokenAddress: Address;
  amount: bigint;
  sponsorAddress: Address;
  escrowAddress: Address;
}

export interface FundStudyApprovalResult {
  success: boolean;
  txHash?: Address;
  error?: string;
}

export interface FundStudyDepositResult {
  success: boolean;
  txHash?: Address;
  error?: string;
}

export interface FundStudyIndexResult {
  success: boolean;
  depositId?: string;
  error?: string;
}

export interface FundStudyResult {
  success: boolean;
  approvalTxHash?: Address;
  depositTxHash?: Address;
  depositId?: string;
  error?: string;
  step?: 'approval' | 'deposit' | 'indexing';
}

/**
 * Fund Study Use Case
 *
 * This use case encapsulates the business logic for funding a study.
 * It coordinates between blockchain transactions and database indexing.
 */
export class FundStudy {
  /**
   * Index the deposit in the database after successful blockchain transaction
   */
  async indexDeposit(input: {
    studyId: string;
    escrowId: number;
    sponsorAddress: Address;
    tokenAddress: Address;
    amount: string;
    txHash: Address;
    blockNumber: bigint;
  }): Promise<FundStudyIndexResult> {
    try {
      // Call API to index the deposit
      const response = await fetch(`/api/studies/${input.studyId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId: input.escrowId,
          sponsorAddress: input.sponsorAddress,
          tokenAddress: input.tokenAddress,
          amount: input.amount,
          transactionHash: input.txHash,
          blockNumber: input.blockNumber.toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Failed to index deposit',
        };
      }

      const data = await response.json();
      return {
        success: true,
        depositId: data.deposit?.id,
      };
    } catch (error) {
      console.error('[FundStudy] Error indexing deposit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate funding input
   */
  validateInput(input: FundStudyInput): { valid: boolean; error?: string } {
    if (!input.studyId || input.studyId.trim() === '') {
      return { valid: false, error: 'Study ID is required' };
    }

    if (!input.escrowId || input.escrowId <= 0) {
      return { valid: false, error: 'Invalid escrow ID' };
    }

    if (!input.amount || input.amount <= 0n) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (!input.tokenAddress || !input.escrowAddress || !input.sponsorAddress) {
      return { valid: false, error: 'Invalid addresses' };
    }

    return { valid: true };
  }
}
