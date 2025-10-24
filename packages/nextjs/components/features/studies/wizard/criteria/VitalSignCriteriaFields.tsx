/**
 * Vital Sign Criteria Fields Component
 *
 * Renders toggle fields for vital sign ranges:
 * - Blood Pressure (Systolic/Diastolic)
 * - BMI (Body Mass Index)
 * - Heart Rate
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type CriteriaStepFormData } from '@/lib/validations';
import { ToggleField } from './ToggleField';

interface VitalSignCriteriaFieldsProps {
  form: UseFormReturn<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>;
  disabled?: boolean;
}

export function VitalSignCriteriaFields({ form, disabled = false }: VitalSignCriteriaFieldsProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Vital Sign Ranges</CardTitle>
            <CardDescription>Physical measurements for eligibility</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleField
          form={form}
          name="systolicBP"
          label="Systolic Blood Pressure"
          unit="mmHg"
          minPlaceholder="90"
          maxPlaceholder="140"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="diastolicBP"
          label="Diastolic Blood Pressure"
          unit="mmHg"
          minPlaceholder="60"
          maxPlaceholder="90"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="bmi"
          label="BMI (Body Mass Index)"
          unit="kg/m²"
          minPlaceholder="25"
          maxPlaceholder="40"
          step="0.1"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="heartRate"
          label="Heart Rate"
          unit="bpm"
          minPlaceholder="60"
          maxPlaceholder="100"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
