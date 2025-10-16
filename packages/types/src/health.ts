/**
 * Health Record Types - Shared between Next.js and Browser Extension
 *
 * Type definitions for encrypted health records stored in Nillion.
 * Used by both the web app and browser extension.
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
  timestamp?: number; // For backward compatibility with Next.js app
  createdAt?: number; // For browser extension
  updatedAt?: number; // For browser extension
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
