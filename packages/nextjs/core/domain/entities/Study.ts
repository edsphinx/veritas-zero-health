/**
 * Study Domain Entity
 *
 * Re-exports the Study type from @veritas/types (single source of truth)
 * Domain layer uses this import for type safety and consistency
 */

import type { Study, StudyStatus } from '@veritas/types';

// Re-export Study type
export type { Study, StudyStatus };

// Helper type for creating new studies (omit generated fields)
export type CreateStudyData = Omit<
  Study,
  'id' | 'createdAt' | 'updatedAt'
>;

// Helper type for updating studies (partial, omit immutable fields)
export type UpdateStudyData = Partial<
  Omit<Study, 'id' | 'createdAt' | 'updatedAt' | 'researcherId'>
>;
