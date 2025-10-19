/**
 * Basic Info Step Component
 *
 * Step 1 of study creation wizard - collects basic study information
 */

import { motion } from 'framer-motion';
import { Control } from 'react-hook-form';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CreateStudyFormData } from '@/lib/validations';

interface BasicInfoStepProps {
  control: Control<CreateStudyFormData>;
}

export function BasicInfoStep({ control }: BasicInfoStepProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transitions.standard}
    >
      <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Provide basic details about your clinical trial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Study Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Type 2 Diabetes Treatment Study"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A clear, descriptive title for your study (10-200 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the study, methodology, and objectives..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed description of your study (50-2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., North America, Europe, Global"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="compensation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compensation Description *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., $500/month for 6 months"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
