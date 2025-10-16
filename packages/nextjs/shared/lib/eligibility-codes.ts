/**
 * Eligibility Code Generation Library
 *
 * Generates deterministic eligibility codes from patient medical data
 * for zero-knowledge proof verification in clinical trials.
 *
 * Strategy: Hash-based codes using Poseidon hash function
 * - Single proof can verify multiple criteria (AND conditions)
 * - Privacy-preserving: patient doesn't reveal actual values
 * - Gas-efficient: compact circuit (12,594 gates)
 */

// @ts-expect-error - circomlibjs doesn't have TypeScript definitions
import { buildPoseidon } from 'circomlibjs';

/**
 * Patient medical data structure
 */
export interface PatientMedicalData {
  // Biomarkers
  hba1c?: number; // HbA1c level (e.g., 6.5)
  cholesterol?: number; // Total cholesterol (mg/dL)
  ldl?: number; // LDL cholesterol (mg/dL)
  hdl?: number; // HDL cholesterol (mg/dL)
  triglycerides?: number; // Triglycerides (mg/dL)

  // Vital signs
  systolicBP?: number; // Systolic blood pressure
  diastolicBP?: number; // Diastolic blood pressure
  bmi?: number; // Body Mass Index
  heartRate?: number; // Heart rate (bpm)

  // Medications (as codes)
  medications?: string[]; // e.g., ["METFORMIN", "LISINOPRIL"]

  // Allergies (as codes)
  allergies?: string[]; // e.g., ["PENICILLIN", "SULFA"]

  // Diagnoses (as ICD-10 codes)
  diagnoses?: string[]; // e.g., ["E11.9", "I10"] (Type 2 diabetes, Hypertension)
}

/**
 * Study eligibility criteria
 */
export interface EligibilityCriteria {
  // Biomarker ranges
  hba1cRange?: { min: number; max: number };
  cholesterolRange?: { min: number; max: number };
  ldlRange?: { min: number; max: number };
  hdlRange?: { min: number; max: number };
  triglyceridesRange?: { min: number; max: number };

  // Vital sign ranges
  systolicBPRange?: { min: number; max: number };
  diastolicBPRange?: { min: number; max: number };
  bmiRange?: { min: number; max: number };
  heartRateRange?: { min: number; max: number };

  // Medication requirements
  requiredMedications?: string[]; // Must be taking these
  excludedMedications?: string[]; // Must NOT be taking these

  // Allergy requirements
  excludedAllergies?: string[]; // Must NOT have these allergies

  // Diagnosis requirements
  requiredDiagnoses?: string[]; // Must have these diagnoses
  excludedDiagnoses?: string[]; // Must NOT have these diagnoses
}

/**
 * Normalizes a numeric value to a consistent format
 * Example: 6.5 -> 650 (multiply by 100, truncate)
 */
function normalizeNumeric(value: number): bigint {
  return BigInt(Math.floor(value * 100));
}

/**
 * Converts a string to a numeric representation for hashing
 */
