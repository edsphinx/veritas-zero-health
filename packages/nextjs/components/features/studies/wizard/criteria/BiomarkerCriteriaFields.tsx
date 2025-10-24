/**
 * Biomarker Criteria Fields Component
 *
 * Renders toggle fields for biomarker ranges:
 * - HbA1c (glycated hemoglobin)
 * - Cholesterol (total)
 * - LDL (low-density lipoprotein)
 * - HDL (high-density lipoprotein)
 * - Triglycerides
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type CriteriaStepFormData } from '@/lib/validations';
import { ToggleField } from './ToggleField';

interface BiomarkerCriteriaFieldsProps {
  form: UseFormReturn<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>;
  disabled?: boolean;
}

export function BiomarkerCriteriaFields({ form, disabled = false }: BiomarkerCriteriaFieldsProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Biomarker Ranges</CardTitle>
            <CardDescription>Blood test values for eligibility screening</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleField
          form={form}
          name="hba1c"
          label="HbA1c (Glycated Hemoglobin)"
          unit="%"
          minPlaceholder="7.0"
          maxPlaceholder="10.0"
          step="0.1"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="ldl"
          label="LDL Cholesterol"
          unit="mg/dL"
          minPlaceholder="0"
          maxPlaceholder="130"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="hdl"
          label="HDL Cholesterol"
          unit="mg/dL"
          minPlaceholder="40"
          maxPlaceholder="200"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="cholesterol"
          label="Total Cholesterol"
          unit="mg/dL"
          minPlaceholder="100"
          maxPlaceholder="300"
          disabled={disabled}
        />

        <ToggleField
          form={form}
          name="triglycerides"
          label="Triglycerides"
          unit="mg/dL"
          minPlaceholder="0"
          maxPlaceholder="500"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
