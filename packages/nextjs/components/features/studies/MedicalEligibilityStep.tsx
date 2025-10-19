/**
 * Medical Eligibility Step Component
 *
 * Step 4 of study creation wizard - medical criteria with ZK proof
 */

import { motion } from 'framer-motion';
import { Control, UseFormWatch } from 'react-hook-form';
import { Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CreateStudyFormData } from '@/lib/validations';

interface MedicalEligibilityStepProps {
  control: Control<CreateStudyFormData>;
  watch: UseFormWatch<CreateStudyFormData>;
}

export function MedicalEligibilityStep({ control, watch }: MedicalEligibilityStepProps) {
  const requiresEligibilityProof = watch('requiresEligibilityProof');

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transitions.standard}
    >
      <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Medical Eligibility (On-Chain)</CardTitle>
              <CardDescription>
                Optional: Define detailed medical criteria with ZK proof verification
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">ZK Proof Available</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="requiresEligibilityProof"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 p-4 rounded-lg border border-border">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
              </FormControl>
              <div className="flex-1">
                <FormLabel>Require medical eligibility proof (verified on-chain)</FormLabel>
                <FormDescription>
                  Enable detailed medical criteria with biomarkers, vitals, medications, and diagnoses
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {!requiresEligibilityProof && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Medical Criteria Disabled</AlertTitle>
            <AlertDescription>
              This study will only verify age. Enable medical eligibility proof to add biomarkers,
              vital signs, medications, diagnoses, and allergies criteria.
            </AlertDescription>
          </Alert>
        )}

        {requiresEligibilityProof && (
          <Alert className="border-warning/20 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Full medical criteria form coming soon</AlertTitle>
            <AlertDescription className="text-warning">
              The detailed medical criteria form (biomarkers, vitals, medications, diagnoses, allergies)
              will be implemented in the next iteration. For now, this enables the medical proof requirement.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}
