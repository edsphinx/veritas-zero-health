/**
 * Age Verification Step Component
 *
 * Step 3 of study creation wizard - age criteria with ZK proof
 */

import { motion } from 'framer-motion';
import { Control } from 'react-hook-form';
import { Shield, CheckCircle2 } from 'lucide-react';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CreateStudyFormData } from '@/lib/validations';

interface AgeVerificationStepProps {
  control: Control<CreateStudyFormData>;
}

export function AgeVerificationStep({ control }: AgeVerificationStepProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transitions.standard}
    >
      <Card className="border-success/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-success" />
            <div>
              <CardTitle>Age Verification (Off-Chain)</CardTitle>
              <CardDescription>
                Define age requirements with ZK proof verification
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-success">ZK Proof Available</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="minAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Age *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="maxAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Age *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Alert className="border-success/20 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Anonymous Age Verification with Zero-Knowledge Proofs</AlertTitle>
          <AlertDescription className="text-success">
            <ul className="text-sm space-y-1 mt-2">
              <li>• Patients prove age range without revealing exact age</li>
              <li>• Generated client-side in browser extension (33-60ms)</li>
              <li>• Verified cryptographically on Optimism Sepolia</li>
              <li>• No personal data leaves patient&apos;s device</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
    </motion.div>
  );
}
