/**
 * Repository Interface: ISponsorDepositRepository
 *
 * Defines the contract for sponsor deposit data access.
 * Following the Repository Pattern from Clean Architecture.
 */

import type { Address } from 'viem';
import type { SponsorDeposit, CreateSponsorDepositData } from './SponsorDeposit';

/**
 * Repository interface for SponsorDeposit operations
 */
export interface ISponsorDepositRepository {
  /**
   * Create a new deposit record
   */
  create(data: CreateSponsorDepositData): Promise<SponsorDeposit>;

  /**
   * Find deposit by transaction hash
   */
  findByTransactionHash(txHash: string): Promise<SponsorDeposit | null>;

  /**
   * Find all deposits by sponsor address
   */
  findBySponsor(sponsorAddress: Address): Promise<SponsorDeposit[]>;

  /**
   * Find all deposits for a study
   */
  findByStudy(studyId: string): Promise<SponsorDeposit[]>;

  /**
   * Find deposits by sponsor for a specific study
   */
  findBySponsorAndStudy(sponsorAddress: Address, studyId: string): Promise<SponsorDeposit[]>;

  /**
   * Get total amount deposited by sponsor (across all studies)
   */
  getTotalBySponsor(sponsorAddress: Address): Promise<bigint>;

  /**
   * Get total amount deposited for a study (across all sponsors)
   */
  getTotalByStudy(studyId: string): Promise<bigint>;

  /**
   * Get total amount deposited by sponsor for a specific study
   */
  getTotalBySponsorAndStudy(sponsorAddress: Address, studyId: string): Promise<bigint>;

  /**
   * Count deposits by sponsor
   */
  countBySponsor(sponsorAddress: Address): Promise<number>;

  /**
   * Get unique study IDs funded by sponsor
   */
  getStudyIdsBySponsor(sponsorAddress: Address): Promise<string[]>;
}
