/**
 * Milestones Step Component (Step 4 of 4)
 *
 * Configures study milestones and executes TX4
 * - Template-based milestone generation
 * - Manual milestone configuration
 * - Sequential or batch TX execution (based on count)
 * - Completes study creation
 */

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  ListChecks,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  milestonesStepSchema,
  type MilestonesStepFormData,
  type MilestoneType,
} from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { MockStudyBlockchainService } from '@/lib/blockchain/mock-study-service';

interface MilestonesStepProps {
  escrowId: bigint;
  registryId: bigint;
  totalFunding: number;
  onComplete: (txHashes: string[]) => void;
  onBack: () => void;
  initialData?: { milestones: Array<{ type: MilestoneType; description: string; rewardAmount: number }> };
}

type TransactionStatus = 'idle' | 'executing_sequential' | 'executing_batch' | 'success' | 'error';

const MILESTONE_TYPE_OPTIONS: Array<{ value: MilestoneType; label: string }> = [
  { value: 'Enrollment', label: 'Enrollment' },
  { value: 'DataSubmission', label: 'Data Submission' },
  { value: 'FollowUpVisit', label: 'Follow-Up Visit' },
  { value: 'StudyCompletion', label: 'Study Completion' },
  { value: 'Custom', label: 'Custom' },
];

