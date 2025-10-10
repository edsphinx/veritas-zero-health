/**
 * Health Record Type Definitions for Veritas Zero Health
 *
 * These types define the structure of health data stored in Nillion.
 * All sensitive fields will be encrypted using Nillion's %allot markers.
 */

/**
 * Medical Diagnosis Record
 *
 * Stores information about diagnosed medical conditions.
 * Used for clinical trial eligibility verification.
 */
export interface Diagnosis {
  /** Unique identifier */
  id: string;

  /** Date of diagnosis (ISO 8601 format) */
  date: string;

  /** ICD-10 diagnostic codes */
  icd10Codes: string[];

  /** Human-readable description */
  description: string;

  /** Optional: Clinic/hospital ID where diagnosed */
  clinicId?: string;

  /** Optional: Treating physician ID */
  physicianId?: string;

  /** Severity: 'mild' | 'moderate' | 'severe' */
  severity?: 'mild' | 'moderate' | 'severe';

  /** Current status: 'active' | 'resolved' | 'chronic' */
  status?: 'active' | 'resolved' | 'chronic';

  /** Optional: Notes */
  notes?: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Lab Result / Biomarker Record
 *
 * Stores laboratory test results and biomarker measurements.
 * Essential for trial eligibility based on lab values.
 */
export interface Biomarker {
  /** Unique identifier */
  id: string;

  /** Date of test (ISO 8601 format) */
  date: string;

  /** Test type category */
  type: 'bloodwork' | 'urinalysis' | 'imaging' | 'genetic' | 'other';

  /** Lab test name/code (e.g., 'CBC', 'Lipid Panel') */
  testName: string;

  /** LOINC code (if available) */
  loincCode?: string;

  /**
   * Individual biomarker values
   * Key: biomarker name (e.g., 'glucose', 'cholesterol')
   * Value: measurement details
   */
  values: {
    [key: string]: BiomarkerValue;
  };

  /** Optional: Lab/clinic ID */
  clinicId?: string;

  /** Optional: Ordering physician ID */
  physicianId?: string;

  /** Optional: Notes or observations */
  notes?: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Individual biomarker measurement
 */
export interface BiomarkerValue {
  /** Numeric value */
  value: number;

  /** Unit of measurement (e.g., 'mg/dL', 'mmol/L') */
  unit: string;

  /** Optional: Reference range for normal values */
  referenceRange?: {
    min: number;
    max: number;
  };

  /** Flag: 'normal' | 'low' | 'high' | 'critical' */
  flag?: 'normal' | 'low' | 'high' | 'critical';
}

/**
 * Vital Signs Record
 *
 * Stores vital sign measurements.
 * Used for baseline health status and eligibility criteria.
 */
export interface Vital {
  /** Unique identifier */
  id: string;

  /** Date of measurement (ISO 8601 format) */
  date: string;

  /** Blood pressure measurement */
  bloodPressure?: {
    systolic: number;   // mmHg
    diastolic: number;  // mmHg
  };

  /** Heart rate (beats per minute) */
  heartRate?: number;

  /** Body temperature */
  temperature?: {
    value: number;
    unit: 'C' | 'F';
  };

  /** Weight */
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };

  /** Height */
  height?: {
    value: number;
    unit: 'cm' | 'in';
  };

  /** Body Mass Index (calculated) */
  bmi?: number;

  /** Oxygen saturation (SpO2) percentage */
  oxygenSaturation?: number;

  /** Respiratory rate (breaths per minute) */
  respiratoryRate?: number;

  /** Optional: Clinic/location ID */
  clinicId?: string;

  /** Optional: Notes */
  notes?: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Medication Record
 *
 * Stores current and past medications.
 * Important for drug interaction checks in trials.
 */
export interface Medication {
  /** Unique identifier */
  id: string;

  /** Medication name */
  name: string;

  /** Optional: RxNorm code */
  rxnormCode?: string;

  /** Dosage (e.g., '10mg', '500mg') */
  dosage: string;

