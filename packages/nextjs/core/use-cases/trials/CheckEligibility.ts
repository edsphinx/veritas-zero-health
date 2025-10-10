/**
 * Use Case: Check Trial Eligibility
 *
 * Checks if a patient meets the eligibility criteria for a clinical trial
 * without generating a ZK proof. Used for quick pre-checks before applying.
 *
 * This is a read-only operation that helps users understand if they should
 * proceed with the full application process.
 */

import type { NillionClient } from '@/infrastructure/nillion/NillionClient';
import type {
  Diagnosis,
  Biomarker,
  Vital,
  Medication,
} from '@/shared/types/health.types';

/**
 * Study eligibility criteria
 * (Fetched from contract + IPFS)
 */
export interface StudyEligibilityCriteria {
  studyId: bigint;
  ageRange?: {
    min: number;
    max: number;
  };
  biomarkerRanges?: {
    [testName: string]: {
      min?: number;
      max?: number;
      unit: string;
    };
  };
  requiredDiagnoses?: string[]; // ICD-10 codes
  excludedDiagnoses?: string[]; // ICD-10 codes that disqualify
  requiredMedications?: string[];
  excludedMedications?: string[];
}

/**
 * Individual eligibility check result
 */
interface EligibilityCheck {
  criterion: string;
  met: boolean;
  reason: string;
  critical: boolean; // If false, it's a soft requirement
}

/**
 * Request params for eligibility check
 */
export interface CheckEligibilityRequest {
  studyId: bigint;
  patientAge: number;
  criteria: StudyEligibilityCriteria;
}

/**
 * Response from eligibility check
 */
export interface CheckEligibilityResponse {
  success: boolean;
  data?: {
    isEligible: boolean;
    confidenceScore: number; // 0-100, how certain we are
    checks: EligibilityCheck[];
    summary: string;
  };
  error?: string;
}

/**
 * CheckEligibility Use Case
 *
 * Performs a privacy-preserving eligibility check by analyzing
 * health data stored in Nillion against study criteria.
 *
 * @example
 * ```typescript
 * const useCase = new CheckEligibilityUseCase(nillionClient);
 *
 * const result = await useCase.execute({
 *   studyId: 1n,
 *   patientAge: 35,
 *   criteria: { ageRange: { min: 18, max: 65 } }
 * });
 *
 * if (result.data?.isEligible) {
 *   console.log('Patient is eligible!');
 * }
 * ```
 */
export class CheckEligibilityUseCase {
  constructor(private nillionClient: NillionClient) {}

  /**
   * Execute eligibility check
   */
  async execute(
    request: CheckEligibilityRequest
  ): Promise<CheckEligibilityResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Initialize Nillion client
      await this.nillionClient.initialize();

      // Fetch patient health data
      const healthData = await this.fetchHealthData();

      // Perform eligibility checks
      const checks: EligibilityCheck[] = [];

      // Check 1: Age range
      if (request.criteria.ageRange) {
        checks.push(this.checkAgeRange(request.patientAge, request.criteria.ageRange));
      }

      // Check 2: Biomarkers
      if (request.criteria.biomarkerRanges && healthData.biomarkers.length > 0) {
        checks.push(
          ...this.checkBiomarkers(
            healthData.biomarkers,
            request.criteria.biomarkerRanges
          )
        );
      }

      // Check 3: Diagnoses
      if (
        (request.criteria.requiredDiagnoses || request.criteria.excludedDiagnoses) &&
        healthData.diagnoses.length > 0
      ) {
        checks.push(
          ...this.checkDiagnoses(
            healthData.diagnoses,
            request.criteria.requiredDiagnoses,
            request.criteria.excludedDiagnoses
          )
        );
      }

      // Check 4: Medications
      if (
        (request.criteria.requiredMedications || request.criteria.excludedMedications) &&
        healthData.medications.length > 0
      ) {
        checks.push(
          ...this.checkMedications(
            healthData.medications,
            request.criteria.requiredMedications,
            request.criteria.excludedMedications
          )
        );
      }

      // Calculate overall eligibility
      const criticalChecksFailed = checks.some(c => c.critical && !c.met);
      const isEligible = !criticalChecksFailed;

      // Calculate confidence score
      const totalChecks = checks.length;
      const passedChecks = checks.filter(c => c.met).length;
      const confidenceScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

      // Generate summary
      const summary = this.generateSummary(isEligible, checks);

