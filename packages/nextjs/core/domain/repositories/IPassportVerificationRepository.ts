/**
 * IPassportVerificationRepository - Repository Interface
 *
 * Port (interface) for PassportVerification persistence.
 * Defines contract that must be implemented by adapters (Prisma, in-memory, etc.).
 *
 * Clean Architecture:
 * - Domain layer defines the interface (port)
 * - Infrastructure layer implements it (adapter - PrismaPassportVerificationRepository)
 * - Use cases depend on the interface, not the implementation (Dependency Inversion)
 */

import type {
  PassportVerificationAPI,
  CreatePassportVerificationData,
  UpdatePassportVerificationData,
} from '@veritas/types';

/**
 * Repository interface for PassportVerification entity
 */
export interface IPassportVerificationRepository {
  /**
   * Find verification by ID
   * @param id - Verification ID
   * @returns PassportVerificationAPI or null if not found
   */
  findById(id: string): Promise<PassportVerificationAPI | null>;

  /**
   * Find latest verification for a user
   * @param userId - User ID
   * @returns Latest verification or null if none exist
   */
  findLatestByUserId(userId: string): Promise<PassportVerificationAPI | null>;

  /**
   * Find latest verification for an address
   * @param address - Ethereum address (case-insensitive)
   * @returns Latest verification or null if none exist
   */
  findLatestByAddress(address: string): Promise<PassportVerificationAPI | null>;

  /**
   * Find all verifications for a user (history)
   * @param userId - User ID
   * @returns Array of verifications, ordered by verifiedAt DESC
   */
  findAllByUserId(userId: string): Promise<PassportVerificationAPI[]>;

  /**
   * Find all verifications for an address (history)
   * @param address - Ethereum address (case-insensitive)
   * @returns Array of verifications, ordered by verifiedAt DESC
   */
  findAllByAddress(address: string): Promise<PassportVerificationAPI[]>;

  /**
   * Create a new verification record
   * @param data - Verification data
   * @returns Created verification
   */
  create(data: CreatePassportVerificationData): Promise<PassportVerificationAPI>;

  /**
   * Update a verification record
   * @param id - Verification ID
   * @param data - Update data
   * @returns Updated verification
   */
  update(
    id: string,
    data: UpdatePassportVerificationData
  ): Promise<PassportVerificationAPI>;

  /**
   * Delete a verification record
   * @param id - Verification ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count verifications for a user
   * @param userId - User ID
   * @returns Number of verifications
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Find expired verifications
   * @returns Array of expired verifications
   */
  findExpired(): Promise<PassportVerificationAPI[]>;

  /**
   * Check if user has valid (non-expired) verification
   * @param userId - User ID
   * @returns True if user has valid verification
   */
  hasValidVerification(userId: string): Promise<boolean>;
}
