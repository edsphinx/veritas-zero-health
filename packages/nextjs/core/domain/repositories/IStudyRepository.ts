/**
 * Study Repository Interface (Port)
 *
 * Defines the contract for Study data access
 * Infrastructure layer provides concrete implementations
 */

import type { Study, CreateStudyData, UpdateStudyData } from '../entities';

export interface StudyFilters {
  status?: string;
  researcherId?: string;
  isActive?: boolean;
}

export interface IStudyRepository {
  /**
   * Find study by database ID
   */
  findById(id: string): Promise<Study | null>;

  /**
   * Find study by blockchain registry ID
   */
  findByRegistryId(registryId: bigint): Promise<Study | null>;

  /**
   * Find study by blockchain escrow ID
   */
  findByEscrowId(escrowId: bigint): Promise<Study | null>;

  /**
   * Find all studies with optional filters
   */
  findAll(filters?: StudyFilters): Promise<Study[]>;

  /**
   * Find studies by researcher
   */
  findByResearcher(researcherId: string): Promise<Study[]>;

  /**
   * Create new study
   */
  create(data: CreateStudyData): Promise<Study>;

  /**
   * Update existing study
   */
  update(id: string, data: UpdateStudyData): Promise<Study>;

  /**
   * Delete study (soft delete recommended)
   */
  delete(id: string): Promise<void>;

  /**
   * Count total studies (for pagination)
   */
  count(filters?: StudyFilters): Promise<number>;
}
