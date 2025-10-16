/**
 * Domain Entity: SponsorDeposit
 *
 * Represents a funding deposit made by a sponsor to a study.
 * This is the core domain model for sponsor deposits.
 */

import type { Address } from 'viem';

/**
 * Sponsor Deposit entity
 */
export interface SponsorDeposit {
  id?: string;
  sponsorAddress: Address;
  studyId: string;
  escrowId: number;
  amount: bigint;
  chainId: number;
  transactionHash: string;
  blockNumber: bigint;
  depositedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Data required to create a new sponsor deposit
 */
export interface CreateSponsorDepositData {
  sponsorAddress: Address;
  studyId: string;
  escrowId: number;
  amount: bigint;
  chainId: number;
  transactionHash: string;
  blockNumber: bigint;
  depositedAt?: Date;
}
