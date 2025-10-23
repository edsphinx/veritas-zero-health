/**
 * Biomarker Criteria Fields Component
 *
 * Renders input fields for biomarker ranges:
 * - HbA1c (glycated hemoglobin)
 * - Cholesterol (total)
 * - LDL (low-density lipoprotein)
 * - HDL (high-density lipoprotein)
 * - Triglycerides
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { Activity } from 'lucide-react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BiomarkerCriteriaFieldsProps {
  form: UseFormReturn<Record<string, any>>;
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
      <CardContent className="space-y-4">
        {/* HbA1c */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">HbA1c (Glycated Hemoglobin)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hba1cMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 7.0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min HbA1c %</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hba1cMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 10.0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max HbA1c %</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* LDL Cholesterol */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">LDL Cholesterol (mg/dL)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ldlMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min LDL mg/dL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ldlMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 130"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max LDL mg/dL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* HDL Cholesterol */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">HDL Cholesterol (mg/dL)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hdlMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 40"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min HDL mg/dL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hdlMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 200"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max HDL mg/dL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Total Cholesterol */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Total Cholesterol (mg/dL)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cholesterolMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
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
                  <FormDescription className="text-xs">Min total mg/dL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cholesterolMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 300"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max total mg/dL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Triglycerides */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Triglycerides (mg/dL)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="triglyceridesMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Min triglycerides</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="triglyceridesMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value ?? ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Max triglycerides</FormDescription>
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
