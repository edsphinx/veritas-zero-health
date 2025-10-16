/**
 * Shared Type Definitions - Re-export from @veritas/types
 *
 * This file serves as a convenience re-export of the centralized types package.
 * All types are defined in @veritas/types to ensure consistency across:
 * - Next.js web app
 * - Browser extension
 * - Future mobile app
 *
 * @deprecated Prefer importing directly from '@veritas/types' instead
 *
 * Migration path:
 * - Old: import { Study } from '@/shared/types'
 * - New: import { Study } from '@veritas/types'
 *
 * This file will be removed once all imports are migrated.
 */

// Re-export everything from the centralized types package
export * from '@veritas/types';

// Legacy named exports for backwards compatibility
export type {
  // Health types
  HealthRecordType,
  BaseHealthRecord,
  Diagnosis,
  Biomarker,
  BiomarkerValue,
  Vital,
  Medication,
  Allergy,
  HealthRecord,
  HealthDataPermission,
  PermissionGrant,
  TrialEligibilityCriteria,
  EligibilityProofRequest,
  EligibilityProofResponse,

  // Study types
  Study,
  StudyStatus,
  StudyCriteria,
  StudyMilestone,
  StudyApplication,
  MilestoneType,
  ApplicationStatus,
  StudyIds,
  StudyWithRelations,
  StudyListItem,
  IndexStudyRequest,
  IndexStudyResponse,
  ApplyToStudyRequest,
  ApplyToStudyResponse,

  // Auth types
  UserRole,
  Permission,

  // Human Passport types

  // ZK Proof types
  ProofSystem,
  Groth16Proof,
} from '@veritas/types';
