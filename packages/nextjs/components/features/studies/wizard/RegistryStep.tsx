/**
 * Registry Step Component (Step 2 of 4)
 *
 * Publishes study to registry after escrow creation
 * - Shows escrow ID from previous step (read-only)
 * - Collects compensation description for public view
 * - Executes TX2: StudyRegistry.publishStudy()
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { registryStepSchema, type RegistryStepFormData } from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useBuildRegistryTx, useIndexStep } from '@/hooks/wizard';

// ============================================
// Types
// ============================================

interface RegistryStepProps {
  escrowId: bigint;
  escrowTxHash: string;
  title: string;
  description: string;
  onComplete: (data: Omit<RegistryStepFormData, 'escrowId'>, txHash: string, registryId: bigint) => void;
  onBack: () => void;
  initialData?: Partial<Omit<RegistryStepFormData, 'escrowId'>>;
}

type TransactionStatus = 'idle' | 'publishing' | 'success' | 'error';

// ============================================
// Component
// ============================================

export function RegistryStep({
  escrowId,
  escrowTxHash,
  title,
  description,
  onComplete,
  onBack,
  initialData,
}: RegistryStepProps) {
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Wagmi hooks
  const { address: userAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // API hooks
  const buildRegistryTx = useBuildRegistryTx();
  const indexStep = useIndexStep();

  const form = useForm<Omit<RegistryStepFormData, 'escrowId'>>({
    resolver: zodResolver(registryStepSchema.omit({ escrowId: true })),
    defaultValues: initialData || {
      compensationDescription: '',
      criteriaURI: undefined,
    },
  });

  // Handle transaction confirmation
  useEffect(() => {
    async function handleConfirmation() {
      if (isConfirmed && receipt && txHash) {
        try {
          // Step 3: Index the result (extract registryId from receipt)
          const indexResult = await indexStep.mutateAsync({
            step: 'registry',
            txHash: txHash,
            chainId: receipt.chainId,
            escrowId: escrowId.toString(),
            title,
            description,
          });

          toast.success('Study Published!', {
            description: `Registry ID: ${indexResult.registryId}`,
            duration: 5000,
          });

          setTxStatus('success');

          const formData = form.getValues();
          setTimeout(() => {
            onComplete(formData, txHash, BigInt(indexResult.registryId!));
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
  }, [isConfirmed, receipt, txHash, escrowId, title, description, indexStep, form, onComplete]);

  // Execute blockchain transaction with real wallet signing
  async function onSubmit(data: Omit<RegistryStepFormData, 'escrowId'>) {
    if (!isConnected || !userAddress) {
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet to continue',
      });
      return;
    }

    setErrorMessage(null);
    setTxStatus('publishing');

    const publishToast = toast.loading('Publishing study to registry...', {
      description: 'Confirm the transaction in your wallet',
    });

    try {
      // Step 1: Build unsigned transaction via API
      const buildResult = await buildRegistryTx.mutateAsync({
        escrowId: escrowId.toString(),
        region: 'Global', // TODO: Make this configurable
        compensation: data.compensationDescription,
        metadataURI: data.criteriaURI,
      });

      // Step 2: User signs transaction with wallet
      const hash = await writeContractAsync({
        address: buildResult.txData.address as `0x${string}`,
        abi: buildResult.txData.abi,
        functionName: buildResult.txData.functionName,
        args: buildResult.txData.args,
        chainId: buildResult.chainId,
      });

      toast.dismiss(publishToast);
      toast.loading('Waiting for confirmation...', {
        description: `Transaction: ${hash.slice(0, 20)}...`,
      });

      // Set hash to trigger useWaitForTransactionReceipt
      setTxHash(hash);

    } catch (error) {
      setTxStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(message);

      toast.dismiss(publishToast);
      toast.error('Transaction Failed', {
        description: message,
        duration: 8000,
      });

      console.error('Registry publication error:', error);
    }
  }

  const isExecuting = txStatus === 'publishing';

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
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Step 2: Registry Publication</CardTitle>
              <CardDescription>
                Publish your study to the decentralized registry
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Escrow Confirmation */}
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Escrow Created Successfully
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200 space-y-1">
              <div><strong>Escrow ID:</strong> {escrowId.toString()}</div>
              <div className="text-sm"><strong>TX Hash:</strong> {escrowTxHash.slice(0, 20)}...</div>
            </AlertDescription>
          </Alert>

          {/* Study Summary (Read-Only) */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold">Study Details</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Title:</strong> {title}</div>
              <div className="line-clamp-2"><strong>Description:</strong> {description}</div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Public Compensation Description */}
              <FormField
                control={form.control}
                name="compensationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Compensation Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Participants receive $250 USDC distributed across 5 milestones, with clinic receiving compensation for verification services..."
                        rows={3}
                        {...field}
                        disabled={isExecuting}
                      />
                    </FormControl>
                    <FormDescription>
                      This description will be visible to potential participants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Criteria URI (Optional) */}
              <FormField
                control={form.control}
                name="criteriaURI"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criteria Metadata URI (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ipfs://... or https://..."
                        {...field}
                        disabled={isExecuting}
                      />
                    </FormControl>
                    <FormDescription>
                      IPFS or HTTPS URI for detailed eligibility criteria metadata
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  {txStatus === 'publishing' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing to Registry...
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
                      Publish to Registry
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
