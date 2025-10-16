/**
 * Health Record Types - Browser Extension
 *
 * Re-exports shared types from @veritas/types package and provides
 * extension-specific types and helper functions.
 *
 * @see packages/types/src/health.ts (shared types)
 */

// Re-export core shared types
export type {
  HealthRecordType,
  BaseHealthRecord,
  Diagnosis,
  BiomarkerValue,
  Biomarker,
  Vital,
  Medication,
  Allergy,
  HealthRecord,
  HealthDataPermission,
  PermissionGrant,
  TrialEligibilityCriteria,
  EligibilityProofRequest,
  EligibilityProofResponse,
} from '@veritas/types/health';

// Import types for local use
import type {
  HealthRecord,
  Diagnosis,
  Biomarker,
  Vital,
  Medication,
  Allergy,
} from '@veritas/types/health';

/**
 * User Owned Collection structure in Nillion
 *
 * This is the top-level structure for a user's health data vault.
 */
export interface UserOwnedCollection {
  /** User's Veritas DID */
  userId: string;

  /** Diagnosis records */
  diagnoses: Diagnosis[];

  /** Biomarker/lab results */
  biomarkers: Biomarker[];

  /** Vital signs */
  vitals: Vital[];

  /** Medications */
  medications: Medication[];

  /** Allergies */
  allergies: Allergy[];

  /** Collection metadata */
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

/**
 * Helper function to validate health record
 */
export function validateHealthRecord(
  record: Partial<HealthRecord>,
  type: 'diagnosis' | 'biomarker' | 'vital' | 'medication' | 'allergy'
): string[] {
  const errors: string[] = [];

  // Common validations
  if (!record.id) errors.push('ID is required');
  const hasTimestamp = (record as any).createdAt || (record as any).timestamp;
  if (!hasTimestamp) errors.push('Creation timestamp is required');

  // Type-specific validations
  switch (type) {
    case 'diagnosis':
      const diagnosis = record as Partial<Diagnosis>;
      if (!diagnosis.date) errors.push('Date is required');
      if (!diagnosis.icd10Codes || diagnosis.icd10Codes.length === 0) {
        errors.push('At least one ICD-10 code is required');
      }
      if (!diagnosis.description) errors.push('Description is required');
      break;

    case 'biomarker':
      const biomarker = record as Partial<Biomarker>;
      if (!biomarker.date) errors.push('Date is required');
      if (!biomarker.testName) errors.push('Test name is required');
      if (!biomarker.values || Object.keys(biomarker.values).length === 0) {
        errors.push('At least one biomarker value is required');
      }
      break;

    case 'vital':
      const vital = record as Partial<Vital>;
      if (!vital.date) errors.push('Date is required');
      const hasVital =
        vital.bloodPressureSystolic ||
        vital.bloodPressureDiastolic ||
        vital.heartRate ||
        vital.temperature ||
        vital.weight ||
        vital.height;
      if (!hasVital) errors.push('At least one vital sign is required');
      break;

    case 'medication':
      const medication = record as Partial<Medication>;
      if (!medication.name) errors.push('Name is required');
      if (!medication.dosage) errors.push('Dosage is required');
      if (!medication.frequency) errors.push('Frequency is required');
      if (!medication.startDate) errors.push('Start date is required');
      if (!medication.status) errors.push('Status is required');
      break;

    case 'allergy':
      const allergy = record as Partial<Allergy>;
      if (!allergy.allergen) errors.push('Allergen is required');
      if (!allergy.allergenType) errors.push('Type is required');
      if (!allergy.reaction) errors.push('Reaction is required');
      if (!allergy.severity) errors.push('Severity is required');
      break;
  }

  return errors;
}

/**
 * Helper function to create a new health record with defaults
 */
export function createHealthRecord<T extends HealthRecord>(
  type: 'diagnosis' | 'biomarker' | 'vital' | 'medication' | 'allergy',
  data: Partial<T>
): T {
  const timestamp = Date.now();

  return {
    ...data,
    id: data.id || `${type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    timestamp, // Include for compatibility
  } as T;
}
