/**
 * Study Type Re-exports
 *
 * This file re-exports types from @veritas/types for backwards compatibility.
 * All new code should import directly from @veritas/types instead.
 *
 * @deprecated Import from @veritas/types instead
 */

// Re-export everything from centralized types
export * from '@veritas/types';

/**
 * @deprecated Use Study from @veritas/types
 */
export type { Study } from '@veritas/types';

/**
 * @deprecated Use StudyStatus from @veritas/types
 */
export { StudyStatus } from '@veritas/types';

/**
 * @deprecated Use StudyCriteria from @veritas/types
 */
export type { StudyCriteria } from '@veritas/types';

/**
 * @deprecated Use StudyMilestone from @veritas/types
 */
export type { StudyMilestone } from '@veritas/types';

/**
 * @deprecated Use StudyApplication from @veritas/types
 */
export type { StudyApplication } from '@veritas/types';

/**
 * @deprecated Use StudyDetailsFromContract from @veritas/types
 */
export type { StudyDetailsFromContract } from '@veritas/types';

/**
 * @deprecated Use StudyCriteriaFromContract from @veritas/types
 */
export type { StudyCriteriaFromContract } from '@veritas/types';
