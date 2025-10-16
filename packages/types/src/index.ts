/**
 * @veritas/types - Shared TypeScript types
 *
 * Central type definitions shared between Next.js app and browser extension.
 */

// Health record types
export * from './health';

// Re-export commonly used types for convenience
export type {
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
} from './health';
