/**
 * Health Record Types
 *
 * Type definitions for encrypted health records stored in Nillion.
 * These types are shared between the extension and the Next.js app.
 *
 * @see packages/browser-extension/src/types/health-records.ts (source of truth)
 */

/**
 * Health record types supported by Veritas
 */
export type HealthRecordType =
  | 'diagnoses'
  | 'biomarkers'
  | 'vitals'
  | 'medications'
  | 'allergies';

/**
 * Base health record with common fields
 */
export interface BaseHealthRecord {
  id: string;
  date: string; // ISO 8601 date
  timestamp: number;
  notes?: string;
}

/**
 * Medical diagnosis record
 */
export interface Diagnosis extends BaseHealthRecord {
  icd10Codes: string[]; // ICD-10 diagnosis codes
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'chronic';
  diagnosedBy?: string; // Physician name
}

/**
 * Individual biomarker measurement with unit and reference range
 */
export interface BiomarkerValue {
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  isNormal: boolean;
}

/**
 * Lab test / biomarker record
 */
export interface Biomarker extends BaseHealthRecord {
  testName: string;
  values: Record<string, BiomarkerValue>; // e.g., { "glucose": { value: 95, unit: "mg/dL", ... } }
  laboratoryName?: string;
  orderedBy?: string; // Physician name
}

/**
 * Vital signs record
 */
export interface Vital extends BaseHealthRecord {
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  heartRate?: number; // bpm
  temperature?: number; // Celsius
  weight?: number; // kg
  height?: number; // cm
  bmi?: number; // Calculated or measured
  oxygenSaturation?: number; // SpO2 percentage
  respiratoryRate?: number; // breaths per minute
}

/**
 * Medication record
 */
export interface Medication extends BaseHealthRecord {
  name: string;
  dosage: string; // e.g., "500mg"
  frequency: string; // e.g., "twice daily", "as needed"
  route: string; // e.g., "oral", "IV", "topical"
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  indication: string; // What it's prescribed for
  status: 'active' | 'discontinued' | 'completed';
}

/**
 * Allergy record
 */
export interface Allergy extends BaseHealthRecord {
  allergen: string;
  allergenType: 'medication' | 'food' | 'environmental' | 'other';
  reaction: string; // Description of reaction
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  diagnosedDate: string;
  status: 'active' | 'resolved';
}

/**
 * Union type of all health records
 */
export type HealthRecord =
  | Diagnosis
  | Biomarker
  | Vital
  | Medication
  | Allergy;

/**
 * Permission types for health data access
 */
export type HealthDataPermission =
  | `read:${HealthRecordType}`
  | `write:${HealthRecordType}`;

/**
 * Permission grant from user to app
 */
export interface PermissionGrant {
  appOrigin: string;
  permissions: HealthDataPermission[];
  grantedAt: number;
  expiresAt: number | null; // null = never expires
  status: 'pending' | 'approved' | 'denied' | 'revoked';
}

/**
 * Trial eligibility criteria for ZK proofs
 */
export interface TrialEligibilityCriteria {
  age?: {
    min?: number;
    max?: number;
  };
  biomarkers?: {
    [testName: string]: {
      min?: number;
      max?: number;
      unit: string;
    };
  };
  diagnoses?: {
    required?: string[]; // ICD-10 codes that must be present
    excluded?: string[]; // ICD-10 codes that must NOT be present
  };
  medications?: {
    required?: string[]; // Medication names required
    excluded?: string[]; // Medications that exclude eligibility
  };
}

/**
 * Proof request for eligibility verification
 */
export interface EligibilityProofRequest {
  studyId: string;
  criteria: TrialEligibilityCriteria;
  requiredRecordTypes: HealthRecordType[];
}

/**
 * Response from proof generation
 */
export interface EligibilityProofResponse {
  proof: Uint8Array; // ZK proof bytes
  publicInputs: string[]; // Public inputs (non-revealing)
  isEligible: boolean;
  timestamp: number;
}

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
