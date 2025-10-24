/**
 * Toggle Field Component
 *
 * Reusable component for biomarker/vital sign fields with:
 * - Switch toggle to enable/disable
 * - Min/Max input fields (shown only when enabled)
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { type CriteriaStepFormData } from '@/lib/validations';

interface ToggleFieldProps {
  form: UseFormReturn<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>;
  name: keyof Omit<CriteriaStepFormData, 'escrowId' | 'registryId' | 'minAge' | 'maxAge' | 'requiresEligibilityProof' | 'eligibilityCodeHash' | 'requiredMedications' | 'excludedMedications' | 'excludedAllergies' | 'requiredDiagnoses' | 'excludedDiagnoses'>;
  label: string;
  unit: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  step?: string;
  disabled?: boolean;
}

export function ToggleField({
  form,
  name,
  label,
  unit,
  minPlaceholder,
  maxPlaceholder,
  step = '1',
  disabled = false,
}: ToggleFieldProps) {
  const fieldValue = form.watch(name) as { enabled: boolean; min?: string; max?: string } | undefined;
  const isEnabled = fieldValue?.enabled || false;

  return (
    <div className="p-4 rounded-lg border border-border bg-background/50">
      {/* Toggle Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => {
                      field.onChange({
                        ...(field.value as object || {}),
                        enabled: checked,
                      });
                    }}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div>
            <label className="font-medium text-sm">{label}</label>
            <span className="text-xs text-muted-foreground ml-2">({unit})</span>
          </div>
        </div>
      </div>

      {/* Min/Max Inputs - Only shown when enabled */}
      {isEnabled && (
        <div className="grid grid-cols-2 gap-3 ml-0 mt-3">
          <FormField
            control={form.control}
            name={name}
            render={({ field }) => {
              const value = field.value as { enabled: boolean; min?: string; max?: string } | undefined;
              return (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={minPlaceholder}
                      step={step}
                      value={value?.min || ''}
                      onChange={(e) => {
                        field.onChange({
                          ...(value || { enabled: true }),
                          min: e.target.value,
                        });
                      }}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name={name}
            render={({ field }) => {
              const value = field.value as { enabled: boolean; min?: string; max?: string } | undefined;
              return (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={maxPlaceholder}
                      step={step}
                      value={value?.max || ''}
                      onChange={(e) => {
                        field.onChange({
                          ...(value || { enabled: true }),
                          max: e.target.value,
                        });
                      }}
                      disabled={disabled}
                      className="text-sm"
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
