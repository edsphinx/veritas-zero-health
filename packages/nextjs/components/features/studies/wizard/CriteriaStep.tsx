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

import { useState, useEffect, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useBuildCriteriaTx, useIndexStep } from '@/hooks/wizard';
import {
  BiomarkerCriteriaFields,
  VitalSignCriteriaFields,
  MedicationAllergyCriteriaFields,
  DiagnosisCriteriaFields,
} from './criteria';
import { TransactionOverlay } from './TransactionOverlay';

interface CriteriaStepProps {
  escrowId: bigint;
  registryId: bigint;
  databaseId: string; // Database UUID (for finding study in DB)
  onComplete: (data: Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>, txHash: string) => void;
  onBack: () => void;
  initialData?: Partial<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>;
}

type TransactionStatus = 'idle' | 'setting_criteria' | 'success' | 'error';

export function CriteriaStep({
  escrowId,
  registryId,
  databaseId,
  onComplete,
  onBack,
  initialData,
}: CriteriaStepProps) {
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const hasProcessedReceiptRef = useRef(false); // Guard against re-execution (persists across renders)

  // Wagmi hooks
  const { address: userAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // API hooks
  const buildCriteriaTx = useBuildCriteriaTx();
  const indexStep = useIndexStep();

  // Diabetes Type 2 Study Preset (example from bk_nextjs)
  const DIABETES_PRESET = {
    hba1c: { enabled: true, min: '7.0', max: '10.0' },
    ldl: { enabled: true, min: '0', max: '130' },
    bmi: { enabled: true, min: '25', max: '40' },
    requiredDiagnoses: 'E11.9', // Type 2 diabetes ICD-10
    excludedMedications: 'WARFARIN',
    excludedAllergies: 'METFORMIN',
  };

  const form = useForm<Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>>({
    resolver: zodResolver(criteriaStepSchema.omit({ escrowId: true, registryId: true })),
    defaultValues: initialData || {
      minAge: 18,
      maxAge: 65,
      requiresEligibilityProof: false,
      eligibilityCodeHash: '0',
      // Biomarkers
      hba1c: { enabled: false, min: '', max: '' },
      cholesterol: { enabled: false, min: '', max: '' },
      ldl: { enabled: false, min: '', max: '' },
      hdl: { enabled: false, min: '', max: '' },
      triglycerides: { enabled: false, min: '', max: '' },
      // Vital signs
      systolicBP: { enabled: false, min: '', max: '' },
      diastolicBP: { enabled: false, min: '', max: '' },
      bmi: { enabled: false, min: '', max: '' },
      heartRate: { enabled: false, min: '', max: '' },
      // Medications/Allergies/Diagnoses
      requiredMedications: '',
      excludedMedications: '',
      excludedAllergies: '',
      requiredDiagnoses: '',
      excludedDiagnoses: '',
    },
  });

  const requiresEligibilityProof = form.watch('requiresEligibilityProof');

  // Apply diabetes preset when enabling medical eligibility for the first time
  const [hasAppliedPreset, setHasAppliedPreset] = useState(false);

  useEffect(() => {
    if (requiresEligibilityProof && !hasAppliedPreset) {
      // Apply preset values
      form.setValue('hba1c', DIABETES_PRESET.hba1c);
      form.setValue('ldl', DIABETES_PRESET.ldl);
      form.setValue('bmi', DIABETES_PRESET.bmi);
      form.setValue('requiredDiagnoses', DIABETES_PRESET.requiredDiagnoses);
      form.setValue('excludedMedications', DIABETES_PRESET.excludedMedications);
      form.setValue('excludedAllergies', DIABETES_PRESET.excludedAllergies);
      setHasAppliedPreset(true);

      toast.info('Diabetes Type 2 Study Preset Applied', {
        description: 'You can modify these values or clear them as needed',
        duration: 4000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresEligibilityProof, hasAppliedPreset]);

  // Handle transaction confirmation
  useEffect(() => {
    async function handleConfirmation() {
      // Guard: Only process once per transaction using ref (persists across renders)
      if (isConfirmed && receipt && txHash && !hasProcessedReceiptRef.current) {
        hasProcessedReceiptRef.current = true; // Set immediately to prevent re-execution

        try {
          console.log('[CriteriaStep] Processing receipt:', {
            txHash,
            databaseId,
            escrowId: escrowId.toString(),
            registryId: registryId.toString(),
          });

          // Step 3: Index the result
          await indexStep.mutateAsync({
            step: 'criteria',
            txHash: txHash,
            chainId: receipt.chainId,
            databaseId, // Pass database ID to find the study
            escrowId: escrowId.toString(),
            registryId: registryId.toString(),
          });

          toast.success('Criteria Set Successfully!', {
            description: 'Proceeding to milestone setup...',
            duration: 5000,
          });

          setTxStatus('success');

          const formData = form.getValues();
          setTimeout(() => {
            onComplete(formData, txHash);
          }, 1500);

        } catch (error) {
          setTxStatus('error');
          const message = error instanceof Error ? error.message : 'Failed to index transaction';
          setErrorMessage(message);
          toast.error('Indexing Failed', {
            description: message,
            duration: 8000,
          });
        }
      }
    }

    handleConfirmation();
  }, [isConfirmed, receipt, txHash, escrowId, registryId, databaseId, indexStep, form, onComplete]);

  async function onSubmit(data: Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>) {
    if (!isConnected || !userAddress) {
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet to continue',
      });
      return;
    }

    setErrorMessage(null);
    setTxStatus('setting_criteria');
    hasProcessedReceiptRef.current = false; // Reset guard for new transaction

    const criteriaToast = toast.loading('Setting study criteria...', {
      description: 'Confirm the transaction in your wallet',
    });

    try {
      // Step 1: Build unsigned transaction via API
      const buildResult = await buildCriteriaTx.mutateAsync({
        registryId: registryId.toString(),
        minAge: data.minAge,
        maxAge: data.maxAge,
        eligibilityCodeHash: data.requiresEligibilityProof ? data.eligibilityCodeHash : undefined,
      });

      // Step 2: User signs transaction with wallet
      const hash = await writeContractAsync({
        address: buildResult.txData.address as `0x${string}`,
        abi: buildResult.txData.abi,
        functionName: buildResult.txData.functionName,
        args: buildResult.txData.args,
        chainId: buildResult.chainId,
      });

      toast.dismiss(criteriaToast);
      toast.loading('Waiting for confirmation...', {
        description: `Transaction: ${hash.slice(0, 20)}...`,
      });

      // Set hash to trigger useWaitForTransactionReceipt
      setTxHash(hash);

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

  // Overlay messages
  const getOverlayMessage = () => {
    if (txStatus === 'success') return 'Proceeding to milestone setup...';
    return 'Confirm the transaction in your wallet';
  };

  return (
    <>
      {/* Transaction Progress Overlay */}
      <TransactionOverlay
        isVisible={isExecuting || txStatus === 'success'}
        isSuccess={txStatus === 'success'}
        title={txStatus === 'success' ? 'Criteria Set Successfully!' : 'Setting Criteria...'}
        message={getOverlayMessage()}
      />

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

              {/* Medical Eligibility */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Medical Eligibility Proof</h3>

                <FormField
                  control={form.control}
                  name="requiresEligibilityProof"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-1">
                        <FormLabel className="text-base">
                          Require on-chain medical eligibility proof
                        </FormLabel>
                        <FormDescription>
                          Enable ZK proof verification for biomarkers, vitals, diagnoses, medications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isExecuting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {requiresEligibilityProof && (
                  <div className="space-y-4">
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-900 dark:text-blue-100">
                        Medical Criteria Active
                      </AlertTitle>
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Diabetes Type 2 preset has been applied. You can modify these values or clear them as needed.
                      </AlertDescription>
                    </Alert>

                    <BiomarkerCriteriaFields form={form} disabled={isExecuting} />
                    <VitalSignCriteriaFields form={form} disabled={isExecuting} />
                    <MedicationAllergyCriteriaFields form={form} disabled={isExecuting} />
                    <DiagnosisCriteriaFields form={form} disabled={isExecuting} />
                  </div>
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
    </>
  );
}