  /** Frequency (e.g., 'once daily', 'twice daily') */
  frequency: string;

  /** Route of administration */
  route?: 'oral' | 'injection' | 'topical' | 'inhalation' | 'other';

  /** Start date */
  startDate: string;

  /** End date (null if ongoing) */
  endDate?: string | null;

  /** Status: 'active' | 'discontinued' | 'completed' */
  status: 'active' | 'discontinued' | 'completed';

  /** Prescribing physician ID */
  physicianId?: string;

  /** Reason for medication */
  indication?: string;

  /** Optional: Notes */
  notes?: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Allergy Record
 *
 * Stores patient allergies and adverse reactions.
 * Critical for trial safety screening.
 */
export interface Allergy {
  /** Unique identifier */
  id: string;

  /** Allergen name */
  allergen: string;

  /** Type: 'drug' | 'food' | 'environmental' | 'other' */
  type: 'drug' | 'food' | 'environmental' | 'other';

  /** Reaction description */
  reaction: string;

  /** Severity: 'mild' | 'moderate' | 'severe' | 'life-threatening' */
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';

  /** Date identified */
  dateIdentified?: string;

  /** Status: 'active' | 'resolved' */
  status: 'active' | 'resolved';

  /** Optional: Notes */
  notes?: string;

  /** Creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;
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
 * Permission types for health data access
 */
export type HealthDataPermission =
  | 'read:diagnoses'
  | 'read:biomarkers'
  | 'read:vitals'
  | 'read:medications'
  | 'read:allergies'
  | 'read:profile'
  | 'write:diagnoses'
  | 'write:biomarkers'
  | 'write:vitals'
  | 'write:medications'
  | 'write:allergies';

/**
 * Trial eligibility criteria that can be verified with ZK proofs
 */
export interface TrialEligibilityCriteria {
  /** Age range */
  age?: {
    min: number;
    max: number;
  };

  /** Required diagnoses (ICD-10 codes) */
  requiredDiagnoses?: string[];

  /** Excluded diagnoses (ICD-10 codes) */
  excludedDiagnoses?: string[];

  /** Biomarker range requirements */
  biomarkerRanges?: {
    [biomarkerName: string]: {
      min?: number;
      max?: number;
      unit: string;
    };
  };

  /** BMI range */
  bmiRange?: {
    min?: number;
    max?: number;
  };

  /** Excluded medications (RxNorm codes) */
  excludedMedications?: string[];

  /** Required medication history */
  requiredMedications?: string[];

  /** Allergy restrictions */
  allergyRestrictions?: string[];

  /** Gender requirement */
  gender?: 'male' | 'female' | 'any';

  /** Smoking status */
  smokingStatus?: 'current' | 'former' | 'never' | 'any';
}

/**
 * ZK Proof request for trial eligibility
 */
export interface EligibilityProofRequest {
  /** Trial ID */
  trialId: string;

  /** Eligibility criteria to prove */
  criteria: TrialEligibilityCriteria;

  /** Public inputs (revealed) */
  publicInputs: {
    trialId: string;
    timestamp: number;
  };

  /** Private inputs (not revealed, from health records) */
  privateInputs: {
    age?: number;
    diagnoses?: string[];
    biomarkers?: { [key: string]: number };
    bmi?: number;
    medications?: string[];
    allergies?: string[];
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
  if (!record.createdAt) errors.push('Creation timestamp is required');

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
      if (!biomarker.type) errors.push('Type is required');
      if (!biomarker.testName) errors.push('Test name is required');
      if (!biomarker.values || Object.keys(biomarker.values).length === 0) {
        errors.push('At least one biomarker value is required');
      }
      break;

    case 'vital':
      const vital = record as Partial<Vital>;
      if (!vital.date) errors.push('Date is required');
      const hasVital =
        vital.bloodPressure ||
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
      if (!allergy.type) errors.push('Type is required');
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
  } as T;
}