export function MilestonesStep({
  escrowId,
  registryId,
  totalFunding,
  onComplete,
  onBack,
  initialData,
}: MilestonesStepProps) {
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const form = useForm<Omit<MilestonesStepFormData, 'escrowId' | 'registryId' | 'totalFunding'>>({
    resolver: zodResolver(milestonesStepSchema.omit({ escrowId: true, registryId: true, totalFunding: true })),
    defaultValues: initialData || {
      milestones: [
        { type: 'Enrollment', description: 'Initial enrollment', rewardAmount: 50 },
        { type: 'StudyCompletion', description: 'Complete all study requirements', rewardAmount: 200 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'milestones',
  });

  const milestones = form.watch('milestones');
  const totalRewards = milestones.reduce((sum, m) => sum + m.rewardAmount, 0);
  const remainingBudget = totalFunding - totalRewards;
  const isOverBudget = remainingBudget < 0;

  // Template generator
  const generateFromAppointments = (count: number) => {
    const appointmentReward = Math.floor(totalFunding / (count + 2)); // +2 for enrollment and completion
    const newMilestones = [
      { type: 'Enrollment' as MilestoneType, description: 'Initial enrollment', rewardAmount: appointmentReward },
      ...Array.from({ length: count }, (_, i) => ({
        type: 'FollowUpVisit' as MilestoneType,
        description: `Follow-up visit ${i + 1}`,
        rewardAmount: appointmentReward,
      })),
      { type: 'StudyCompletion' as MilestoneType, description: 'Complete all requirements', rewardAmount: appointmentReward },
    ];

    form.setValue('milestones', newMilestones);
    toast.success(`Generated ${newMilestones.length} milestones`);
  };

  async function onSubmit(data: Omit<MilestonesStepFormData, 'escrowId' | 'registryId' | 'totalFunding'>) {
    setErrorMessage(null);

    const milestoneCount = data.milestones.length;

    try {
      // Decide strategy: sequential (≤6) or batch (>6)
      if (milestoneCount <= 6) {
        // Sequential mode
        setTxStatus('executing_sequential');
        setProgress({ completed: 0, total: milestoneCount });

        const sequentialToast = toast.loading(
          `Adding milestones sequentially (1/${milestoneCount})...`,
          { description: 'Confirm each transaction in your wallet' }
        );

        const result = await MockStudyBlockchainService.addMilestonesSequential(
          escrowId,
          data.milestones,
          (completed, total) => {
            setProgress({ completed, total });
            toast.loading(`Adding milestones (${completed}/${total})...`, {
              id: sequentialToast,
            });
          }
        );

        toast.dismiss(sequentialToast);
        toast.success('All Milestones Created!', {
          description: `${milestoneCount} milestones added successfully`,
          duration: 5000,
        });

        setTxStatus('success');

        setTimeout(() => {
          // TODO: Pass milestoneIds when implementing database indexing
          onComplete(result.txHashes);
        }, 1500);

      } else {
        // Batch mode
        setTxStatus('executing_batch');

        const batchToast = toast.loading(
          `Adding ${milestoneCount} milestones in batch...`,
          { description: 'Confirm the transaction in your wallet' }
        );

        const result = await MockStudyBlockchainService.addMilestonesBatch(
          escrowId,
          data.milestones
        );

        toast.dismiss(batchToast);
        toast.success('All Milestones Created!', {
          description: `${milestoneCount} milestones added in single transaction`,
          duration: 5000,
        });

        setTxStatus('success');

        setTimeout(() => {
          // TODO: Pass milestoneIds when implementing database indexing
          onComplete(result.txHashes);
        }, 1500);
      }

    } catch (error) {
      setTxStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(message);

      toast.error('Transaction Failed', {
        description: message,
        duration: 8000,
      });

      console.error('Milestones creation error:', error);
    }
  }

  const isExecuting = txStatus === 'executing_sequential' || txStatus === 'executing_batch';

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.standard}
      className="space-y-6"
    >
      {/* Previous Steps Confirmation */}
      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Criteria Set Successfully
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200 space-y-1">
          <div><strong>Escrow ID:</strong> {escrowId.toString()}</div>
          <div><strong>Registry ID:</strong> {registryId.toString()}</div>
        </AlertDescription>
      </Alert>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ListChecks className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Step 4: Milestones Setup</CardTitle>
              <CardDescription>
                Define participant compensation milestones
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Template */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Quick Setup: Generate from Appointments
            </h4>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Number of appointments (e.g., 5)"
                min={1}
                max={18}
                disabled={isExecuting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = parseInt((e.target as HTMLInputElement).value);
                    if (value >= 1 && value <= 18) {
                      generateFromAppointments(value);
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                  const value = parseInt(input.value);
                  if (value >= 1 && value <= 18) {
                    generateFromAppointments(value);
                  } else {
                    toast.error('Please enter a number between 1 and 18');
                  }
                }}
                disabled={isExecuting}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generates: 1 enrollment + N visits + 1 completion
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Milestones List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Milestones ({fields.length})</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ type: 'Custom', description: '', rewardAmount: 0 })}
                    disabled={isExecuting || fields.length >= 20}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="bg-muted/30">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Milestone {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={isExecuting || fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isExecuting}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {MILESTONE_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`milestones.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Initial visit"
                                  disabled={isExecuting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`milestones.${index}.rewardAmount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reward (USDC)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  disabled={isExecuting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Budget Summary */}
              <Alert variant={isOverBudget ? "destructive" : "default"}>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Budget Summary</AlertTitle>
                <AlertDescription>
                  <div className="space-y-1 mt-2">
                    <div>Total Allocated: <strong>${totalRewards.toLocaleString()} USDC</strong></div>
                    <div>Total Budget: <strong>${totalFunding.toLocaleString()} USDC</strong></div>
                    <div className={isOverBudget ? "text-destructive font-semibold" : "text-success"}>
                      Remaining: <strong>${remainingBudget.toLocaleString()} USDC</strong>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Progress Bar (Sequential Mode) */}
              {txStatus === 'executing_sequential' && progress.total > 0 && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle>Adding Milestones ({progress.completed}/{progress.total})</AlertTitle>
                  <AlertDescription>
                    <Progress
                      value={(progress.completed / progress.total) * 100}
                      className="mt-2"
                    />
                  </AlertDescription>
                </Alert>
              )}

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
                  Back
                </Button>

                <Button type="submit" disabled={isExecuting || isOverBudget || fields.length === 0}>
                  {txStatus === 'executing_sequential' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Milestones ({progress.completed}/{progress.total})
                    </>
                  )}
                  {txStatus === 'executing_batch' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Batch...
                    </>
                  )}
                  {txStatus === 'success' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete! Redirecting...
                    </>
                  )}
                  {(txStatus === 'idle' || txStatus === 'error') && (
                    <>
                      Complete Study Creation
                      <CheckCircle2 className="h-4 w-4 ml-2" />
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
