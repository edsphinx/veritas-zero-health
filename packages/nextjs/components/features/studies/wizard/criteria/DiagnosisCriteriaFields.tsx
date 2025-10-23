/**
 * Diagnosis Criteria Fields Component
 *
 * Renders input fields for diagnosis requirements:
 * - Required Diagnoses (patient must have)
 * - Excluded Diagnoses (patient must NOT have)
 *
 * Uses ICD-10 codes (e.g., E11.9 for Type 2 Diabetes)
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { FileText } from 'lucide-react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelect } from '@/components/ui/tag-select';

interface DiagnosisCriteriaFieldsProps {
  form: UseFormReturn<Record<string, any>>;
  disabled?: boolean;
}

// Common ICD-10 diagnosis codes
const DIAGNOSIS_OPTIONS = [
  { value: 'E11.9', label: 'E11.9 - Type 2 Diabetes Mellitus' },
  { value: 'I10', label: 'I10 - Essential Hypertension' },
  { value: 'E78.5', label: 'E78.5 - Hyperlipidemia' },
  { value: 'E66.9', label: 'E66.9 - Obesity' },
  { value: 'E11.65', label: 'E11.65 - Type 2 Diabetes with Hyperglycemia' },
  { value: 'I25.10', label: 'I25.10 - Atherosclerotic Heart Disease' },
  { value: 'E78.00', label: 'E78.00 - Pure Hypercholesterolemia' },
  { value: 'N18.3', label: 'N18.3 - Chronic Kidney Disease Stage 3' },
];

const EXCLUDED_DIAGNOSIS_OPTIONS = [
  { value: 'C00-C99', label: 'C00-C99 - Any Cancer Diagnosis' },
  { value: 'F00-F99', label: 'F00-F99 - Mental/Behavioral Disorders' },
  { value: 'N18.5', label: 'N18.5 - Chronic Kidney Disease Stage 5' },
  { value: 'I50', label: 'I50 - Heart Failure' },
  { value: 'J44', label: 'J44 - COPD' },
];

export function DiagnosisCriteriaFields({ form, disabled = false }: DiagnosisCriteriaFieldsProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Diagnosis Requirements</CardTitle>
            <CardDescription>Medical conditions using ICD-10 codes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Diagnoses */}
        <FormField
          control={form.control}
          name="requiredDiagnoses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Diagnoses (ICD-10)</FormLabel>
              <FormControl>
                <TagSelect
                  options={DIAGNOSIS_OPTIONS}
                  value={field.value ? field.value.split(',').filter(Boolean) : []}
                  onChange={(values) => field.onChange(values.join(','))}
                  placeholder="-- Select diagnosis to add --"
                  variant="primary"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Diagnoses patient MUST have. Select from common ICD-10 codes.
                <br />
                <span className="text-xs text-muted-foreground">
                  Example: E11.9 = Type 2 Diabetes, I10 = Hypertension
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Excluded Diagnoses */}
        <FormField
          control={form.control}
          name="excludedDiagnoses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excluded Diagnoses (ICD-10)</FormLabel>
              <FormControl>
                <TagSelect
                  options={EXCLUDED_DIAGNOSIS_OPTIONS}
                  value={field.value ? field.value.split(',').filter(Boolean) : []}
                  onChange={(values) => field.onChange(values.join(','))}
                  placeholder="-- Select diagnosis to exclude --"
                  variant="destructive"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Diagnoses patient must NOT have (exclusion criteria).
                <br />
                <span className="text-xs text-muted-foreground">
                  Example: C00-C99 = Any cancer diagnosis
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
