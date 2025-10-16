/**
 * Health Record Types - Next.js App
 *
 * Re-exports shared types from @veritas/types package and provides
 * Next.js-specific helper functions.
 *
 * @see packages/types/src/health.ts (shared types)
 */

// Re-export all shared types from @veritas/types
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

// Import types for helper function signatures
import type {
  HealthRecordType,
  HealthRecord,
  BiomarkerValue,
} from '@veritas/types/health';

/**
 * Helper: Validate health record structure
 */
export function validateHealthRecord(type: HealthRecordType, data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!data.date || !data.timestamp) return false;

  switch (type) {
    case 'diagnoses':
      return (
        Array.isArray(data.icd10Codes) &&
        typeof data.description === 'string' &&
        ['mild', 'moderate', 'severe'].includes(data.severity) &&
        ['active', 'resolved', 'chronic'].includes(data.status)
      );

    case 'biomarkers':
      return (
        typeof data.testName === 'string' &&
        data.values &&
        typeof data.values === 'object'
      );

    case 'vitals':
      return true; // Vitals are flexible, at least one field should be present

    case 'medications':
      return (
        typeof data.name === 'string' &&
        typeof data.dosage === 'string' &&
        typeof data.frequency === 'string' &&
        typeof data.route === 'string' &&
        typeof data.startDate === 'string' &&
        typeof data.indication === 'string' &&
        ['active', 'discontinued', 'completed'].includes(data.status)
      );

    case 'allergies':
      return (
        typeof data.allergen === 'string' &&
        ['medication', 'food', 'environmental', 'other'].includes(data.allergenType) &&
        typeof data.reaction === 'string' &&
        ['mild', 'moderate', 'severe', 'life-threatening'].includes(data.severity) &&
        typeof data.diagnosedDate === 'string' &&
        ['active', 'resolved'].includes(data.status)
      );

    default:
      return false;
  }
}

/**
 * Helper: Create a new health record with auto-generated ID and timestamp
 */
export function createHealthRecord<T extends Partial<HealthRecord>>(
  type: HealthRecordType,
  data: Omit<T, 'id' | 'timestamp'>
): T & { id: string; timestamp: number } {
  return {
    ...data,
    id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: Date.now(),
  } as T & { id: string; timestamp: number };
}

/**
 * Helper: Format biomarker value for display
 */
export function formatBiomarkerValue(value: BiomarkerValue): string {
  const formatted = `${value.value} ${value.unit}`;

  if (value.referenceMin !== undefined && value.referenceMax !== undefined) {
    return `${formatted} (Ref: ${value.referenceMin}-${value.referenceMax} ${value.unit})`;
  }

  return formatted;
}

/**
 * Helper: Check if biomarker is out of range
 */
export function isBiomarkerAbnormal(value: BiomarkerValue): boolean {
  if (value.referenceMin !== undefined && value.value < value.referenceMin) {
    return true;
  }
  if (value.referenceMax !== undefined && value.value > value.referenceMax) {
    return true;
  }
  return false;
}
