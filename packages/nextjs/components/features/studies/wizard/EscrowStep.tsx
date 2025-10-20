/**
 * Escrow Step Component (Step 1 of 4)
 *
 * Collects data for escrow creation and executes TX1
 * - Basic study information (title, description, region)
 * - Provider and compensation splits (MVP: single clinic)
 * - Funding parameters
 * - USDC approval + escrow creation transaction
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { escrowStepSchema, type EscrowStepFormData } from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MockStudyBlockchainService, MockUSDCService } from '@/lib/blockchain/mock-study-service';

// ============================================
// Types
// ============================================

interface EscrowStepProps {
  onComplete: (data: EscrowStepFormData, txHash: string, escrowId: bigint) => void;
  onBack?: () => void;
  initialData?: Partial<EscrowStepFormData>;
  isResuming?: boolean;
}

type TransactionStatus = 'idle' | 'checking_balance' | 'checking_approval' | 'approving' | 'creating_escrow' | 'success' | 'error';

// ============================================
// Component
// ============================================

export function EscrowStep({ onComplete, onBack, initialData, isResuming }: EscrowStepProps) {
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<EscrowStepFormData>({
    resolver: zodResolver(escrowStepSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      region: '',
      clinicAddress: '',
      patientPercentage: 3000, // 30%
      clinicPercentage: 7000, // 70%
      totalFunding: 10000,
      maxParticipants: 40,
      paymentPerParticipant: 250,
    },
  });

  // Calculated values
  const totalFunding = form.watch('totalFunding');
  const maxParticipants = form.watch('maxParticipants');
  const paymentPerParticipant = form.watch('paymentPerParticipant');
  const patientPercentage = form.watch('patientPercentage');
  const clinicPercentage = form.watch('clinicPercentage');

  const totalCost = maxParticipants * paymentPerParticipant;
  const isOverBudget = totalCost > totalFunding;

  // Execute blockchain transaction
  async function onSubmit(data: EscrowStepFormData) {
    setErrorMessage(null);

    try {
      // Step 1: Check USDC balance
      setTxStatus('checking_balance');
      const loadingToast = toast.loading('Checking USDC balance...');

      // TODO: Replace with real wallet address from useAccount()
      const mockWalletAddress = '0x' + '1'.repeat(40);
      const balance = await MockUSDCService.checkBalance(mockWalletAddress);

      if (balance < data.totalFunding) {
        toast.dismiss(loadingToast);
        throw new Error(`Insufficient USDC balance. Need ${data.totalFunding} USDC, have ${balance} USDC`);
      }

      // Step 2: Check USDC approval
      setTxStatus('checking_approval');
      toast.dismiss(loadingToast);
      const approvalToast = toast.loading('Checking USDC approval...');

      // TODO: Replace with real escrow contract address from config
      const mockEscrowAddress = '0x' + '2'.repeat(40);
      const currentAllowance = await MockUSDCService.checkApproval(mockWalletAddress, mockEscrowAddress);

      // Step 3: Request approval if needed
      if (currentAllowance < data.totalFunding) {
        setTxStatus('approving');
        toast.dismiss(approvalToast);
        const approvalActionToast = toast.loading('Approve USDC spending...', {
          description: 'Confirm the transaction in your wallet',
        });

        const approval = await MockUSDCService.approve(mockEscrowAddress, data.totalFunding);

        toast.dismiss(approvalActionToast);
        toast.success('USDC Approved', {
          description: `TX: ${approval.txHash.slice(0, 10)}...`,
          duration: 3000,
        });
      } else {
        toast.dismiss(approvalToast);
      }

      // Step 4: Create escrow contract
      setTxStatus('creating_escrow');
      const escrowToast = toast.loading('Creating escrow contract...', {
        description: 'Confirm the transaction in your wallet',
      });

      const result = await MockStudyBlockchainService.createEscrow(data);

      toast.dismiss(escrowToast);
      toast.success('Escrow Created!', {
        description: `Escrow ID: ${result.escrowId.toString()}`,
        duration: 5000,
      });

      setTxStatus('success');

      // Proceed to next step
      setTimeout(() => {
        onComplete(data, result.txHash, result.escrowId);
      }, 1500);

    } catch (error) {
      setTxStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(message);

      toast.error('Transaction Failed', {
        description: message,
        duration: 8000,
      });

      console.error('Escrow creation error:', error);
    }
  }

  const isExecuting = txStatus !== 'idle' && txStatus !== 'error';

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
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Step 1: Escrow Configuration</CardTitle>
              <CardDescription>
                Set up funding escrow for participant compensation
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isResuming && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Resuming Study Creation</AlertTitle>
              <AlertDescription>
                Continue from where you left off. Your previous data has been restored.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Study Information
                </h3>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Long-term Effects of Metformin on Type 2 Diabetes"
                          {...field}
                          disabled={isExecuting}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive title for your clinical trial (10-200 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the study objectives, methodology, and expected outcomes..."
                          rows={4}
                          {...field}
                          disabled={isExecuting}
                        />
                      </FormControl>
                      <FormDescription>
                        Comprehensive study description (50-2000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., North America, Europe, Global"
                          {...field}
                          disabled={isExecuting}
                        />
                      </FormControl>
                      <FormDescription>
                        Geographic region where the study will be conducted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Provider & Compensation Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Provider & Compensation Splits</h3>
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-900 dark:text-blue-100">MVP: Single Clinic Model</AlertTitle>
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Currently supporting one clinic per study. Multi-clinic support coming in future updates.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="clinicAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinic Wallet Address *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0x..."
                          {...field}
                          disabled={isExecuting}
                        />
                      </FormControl>
                      <FormDescription>
                        Ethereum address of the certified clinic/provider
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Percentage (basis points) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                              form.setValue('clinicPercentage', 10000 - value);
                            }}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          {(patientPercentage / 100).toFixed(1)}% to participants
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clinicPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Percentage (basis points) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                              form.setValue('patientPercentage', 10000 - value);
                            }}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          {(clinicPercentage / 100).toFixed(1)}% to clinic
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Funding Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Funding Parameters</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalFunding"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Funding (USDC) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          Total USDC to deposit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enrollment cap
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentPerParticipant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment per Participant *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          USDC per person
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert variant={isOverBudget ? "destructive" : "default"}>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Funding Summary</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 mt-2">
                      <div>Total Cost: <strong>${totalCost.toLocaleString()} USDC</strong></div>
                      <div>Available Budget: <strong>${totalFunding.toLocaleString()} USDC</strong></div>
                      {isOverBudget && (
                        <div className="text-destructive font-semibold">
                          ⚠️ Over budget by ${(totalCost - totalFunding).toLocaleString()} USDC
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
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
                {onBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={isExecuting}
                  >
                    Back
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isExecuting || isOverBudget}
                  className="ml-auto"
                >
                  {txStatus === 'checking_balance' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking Balance...
                    </>
                  )}
                  {txStatus === 'checking_approval' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking Approval...
                    </>
                  )}
                  {txStatus === 'approving' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Approving USDC...
                    </>
                  )}
                  {txStatus === 'creating_escrow' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Escrow...
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
                      Create Escrow
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
