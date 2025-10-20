/**
 * Escrow Step Component (Step 1 of 4)
 *
 * Collects data for escrow creation and executes TX1
 * - Basic study information (title, description, region)
 * - Provider and compensation splits (MVP: single clinic)
 * - Funding parameters with ERC20 token selection
 * - Token approval + escrow creation with user wallet signing
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
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { type Address, type Hex } from 'viem';

import { escrowStepSchema, type EscrowStepFormData } from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useBuildEscrowTx, useIndexStep } from '@/hooks/wizard';
import { getAvailableTokens, getTokenConfig, ERC20_ABI, parseTokenAmount, formatTokenAmount } from '@/config';
import { getResearchFundingEscrowContract } from '@/infrastructure/contracts/study-contracts';
import { getDefaultChainId } from '@/infrastructure/blockchain/blockchain-client.service';

// ============================================
// Types
// ============================================

interface EscrowStepProps {
  onComplete: (data: EscrowStepFormData, txHash: string, escrowId: bigint) => void;
  onBack?: () => void;
  initialData?: Partial<EscrowStepFormData>;
  isResuming?: boolean;
}

type TransactionStatus =
  | 'idle'
  | 'checking_balance'
  | 'checking_approval'
  | 'approving'
  | 'building_tx'
  | 'waiting_signature'
  | 'confirming'
  | 'indexing'
  | 'success'
  | 'error';

// ============================================
// Component
// ============================================

export function EscrowStep({ onComplete, onBack, initialData, isResuming }: EscrowStepProps) {
  const { address: userAddress, chainId: userChainId } = useAccount();
  const chainId = userChainId || getDefaultChainId();

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [approvalTxHash, setApprovalTxHash] = useState<Hex | null>(null);
  const [escrowTxHash, setEscrowTxHash] = useState<Hex | null>(null);

  // Hooks
  const buildEscrowTx = useBuildEscrowTx();
  const indexStep = useIndexStep();
  const { writeContractAsync } = useWriteContract();

  // Wait for approval confirmation
  const { isLoading: isApprovingConfirming } = useWaitForTransactionReceipt({
    hash: approvalTxHash || undefined,
  });

  // Wait for escrow TX confirmation
  const { data: escrowReceipt, isLoading: isEscrowConfirming } = useWaitForTransactionReceipt({
    hash: escrowTxHash || undefined,
  });

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

  // Get available tokens for current chain
  const availableTokens = getAvailableTokens(chainId);
  const tokenConfig = getTokenConfig(selectedToken, chainId);
  const escrowContract = getResearchFundingEscrowContract(chainId);

  // Read token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenConfig?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!tokenConfig,
    },
  });

  // Read token allowance
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenConfig?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && escrowContract ? [userAddress, escrowContract.address] : undefined,
    query: {
      enabled: !!userAddress && !!tokenConfig && !!escrowContract,
    },
  });

  // Execute blockchain transactions
  async function onSubmit(data: EscrowStepFormData) {
    if (!userAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenConfig) {
      toast.error(`${selectedToken} not available on this network`);
      return;
    }

    if (!escrowContract) {
      toast.error('Escrow contract not deployed on this network');
      return;
    }

    setErrorMessage(null);

    try {
      const fundingAmount = parseTokenAmount(data.totalFunding, tokenConfig.decimals);

      // Step 1: Check balance
      setTxStatus('checking_balance');
      const balanceToast = toast.loading(`Checking ${selectedToken} balance...`);

      if (!tokenBalance || tokenBalance < fundingAmount) {
        toast.dismiss(balanceToast);
        const available = tokenBalance ? formatTokenAmount(tokenBalance, tokenConfig.decimals) : '0';
        throw new Error(
          `Insufficient ${selectedToken} balance. Need ${data.totalFunding} ${selectedToken}, have ${available} ${selectedToken}`
        );
      }

      toast.dismiss(balanceToast);

      // Step 2: Check and request approval if needed
      setTxStatus('checking_approval');
      const approvalToast = toast.loading(`Checking ${selectedToken} approval...`);

      if (!tokenAllowance || tokenAllowance < fundingAmount) {
        toast.dismiss(approvalToast);
        setTxStatus('approving');

        const approvalActionToast = toast.loading(`Approve ${selectedToken} spending...`, {
          description: 'Confirm the transaction in your wallet',
        });

        const approvalHash = await writeContractAsync({
          address: tokenConfig.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [escrowContract.address, fundingAmount],
          chainId,
        });

        setApprovalTxHash(approvalHash);

        // Wait for approval confirmation
        toast.dismiss(approvalActionToast);
        const confirmToast = toast.loading('Waiting for approval confirmation...');

        // Poll until approval confirms
        let attempts = 0;
        while (isApprovingConfirming && attempts < 60) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        toast.dismiss(confirmToast);
        toast.success(`${selectedToken} Approved`, {
          description: `TX: ${approvalHash.slice(0, 10)}...`,
          duration: 3000,
        });

        // Refetch allowance
        await refetchAllowance();
      } else {
        toast.dismiss(approvalToast);
      }

      // Step 3: Build escrow transaction
      setTxStatus('building_tx');
      const buildToast = toast.loading('Building escrow transaction...');

      const buildResult = await buildEscrowTx.mutateAsync({
        title: data.title,
        description: data.description,
        totalFunding: data.totalFunding,
        maxParticipants: data.maxParticipants,
        certifiedProviders: data.clinicAddress ? [data.clinicAddress as Address] : undefined,
      });

      toast.dismiss(buildToast);

      // Step 4: Sign escrow transaction
      setTxStatus('waiting_signature');
      const signToast = toast.loading('Creating escrow contract...', {
        description: 'Confirm the transaction in your wallet',
      });

      const hash = await writeContractAsync({
        address: buildResult.txData.address,
        abi: buildResult.txData.abi,
        functionName: buildResult.txData.functionName as string,
        args: buildResult.txData.args as unknown[],
        chainId: buildResult.chainId,
      });

      setEscrowTxHash(hash);
      toast.dismiss(signToast);

      // Step 5: Wait for confirmation
      setTxStatus('confirming');
      const confirmToast = toast.loading('Waiting for confirmation...');

      // Poll until TX confirms
      let attempts = 0;
      while (!escrowReceipt && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!escrowReceipt) {
        toast.dismiss(confirmToast);
        throw new Error('Transaction confirmation timeout');
      }

      toast.dismiss(confirmToast);

      // Step 6: Index the result
      setTxStatus('indexing');
      const indexToast = toast.loading('Indexing escrow data...');

      const indexResult = await indexStep.mutateAsync({
        step: 'escrow',
        txHash: hash,
        chainId,
        title: data.title,
        description: data.description,
        totalFunding: data.totalFunding,
      });

      toast.dismiss(indexToast);
      toast.success('Escrow Created!', {
        description: `Escrow ID: ${indexResult.escrowId}`,
        duration: 5000,
      });

      setTxStatus('success');

      // Proceed to next step
      setTimeout(() => {
        onComplete(data, hash, BigInt(indexResult.escrowId!));
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

          {!userAddress && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to continue.
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
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Funding Parameters
                </h3>

                {/* Token Selector */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <label className="text-sm font-medium mb-2 block">Payment Token *</label>
                  <Select
                    value={selectedToken}
                    onValueChange={setSelectedToken}
                    disabled={isExecuting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.name} ({token.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tokenBalance && tokenConfig && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Balance: {formatTokenAmount(tokenBalance, tokenConfig.decimals)} {selectedToken}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalFunding"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Funding ({selectedToken}) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isExecuting}
                          />
                        </FormControl>
                        <FormDescription>
                          Total {selectedToken} to deposit
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
                          {selectedToken} per person
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
                      <div>Total Cost: <strong>${totalCost.toLocaleString()} {selectedToken}</strong></div>
                      <div>Available Budget: <strong>${totalFunding.toLocaleString()} {selectedToken}</strong></div>
                      {isOverBudget && (
                        <div className="text-destructive font-semibold">
                          ⚠️ Over budget by ${(totalCost - totalFunding).toLocaleString()} {selectedToken}
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
                  disabled={isExecuting || isOverBudget || !userAddress}
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
                      Approving {selectedToken}...
                    </>
                  )}
                  {txStatus === 'building_tx' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Building Transaction...
                    </>
                  )}
                  {txStatus === 'waiting_signature' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Waiting for Signature...
                    </>
                  )}
                  {txStatus === 'confirming' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  )}
                  {txStatus === 'indexing' && (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Indexing...
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
