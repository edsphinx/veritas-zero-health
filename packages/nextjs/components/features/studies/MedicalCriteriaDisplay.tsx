/**
 * Medical Criteria Display Component
 *
 * Shows eligibility criteria in human-readable format
 * Includes Card wrapper by default for standalone use
 */

'use client';

import { Shield, Activity, Heart, Pill, AlertCircle } from 'lucide-react';
import type { StudyCriteria } from '@veritas/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Props {
  criteria: StudyCriteria;
  /** Show compact version (no Card wrapper) */
  compact?: boolean;
  /** Show Card wrapper (default: true when not compact) */
  showCard?: boolean;
}

const diagnoseNames: Record<string, string> = {
  'E11.9': 'Type 2 Diabetes Mellitus',
  'I10': 'Essential Hypertension',
  'E78.5': 'Hyperlipidemia',
  'E66.9': 'Obesity',
};

export function MedicalCriteriaDisplay({ criteria, compact = false, showCard = true }: Props) {
  const hasBiomarkers =
    criteria.hba1cMin != null ||
    criteria.ldlMin != null ||
    criteria.cholesterolMin != null ||
    criteria.hdlMin != null ||
    criteria.triglyceridesMin != null;

  const hasVitals =
    criteria.systolicBPMin != null ||
    criteria.diastolicBPMin != null ||
    criteria.bmiMin != null ||
    criteria.heartRateMin != null;

  const hasMedications =
    (criteria.requiredMedications && criteria.requiredMedications.length > 0) ||
    (criteria.excludedMedications && criteria.excludedMedications.length > 0);

  const hasAllergies =
    criteria.excludedAllergies && criteria.excludedAllergies.length > 0;

  const hasDiagnoses =
    (criteria.requiredDiagnoses && criteria.requiredDiagnoses.length > 0) ||
    (criteria.excludedDiagnoses && criteria.excludedDiagnoses.length > 0);

  const renderRange = (min?: number | null, max?: number | null, unit?: string) => {
    if (min != null && max != null) {
      return `${min} - ${max}${unit || ''}`;
    } else if (min != null) {
      return `≥ ${min}${unit || ''}`;
    } else if (max != null) {
      return `≤ ${max}${unit || ''}`;
    }
    return null;
  };

  if (compact) {
    const criteriaCount = [
      hasBiomarkers,
      hasVitals,
      hasMedications,
      hasAllergies,
      hasDiagnoses,
    ].filter(Boolean).length;

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>
          Age {criteria.minAge}-{criteria.maxAge}
          {criteriaCount > 0 && ` + ${criteriaCount} medical criteria`}
        </span>
      </div>
    );
  }

  const criteriaContent = (
    <div className="space-y-4">
      {/* Age Requirement - Always shown */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
        <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-green-900">Age Requirement</p>
          <p className="text-sm text-green-700">
            Between {criteria.minAge} and {criteria.maxAge} years old
          </p>
        </div>
      </div>

      {/* Biomarkers */}
      {hasBiomarkers && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <p className="font-medium text-sm">Lab Results Required</p>
          </div>
          <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
            {criteria.hba1cMin != null && (
              <li>
                HbA1c: {renderRange(criteria.hba1cMin, criteria.hba1cMax, '%')}
              </li>
            )}
            {criteria.ldlMin != null && (
              <li>
                LDL Cholesterol: {renderRange(criteria.ldlMin, criteria.ldlMax, ' mg/dL')}
              </li>
            )}
            {criteria.cholesterolMin != null && (
              <li>
                Total Cholesterol: {renderRange(criteria.cholesterolMin, criteria.cholesterolMax, ' mg/dL')}
              </li>
            )}
            {criteria.hdlMin != null && (
              <li>
                HDL Cholesterol: {renderRange(criteria.hdlMin, criteria.hdlMax, ' mg/dL')}
              </li>
            )}
            {criteria.triglyceridesMin != null && (
              <li>
                Triglycerides: {renderRange(criteria.triglyceridesMin, criteria.triglyceridesMax, ' mg/dL')}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Vital Signs */}
      {hasVitals && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-600" />
            <p className="font-medium text-sm">Vital Signs Required</p>
          </div>
          <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
            {criteria.bmiMin != null && (
              <li>
                BMI: {renderRange(criteria.bmiMin, criteria.bmiMax, '')} kg/m²
              </li>
            )}
            {criteria.systolicBPMin != null && (
              <li>
                Systolic BP: {renderRange(criteria.systolicBPMin, criteria.systolicBPMax, '')} mmHg
              </li>
            )}
            {criteria.diastolicBPMin != null && (
              <li>
                Diastolic BP: {renderRange(criteria.diastolicBPMin, criteria.diastolicBPMax, '')} mmHg
              </li>
            )}
            {criteria.heartRateMin != null && (
              <li>
                Heart Rate: {renderRange(criteria.heartRateMin, criteria.heartRateMax, '')} bpm
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Required Diagnoses */}
      {criteria.requiredDiagnoses && criteria.requiredDiagnoses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="font-medium text-sm">Must Have Diagnosis</p>
          </div>
          <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
            {criteria.requiredDiagnoses.map((dx) => (
              <li key={dx}>
                {diagnoseNames[dx] || dx} ({dx})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Excluded Medications */}
      {criteria.excludedMedications && criteria.excludedMedications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-purple-600" />
            <p className="font-medium text-sm">Cannot Be Taking</p>
          </div>
          <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
            {criteria.excludedMedications.map((med) => (
              <li key={med}>{med}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Required Medications */}
      {criteria.requiredMedications && criteria.requiredMedications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-green-600" />
            <p className="font-medium text-sm">Must Be Taking</p>
          </div>
          <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
            {criteria.requiredMedications.map((med) => (
              <li key={med}>{med}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Excluded Allergies */}
      {criteria.excludedAllergies && criteria.excludedAllergies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="font-medium text-sm">Cannot Be Allergic To</p>
          </div>
          <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
            {criteria.excludedAllergies.map((allergy) => (
              <li key={allergy}>{allergy}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Privacy Protected</p>
            <p>
              Medical data never leaves the patient device. Zero-knowledge proofs
              are used to verify eligibility without revealing exact health information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Return with Card wrapper if showCard is true and not compact
  if (showCard && !compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Eligibility Criteria</h2>
          </div>
        </CardHeader>
        <CardContent>{criteriaContent}</CardContent>
      </Card>
    );
  }

  // Return content only (for embedding in another Card)
  return criteriaContent;
}
