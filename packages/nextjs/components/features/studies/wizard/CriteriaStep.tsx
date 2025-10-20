/**
 * Criteria Step Component (Step 3 of 4)
 *
 * Sets eligibility criteria for the study
 * - Shows escrowId + registryId from previous steps
 * - Age criteria (off-chain ZK proof)
 * - Medical eligibility toggle (on-chain ZK proof - future)
 * - Executes TX3: StudyRegistry.setStudyCriteria()
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { criteriaStepSchema, type CriteriaStepFormData } from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MockStudyBlockchainService } from '@/lib/blockchain/mock-study-service';

interface CriteriaStepProps {
  escrowId: bigint;
  registryId: bigint;
  onComplete: (data: Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>, txHash: string) => void;
  onBack: () => void;
  initialData?: Partial<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>;
}

type TransactionStatus = 'idle' | 'setting_criteria' | 'success' | 'error';

export function CriteriaStep({
  escrowId,
  registryId,
  onComplete,
  onBack,
  initialData,
}: CriteriaStepProps) {
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>({
    resolver: zodResolver(criteriaStepSchema.omit({ escrowId: true, registryId: true })),
    defaultValues: initialData || {
      minAge: 18,
      maxAge: 65,
      requiresEligibilityProof: false,
      eligibilityCodeHash: '0',
    },
  });

  const requiresEligibilityProof = form.watch('requiresEligibilityProof');

  async function onSubmit(data: Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>) {
    setErrorMessage(null);
    setTxStatus('setting_criteria');

    const criteriaToast = toast.loading('Setting study criteria...', {
      description: 'Confirm the transaction in your wallet',
    });

    try {
      const result = await MockStudyBlockchainService.setCriteria({
        escrowId,
        registryId,
        ...data,
      });

      toast.dismiss(criteriaToast);
      toast.success('Criteria Set Successfully!', {
        description: 'Proceeding to milestone setup...',
        duration: 5000,
      });

      setTxStatus('success');

      setTimeout(() => {
        onComplete(data, result.txHash);
      }, 1500);

    } catch (error) {
      setTxStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(message);

      toast.dismiss(criteriaToast);
      toast.error('Transaction Failed', {
        description: message,
        duration: 8000,
      });

      console.error('Criteria setting error:', error);
    }
  }

  const isExecuting = txStatus === 'setting_criteria';

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.standard}
    >
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <div>
              <CardTitle>Step 3: Eligibility Criteria</CardTitle>
              <CardDescription>
                Define who can participate using zero-knowledge proofs
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Previous Steps Confirmation */}
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Study Published Successfully
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200 space-y-1">
              <div><strong>Escrow ID:</strong> {escrowId.toString()}</div>
              <div><strong>Registry ID:</strong> {registryId.toString()}</div>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Age Criteria with ZK Proof Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Age Requirements</h3>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <Shield className="h-3 w-3 mr-1" />
                    ZK Proof Available
                  </Badge>
                </div>

                <Alert className="bg-success-50 dark:bg-success-950 border-success-200 dark:border-success-800">
                  <CheckCircle2 className="h-4 w-4 text-success-600 dark:text-success-400" />
                  <AlertTitle className="text-success-900 dark:text-success-100">
                    Anonymous Age Verification
                  </AlertTitle>
                  <AlertDescription className="text-success-800 dark:text-success-200">
                    Patients prove age eligibility without revealing exact birthdate. Proof generation: 33-60ms.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Age *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum age in years
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Age *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum age in years
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Medical Eligibility (Future Feature) */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Medical Eligibility Proof</h3>

                <FormField
                  control={form.control}
                  name="requiresEligibilityProof"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isExecuting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Require on-chain medical eligibility proof
                        </FormLabel>
                        <FormDescription>
                          Enable ZK proof verification for biomarkers, vitals, diagnoses, medications
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {requiresEligibilityProof ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      Medical eligibility ZK proofs will be available in the next release.
                      For now, only age verification is supported.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-muted">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Disabled</AlertTitle>
                    <AlertDescription>
                      Medical eligibility proof is currently disabled. Only age criteria will be verified.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Error Display */}
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Transaction Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isExecuting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <Button type="submit" disabled={isExecuting}>
                  {txStatus === 'setting_criteria' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting Criteria...
                    </>
                  )}
                  {txStatus === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Success! Proceeding...
                    </>
                  )}
                  {(txStatus === 'idle' || txStatus === 'error') && (
                    <>
                      Set Criteria
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
