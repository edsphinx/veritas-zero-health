/**
 * Study Repository Interface (Port)
 *
 * Defines the contract for study persistence operations.
 * Implementations can use Prisma, in-memory storage, or any other persistence mechanism.
 */

import type { Study, CreateStudyData } from './Study';

export interface IStudyRepository {
  /**
   * Create a new study index entry
   */
  create(data: CreateStudyData): Promise<Study>;

  /**
   * Find study by registry ID
   */
  findByRegistryId(registryId: number): Promise<Study | null>;

  /**
   * Find study by escrow ID
   */
  findByEscrowId(escrowId: number): Promise<Study | null>;

  /**
   * Find all studies by researcher address
   */
  findByResearcher(researcherAddress: string): Promise<Study[]>;

  /**
   * Find study by database ID
   */
  findById(id: string): Promise<Study | null>;

  /**
   * Update study status
   */
  updateStatus(id: string, status: string): Promise<Study>;

  /**
   * Get all studies (with optional pagination)
   */
  findAll(params?: { skip?: number; take?: number }): Promise<Study[]>;

  /**
   * Count total studies
   */
  count(): Promise<number>;

  /**
   * Count studies by researcher
   */
  countByResearcher(researcherAddress: string): Promise<number>;
}
