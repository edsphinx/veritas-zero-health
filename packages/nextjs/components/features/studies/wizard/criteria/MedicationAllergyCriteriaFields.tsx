/**
 * Medication & Allergy Criteria Fields Component
 *
 * Renders input fields for medication and allergy requirements:
 * - Required Medications (patient must be taking)
 * - Excluded Medications (patient must NOT be taking)
 * - Excluded Allergies (patient must NOT have)
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { Pill } from 'lucide-react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelect } from '@/components/ui/tag-select';

interface MedicationAllergyCriteriaFieldsProps {
  form: UseFormReturn<Record<string, any>>;
  disabled?: boolean;
}

// Common medications
const MEDICATION_OPTIONS = [
  { value: 'METFORMIN', label: 'Metformin (Diabetes)' },
  { value: 'INSULIN', label: 'Insulin' },
  { value: 'LISINOPRIL', label: 'Lisinopril (ACE Inhibitor)' },
  { value: 'ATORVASTATIN', label: 'Atorvastatin (Statin)' },
  { value: 'SIMVASTATIN', label: 'Simvastatin (Statin)' },
  { value: 'ASPIRIN', label: 'Aspirin' },
  { value: 'WARFARIN', label: 'Warfarin (Anticoagulant)' },
  { value: 'GLIPIZIDE', label: 'Glipizide (Diabetes)' },
];

// Common allergies
const ALLERGY_OPTIONS = [
  { value: 'PENICILLIN', label: 'Penicillin' },
  { value: 'SULFA', label: 'Sulfa Drugs' },
  { value: 'METFORMIN', label: 'Metformin' },
  { value: 'STATINS', label: 'Statins' },
  { value: 'ASPIRIN', label: 'Aspirin' },
  { value: 'IODINE', label: 'Iodine (Contrast Dye)' },
  { value: 'LATEX', label: 'Latex' },
];

export function MedicationAllergyCriteriaFields({ form, disabled = false }: MedicationAllergyCriteriaFieldsProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Medications & Allergies</CardTitle>
            <CardDescription>Drug requirements and contraindications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Medications */}
        <FormField
          control={form.control}
          name="requiredMedications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Medications</FormLabel>
              <FormControl>
                <TagSelect
                  options={MEDICATION_OPTIONS}
                  value={field.value ? field.value.split(',').filter(Boolean) : []}
                  onChange={(values) => field.onChange(values.join(','))}
                  placeholder="-- Select medication to add --"
                  variant="primary"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Medications patient MUST be taking (e.g., for diabetes studies)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Excluded Medications */}
        <FormField
          control={form.control}
          name="excludedMedications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excluded Medications</FormLabel>
              <FormControl>
                <TagSelect
                  options={MEDICATION_OPTIONS}
                  value={field.value ? field.value.split(',').filter(Boolean) : []}
                  onChange={(values) => field.onChange(values.join(','))}
                  placeholder="-- Select medication to exclude --"
                  variant="destructive"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Medications patient must NOT be taking (contraindications)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Excluded Allergies */}
        <FormField
          control={form.control}
          name="excludedAllergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excluded Allergies</FormLabel>
              <FormControl>
                <TagSelect
                  options={ALLERGY_OPTIONS}
                  value={field.value ? field.value.split(',').filter(Boolean) : []}
                  onChange={(values) => field.onChange(values.join(','))}
                  placeholder="-- Select allergy to exclude --"
                  variant="destructive"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Allergies patient must NOT have (ensures drug safety)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