function stringToFieldElement(str: string): bigint {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str.toUpperCase());

  // Convert first 31 bytes to a field element (fits in BN254 scalar field)
  let result = 0n;
  for (let i = 0; i < Math.min(bytes.length, 31); i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Checks if patient meets eligibility criteria
 * @returns true if patient meets ALL criteria (AND conditions)
 */
export function checkEligibility(
  patientData: PatientMedicalData,
  criteria: EligibilityCriteria
): boolean {
  // Check biomarker ranges
  if (criteria.hba1cRange && patientData.hba1c !== undefined) {
    const { min, max } = criteria.hba1cRange;
    if (patientData.hba1c < min || patientData.hba1c > max) return false;
  }

  if (criteria.cholesterolRange && patientData.cholesterol !== undefined) {
    const { min, max } = criteria.cholesterolRange;
    if (patientData.cholesterol < min || patientData.cholesterol > max) return false;
  }

  if (criteria.ldlRange && patientData.ldl !== undefined) {
    const { min, max } = criteria.ldlRange;
    if (patientData.ldl < min || patientData.ldl > max) return false;
  }

  if (criteria.hdlRange && patientData.hdl !== undefined) {
    const { min, max } = criteria.hdlRange;
    if (patientData.hdl < min || patientData.hdl > max) return false;
  }

  if (criteria.triglyceridesRange && patientData.triglycerides !== undefined) {
    const { min, max } = criteria.triglyceridesRange;
    if (patientData.triglycerides < min || patientData.triglycerides > max) return false;
  }

  // Check vital sign ranges
  if (criteria.systolicBPRange && patientData.systolicBP !== undefined) {
    const { min, max } = criteria.systolicBPRange;
    if (patientData.systolicBP < min || patientData.systolicBP > max) return false;
  }

  if (criteria.diastolicBPRange && patientData.diastolicBP !== undefined) {
    const { min, max } = criteria.diastolicBPRange;
    if (patientData.diastolicBP < min || patientData.diastolicBP > max) return false;
  }

  if (criteria.bmiRange && patientData.bmi !== undefined) {
    const { min, max } = criteria.bmiRange;
    if (patientData.bmi < min || patientData.bmi > max) return false;
  }

  if (criteria.heartRateRange && patientData.heartRate !== undefined) {
    const { min, max } = criteria.heartRateRange;
    if (patientData.heartRate < min || patientData.heartRate > max) return false;
  }

  // Check medication requirements
  if (criteria.requiredMedications && patientData.medications) {
    const patientMeds = new Set(patientData.medications.map(m => m.toUpperCase()));
    for (const required of criteria.requiredMedications) {
      if (!patientMeds.has(required.toUpperCase())) return false;
    }
  }

  if (criteria.excludedMedications && patientData.medications) {
    const patientMeds = new Set(patientData.medications.map(m => m.toUpperCase()));
    for (const excluded of criteria.excludedMedications) {
      if (patientMeds.has(excluded.toUpperCase())) return false;
    }
  }

  // Check allergy requirements
  if (criteria.excludedAllergies && patientData.allergies) {
    const patientAllergies = new Set(patientData.allergies.map(a => a.toUpperCase()));
    for (const excluded of criteria.excludedAllergies) {
      if (patientAllergies.has(excluded.toUpperCase())) return false;
    }
  }

  // Check diagnosis requirements
  if (criteria.requiredDiagnoses && patientData.diagnoses) {
    const patientDiagnoses = new Set(patientData.diagnoses.map(d => d.toUpperCase()));
    for (const required of criteria.requiredDiagnoses) {
      if (!patientDiagnoses.has(required.toUpperCase())) return false;
    }
  }

  if (criteria.excludedDiagnoses && patientData.diagnoses) {
    const patientDiagnoses = new Set(patientData.diagnoses.map(d => d.toUpperCase()));
    for (const excluded of criteria.excludedDiagnoses) {
      if (patientDiagnoses.has(excluded.toUpperCase())) return false;
    }
  }

  return true;
}

/**
 * Generates a deterministic eligibility code from patient data and criteria
 *
 * The code is a 4-element array representing a 128-byte value:
 * - Element 0: Biomarker data hash
 * - Element 1: Vital signs data hash
 * - Element 2: Medication/allergy data hash
 * - Element 3: Diagnosis data hash
 *
 * @param patientData Patient's medical data
 * @param criteria Study eligibility criteria
 * @returns 4-element eligibility code (each element is a field element)
 */
export async function generateEligibilityCode(
  patientData: PatientMedicalData,
  criteria: EligibilityCriteria
): Promise<bigint[]> {
  // First check if patient meets criteria
  if (!checkEligibility(patientData, criteria)) {
    throw new Error("Patient does not meet eligibility criteria");
  }

  const poseidon = await buildPoseidon();

  // Element 0: Biomarker data
  const biomarkerInputs: bigint[] = [];
  if (criteria.hba1cRange && patientData.hba1c !== undefined) {
    biomarkerInputs.push(normalizeNumeric(patientData.hba1c));
  }
  if (criteria.cholesterolRange && patientData.cholesterol !== undefined) {
    biomarkerInputs.push(normalizeNumeric(patientData.cholesterol));
  }
  if (criteria.ldlRange && patientData.ldl !== undefined) {
    biomarkerInputs.push(normalizeNumeric(patientData.ldl));
  }
  if (criteria.hdlRange && patientData.hdl !== undefined) {
    biomarkerInputs.push(normalizeNumeric(patientData.hdl));
  }
  if (criteria.triglyceridesRange && patientData.triglycerides !== undefined) {
    biomarkerInputs.push(normalizeNumeric(patientData.triglycerides));
  }
  const biomarkerHash = biomarkerInputs.length > 0
    ? poseidon.F.toObject(poseidon(biomarkerInputs))
    : 0n;

  // Element 1: Vital signs data
  const vitalInputs: bigint[] = [];
  if (criteria.systolicBPRange && patientData.systolicBP !== undefined) {
    vitalInputs.push(normalizeNumeric(patientData.systolicBP));
  }
  if (criteria.diastolicBPRange && patientData.diastolicBP !== undefined) {
    vitalInputs.push(normalizeNumeric(patientData.diastolicBP));
  }
  if (criteria.bmiRange && patientData.bmi !== undefined) {
    vitalInputs.push(normalizeNumeric(patientData.bmi));
  }
  if (criteria.heartRateRange && patientData.heartRate !== undefined) {
    vitalInputs.push(normalizeNumeric(patientData.heartRate));
  }
  const vitalHash = vitalInputs.length > 0
    ? poseidon.F.toObject(poseidon(vitalInputs))
    : 0n;

  // Element 2: Medication/allergy data
  const medAllergyInputs: bigint[] = [];
  if (criteria.requiredMedications && patientData.medications) {
    for (const med of criteria.requiredMedications) {
      if (patientData.medications.some(m => m.toUpperCase() === med.toUpperCase())) {
        medAllergyInputs.push(stringToFieldElement(med));
      }
    }
  }
  if (criteria.excludedAllergies && patientData.allergies) {
    // For excluded allergies, we hash the absence (use a marker value)
    for (const allergy of criteria.excludedAllergies) {
      if (!patientData.allergies.some(a => a.toUpperCase() === allergy.toUpperCase())) {
        medAllergyInputs.push(stringToFieldElement(`NO_${allergy}`));
      }
    }
  }
  const medAllergyHash = medAllergyInputs.length > 0
    ? poseidon.F.toObject(poseidon(medAllergyInputs))
    : 0n;

  // Element 3: Diagnosis data
  const diagnosisInputs: bigint[] = [];
  if (criteria.requiredDiagnoses && patientData.diagnoses) {
    for (const dx of criteria.requiredDiagnoses) {
      if (patientData.diagnoses.some(d => d.toUpperCase() === dx.toUpperCase())) {
        diagnosisInputs.push(stringToFieldElement(dx));
      }
    }
  }
  if (criteria.excludedDiagnoses && patientData.diagnoses) {
    // For excluded diagnoses, hash the absence
    for (const dx of criteria.excludedDiagnoses) {
      if (!patientData.diagnoses.some(d => d.toUpperCase() === dx.toUpperCase())) {
        diagnosisInputs.push(stringToFieldElement(`NO_${dx}`));
      }
    }
  }
  const diagnosisHash = diagnosisInputs.length > 0
    ? poseidon.F.toObject(poseidon(diagnosisInputs))
    : 0n;

  return [biomarkerHash, vitalHash, medAllergyHash, diagnosisHash];
}

/**
 * Hashes an eligibility code to a single field element
 * This is the public input used in the ZK circuit
 */
export async function hashEligibilityCode(code: bigint[]): Promise<bigint> {
  if (code.length !== 4) {
    throw new Error("Eligibility code must have exactly 4 elements");
  }

  const poseidon = await buildPoseidon();
  return poseidon.F.toObject(poseidon(code));
}

/**
 * Example usage for Type 2 Diabetes study with cardiovascular risk
 */
export async function exampleDiabetesStudy() {
  // Study criteria
  const criteria: EligibilityCriteria = {
    hba1cRange: { min: 7.0, max: 10.0 }, // Uncontrolled diabetes
    ldlRange: { min: 0, max: 130 }, // LDL < 130 mg/dL
    bmiRange: { min: 25, max: 40 }, // Overweight to obese
    requiredDiagnoses: ["E11.9"], // Type 2 diabetes ICD-10
    excludedMedications: ["WARFARIN"], // No anticoagulants
    excludedAllergies: ["METFORMIN"], // Study drug
  };

  // Patient data
  const patientData: PatientMedicalData = {
    hba1c: 8.2,
    ldl: 115,
    bmi: 31.5,
    diagnoses: ["E11.9", "I10"], // Type 2 diabetes + hypertension
    medications: ["LISINOPRIL"], // ACE inhibitor for hypertension
    allergies: [], // No allergies
  };

  // Generate eligibility code
  const code = await generateEligibilityCode(patientData, criteria);
  console.log("Eligibility code:", code);

  // Hash the code for on-chain storage
  const codeHash = await hashEligibilityCode(code);
  console.log("Code hash (public input):", codeHash.toString());

  return { code, codeHash };
}