      return {
        success: true,
        data: {
          isEligible,
          confidenceScore,
          checks,
          summary,
        },
      };
    } catch (error) {
      console.error('[CheckEligibilityUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check eligibility',
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: CheckEligibilityRequest): string | null {
    if (!request.studyId || request.studyId <= 0n) {
      return 'Invalid study ID';
    }

    if (!request.patientAge || request.patientAge < 0 || request.patientAge > 150) {
      return 'Invalid age value';
    }

    if (!request.criteria) {
      return 'Missing eligibility criteria';
    }

    return null;
  }

  /**
   * Fetch health data from Nillion
   */
  private async fetchHealthData() {
    return this.nillionClient.getAllHealthData();
  }

  /**
   * Check age range
   */
  private checkAgeRange(
    age: number,
    range: { min: number; max: number }
  ): EligibilityCheck {
    const met = age >= range.min && age <= range.max;

    return {
      criterion: 'Age Range',
      met,
      reason: met
        ? `Age ${age} is within range ${range.min}-${range.max}`
        : `Age ${age} is outside required range ${range.min}-${range.max}`,
      critical: true,
    };
  }

  /**
   * Check biomarker values
   */
  private checkBiomarkers(
    biomarkers: Biomarker[],
    ranges: Record<string, { min?: number; max?: number; unit: string }>
  ): EligibilityCheck[] {
    const checks: EligibilityCheck[] = [];

    for (const [testName, range] of Object.entries(ranges)) {
      // Find most recent biomarker for this test
      const relevantBiomarkers = biomarkers.filter(b => b.testName === testName);

      if (relevantBiomarkers.length === 0) {
        checks.push({
          criterion: `Biomarker: ${testName}`,
          met: false,
          reason: `No ${testName} test results found`,
          critical: false,
        });
        continue;
      }

      // Get most recent result
      const latest = relevantBiomarkers.sort((a, b) => b.timestamp - a.timestamp)[0];
      const value = latest.values[testName]?.value;

      if (value === undefined) {
        checks.push({
          criterion: `Biomarker: ${testName}`,
          met: false,
          reason: `${testName} value not found in test results`,
          critical: false,
        });
        continue;
      }

      // Check range
      const withinMin = range.min !== undefined ? value >= range.min : true;
      const withinMax = range.max !== undefined ? value <= range.max : true;
      const met = withinMin && withinMax;

      checks.push({
        criterion: `Biomarker: ${testName}`,
        met,
        reason: met
          ? `${testName}: ${value} ${range.unit} is within range`
          : `${testName}: ${value} ${range.unit} is outside required range`,
        critical: true,
      });
    }

    return checks;
  }

  /**
   * Check diagnoses
   */
  private checkDiagnoses(
    diagnoses: Diagnosis[],
    required?: string[],
    excluded?: string[]
  ): EligibilityCheck[] {
    const checks: EligibilityCheck[] = [];
    const patientICD10Codes = new Set(diagnoses.flatMap(d => d.icd10Codes));

    // Check required diagnoses
    if (required) {
      for (const code of required) {
        const met = patientICD10Codes.has(code);
        checks.push({
          criterion: `Required Diagnosis: ${code}`,
          met,
          reason: met
            ? `Patient has required diagnosis ${code}`
            : `Patient missing required diagnosis ${code}`,
          critical: true,
        });
      }
    }

    // Check excluded diagnoses
    if (excluded) {
      for (const code of excluded) {
        const met = !patientICD10Codes.has(code);
        checks.push({
          criterion: `Excluded Diagnosis: ${code}`,
          met,
          reason: met
            ? `Patient does not have excluded diagnosis ${code}`
            : `Patient has excluded diagnosis ${code}`,
          critical: true,
        });
      }
    }

    return checks;
  }

  /**
   * Check medications
   */
  private checkMedications(
    medications: Medication[],
    required?: string[],
    excluded?: string[]
  ): EligibilityCheck[] {
    const checks: EligibilityCheck[] = [];
    const activeMeds = new Set(
      medications.filter(m => m.status === 'active').map(m => m.name.toLowerCase())
    );

    // Check required medications
    if (required) {
      for (const med of required) {
        const met = activeMeds.has(med.toLowerCase());
        checks.push({
          criterion: `Required Medication: ${med}`,
          met,
          reason: met
            ? `Patient is taking required medication ${med}`
            : `Patient not taking required medication ${med}`,
          critical: false, // Medications are usually soft requirements
        });
      }
    }

    // Check excluded medications
    if (excluded) {
      for (const med of excluded) {
        const met = !activeMeds.has(med.toLowerCase());
        checks.push({
          criterion: `Excluded Medication: ${med}`,
          met,
          reason: met
            ? `Patient not taking excluded medication ${med}`
            : `Patient is taking excluded medication ${med}`,
          critical: true,
        });
      }
    }

    return checks;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(isEligible: boolean, checks: EligibilityCheck[]): string {
    if (isEligible) {
      return 'You meet all critical eligibility criteria for this study.';
    }

    const failedCritical = checks.filter(c => c.critical && !c.met);

    if (failedCritical.length === 1) {
      return `You do not meet the following requirement: ${failedCritical[0].criterion}`;
    }

    return `You do not meet ${failedCritical.length} critical requirements for this study.`;
  }
}

/**
 * Factory function
 */
export function createCheckEligibilityUseCase(
  nillionClient: NillionClient
): CheckEligibilityUseCase {
  return new CheckEligibilityUseCase(nillionClient);
}
