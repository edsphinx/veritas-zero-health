/**
 * User Repository Interface (Port)
 *
 * Defines the contract for User data access
 * Infrastructure layer provides concrete implementations
 */

import type { User, UserRole, CreateUserData, UpdateUserData } from '../entities';

export interface UserFilters {
  role?: UserRole;
  isVerified?: boolean;
}

export interface IUserRepository {
  /**
   * Find user by database ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by wallet address (unique)
   */
  findByAddress(address: string): Promise<User | null>;

  /**
   * Find all users with optional filters
   */
  findAll(filters?: UserFilters): Promise<User[]>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Promise<User[]>;

  /**
   * Create new user
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Update existing user
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * Update user's humanity verification status
   */
  updateVerification(
    id: string,
    isVerified: boolean,
    humanityScore?: number | null
  ): Promise<User>;

  /**
   * Delete user (soft delete recommended)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user exists by address
   */
  exists(address: string): Promise<boolean>;
}
