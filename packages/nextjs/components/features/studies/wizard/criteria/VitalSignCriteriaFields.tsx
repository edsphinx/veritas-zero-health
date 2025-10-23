/**
 * Vital Sign Criteria Fields Component
 *
 * Renders input fields for vital sign ranges:
 * - Blood Pressure (Systolic/Diastolic)
 * - BMI (Body Mass Index)
 * - Heart Rate
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { Heart } from 'lucide-react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VitalSignCriteriaFieldsProps {
  form: UseFormReturn<Record<string, any>>;
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
      <CardContent className="space-y-4">
        {/* Systolic Blood Pressure */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Systolic Blood Pressure (mmHg)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="systolicBPMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 90"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min systolic mmHg</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systolicBPMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 140"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max systolic mmHg</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Diastolic Blood Pressure */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Diastolic Blood Pressure (mmHg)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="diastolicBPMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min diastolic mmHg</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diastolicBPMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 90"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max diastolic mmHg</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* BMI */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">BMI (Body Mass Index)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bmiMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 25.0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min BMI kg/m²</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bmiMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 40.0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max BMI kg/m²</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Heart Rate */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Heart Rate (bpm)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="heartRateMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 60"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min heart rate</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heartRateMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max heart rate</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
