/**
 * User Domain Entity
 *
 * Re-exports the User type from @veritas/types (single source of truth)
 * Domain layer uses this import for type safety and consistency
 */

import type { User, UserRole } from '@veritas/types';

// Re-export User type and related enums
export type { User, UserRole };

// Helper type for creating new users (omit generated fields)
export type CreateUserData = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt'
>;

// Helper type for updating users (partial, omit immutable fields)
export type UpdateUserData = Partial<
  Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'address'>
>;
