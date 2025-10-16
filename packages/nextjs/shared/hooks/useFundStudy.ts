/**
 * Custom Hook: useFundStudy
 *
 * Encapsulates the business logic for sponsors funding clinical studies.
 * Provides a clean interface for the UI layer to interact with funding operations.
 *
 * Implements a 3-step process:
 * 1. Approve ERC20 token (MockUSDC) spending
 * 2. Call fundStudyERC20 on ResearchFundingEscrow contract
 * 3. Index the deposit in the database
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { toast } from 'sonner';
import { FundStudy } from '@/core/use-cases/funding/FundStudy';
import type { Study } from '@veritas/types';

export interface UseFundStudyConfig {
  mockUSDCAddress: Address;
  escrowAddress: Address;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  escrowABI: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  erc20ABI: any;
  userAddress?: Address;
}

export type FundingStep = 'idle' | 'approving' | 'funding' | 'indexing' | 'complete';

export interface UseFundStudyReturn {
  // State
  fundingStep: FundingStep;
  isProcessing: boolean;

  // Balance
  balance: bigint | undefined;
  formattedBalance: string;
  decimals: number | undefined;
  refetchBalance: () => void;

  // Actions
  fundStudy: (params: {
    study: Study;
    amount: string;
  }) => Promise<void>;
  reset: () => void;

  // Transaction hashes
  approveHash: Address | undefined;
  fundHash: Address | undefined;
}

export function useFundStudy(config: UseFundStudyConfig): UseFundStudyReturn {
  const { mockUSDCAddress, escrowAddress, escrowABI, erc20ABI, userAddress } = config;

  // State
  const [fundingStep, setFundingStep] = useState<FundingStep>('idle');
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [currentAmount, setCurrentAmount] = useState<string>('');

  // Instantiate use case
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fundStudyUseCase = new FundStudy();

  // Read MockUSDC balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: mockUSDCAddress,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: decimals } = useReadContract({
    address: mockUSDCAddress,
    abi: erc20ABI,
    functionName: 'decimals',
  });

  // Type-cast the return values
  const typedBalance = balance as bigint | undefined;
  const typedDecimals = decimals as number | undefined;

  // Format balance for display
  const formattedBalance = typedBalance && typedDecimals
    ? formatUnits(typedBalance, typedDecimals)
    : '0';

  // Write contracts
  const { writeContractAsync: approveContract, data: approveHash, reset: resetApprove } = useWriteContract();
  const { writeContractAsync: fundContract, data: fundHash, reset: resetFund } = useWriteContract();

  // Wait for transactions
  const {
    isLoading: _isApprovePending,
    isSuccess: isApproveSuccess,
    isError: isApproveError,
    error: approveError
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    isLoading: _isFundPending,
    isSuccess: isFundSuccess,
    isError: isFundError,
    error: fundError,
    data: fundReceipt
  } = useWaitForTransactionReceipt({
    hash: fundHash,
  });

  // Derived state
  const isProcessing = fundingStep !== 'idle' && fundingStep !== 'complete';

  /**
   * Step 1: Approve MockUSDC
   */
  const executeApprove = useCallback(async (study: Study, amount: string) => {
    if (!typedDecimals) {
      throw new Error('Token decimals not loaded');
    }

    const amountWei = parseUnits(amount, typedDecimals);

    // Validate using use case
    const validation = fundStudyUseCase.validateInput({
      studyId: study.id,
      escrowId: study.escrowId,
      tokenAddress: mockUSDCAddress,
      amount: amountWei,
      sponsorAddress: userAddress!,
      escrowAddress,
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log('[useFundStudy] Step 1: Approving MockUSDC...');
    toast.info('Step 1/3: Approving USDC...', {
      description: 'Please confirm the transaction in your wallet',
    });

    await approveContract({
      address: mockUSDCAddress,
      abi: erc20ABI,
      functionName: 'approve',
      args: [escrowAddress, amountWei],
    });
  }, [typedDecimals, mockUSDCAddress, escrowAddress, erc20ABI, approveContract, userAddress, fundStudyUseCase]);

  /**
   * Step 2: Fund the study via escrow contract
   */
  const executeFund = useCallback(async (study: Study, amount: string) => {
    if (!typedDecimals) {
      throw new Error('Token decimals not loaded');
    }

    const amountWei = parseUnits(amount, typedDecimals);

    console.log('[useFundStudy] Step 2: Funding study...');
    toast.success('Approval Confirmed!');
    toast.info('Step 2/3: Funding study...', {
      description: 'Please confirm the transaction in your wallet',
    });

    await fundContract({
      address: escrowAddress,
      abi: escrowABI,
      functionName: 'fundStudyERC20',
      args: [BigInt(study.escrowId), mockUSDCAddress, amountWei],
    });
  }, [typedDecimals, escrowAddress, escrowABI, mockUSDCAddress, fundContract]);

  /**
   * Step 3: Index the deposit in database
   */
  const executeIndex = useCallback(async (study: Study, amount: string) => {
    if (!fundHash || !fundReceipt || !userAddress) {
      throw new Error('Missing transaction data for indexing');
    }

    console.log('[useFundStudy] Step 3: Indexing deposit...');
    toast.success('Funding Confirmed!');
    toast.info('Step 3/3: Indexing deposit...', {
      description: 'Updating database...',
    });

    // Call use case to index deposit
    const result = await fundStudyUseCase.indexDeposit({
      studyId: study.id,
      escrowId: study.escrowId,
      sponsorAddress: userAddress,
      tokenAddress: mockUSDCAddress,
      amount: amount,
      txHash: fundHash,
      blockNumber: fundReceipt.blockNumber,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to index deposit');
    }

    console.log('[useFundStudy] ✅ Funding complete!');
    toast.success('Funding Complete!', {
      description: `Successfully funded ${amount} USDC to ${study.title}`,
      duration: 5000,
    });

    // Refetch balance
    refetchBalance();

    return result;
  }, [fundHash, fundReceipt, userAddress, mockUSDCAddress, fundStudyUseCase, refetchBalance]);

  /**
   * Main funding function - orchestrates all 3 steps
   */
  const fundStudy = useCallback(async (params: { study: Study; amount: string }) => {
    const { study, amount } = params;

    if (!userAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Store current operation
    setCurrentStudy(study);
    setCurrentAmount(amount);

    // Start approval step
    setFundingStep('approving');

    try {
      await executeApprove(study, amount);
      // Approval success handled by useEffect
    } catch (error) {
      console.error('[useFundStudy] Error in approval:', error);
      toast.error('Approval Failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      setFundingStep('idle');
      setCurrentStudy(null);
      setCurrentAmount('');
    }
  }, [userAddress, executeApprove]);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setFundingStep('idle');
    setCurrentStudy(null);
    setCurrentAmount('');
    resetApprove();
    resetFund();
  }, [resetApprove, resetFund]);

  // Handle approval success -> trigger funding
  useEffect(() => {
    if (isApproveSuccess && fundingStep === 'approving' && currentStudy && currentAmount) {
      setFundingStep('funding');

      executeFund(currentStudy, currentAmount).catch((error) => {
        console.error('[useFundStudy] Error in funding:', error);
        toast.error('Funding Failed', {
          description: error instanceof Error ? error.message : 'Please try again',
        });
        setFundingStep('idle');
        setCurrentStudy(null);
        setCurrentAmount('');
      });
    }
  }, [isApproveSuccess, fundingStep, currentStudy, currentAmount, executeFund]);

  // Handle funding success -> trigger indexing
  useEffect(() => {
    if (isFundSuccess && fundingStep === 'funding' && currentStudy && currentAmount) {
      setFundingStep('indexing');

      executeIndex(currentStudy, currentAmount)
        .then(() => {
          setFundingStep('complete');

          // Auto-reset after delay
          setTimeout(() => {
            reset();
          }, 2000);
        })
        .catch((error) => {
          console.error('[useFundStudy] Error in indexing:', error);
          toast.error('Indexing Failed', {
            description: 'Deposit succeeded but indexing failed. Please contact support.',
          });
          setFundingStep('idle');
          setCurrentStudy(null);
          setCurrentAmount('');
        });
    }
  }, [isFundSuccess, fundingStep, currentStudy, currentAmount, executeIndex, reset]);

  // Handle approval transaction errors
  useEffect(() => {
    if (isApproveError && fundingStep === 'approving') {
      console.error('[useFundStudy] Approval transaction error:', approveError);
      const errorMessage = approveError?.message || 'Unknown error';

      if (errorMessage.includes('dropped') || errorMessage.includes('replaced')) {
        toast.error('Transaction Dropped or Replaced', {
          description: 'Your transaction was dropped. This can happen due to network congestion or if you sent another transaction. Please try again.',
          duration: 6000,
        });
      } else if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        toast.error('Transaction Rejected', {
          description: 'You rejected the transaction in your wallet.',
        });
      } else {
        toast.error('Approval Transaction Failed', {
          description: errorMessage,
        });
      }

      setFundingStep('idle');
      setCurrentStudy(null);
      setCurrentAmount('');
    }
  }, [isApproveError, approveError, fundingStep]);

  // Handle funding transaction errors
  useEffect(() => {
    if (isFundError && fundingStep === 'funding') {
      console.error('[useFundStudy] Funding transaction error:', fundError);
      const errorMessage = fundError?.message || 'Unknown error';

      if (errorMessage.includes('dropped') || errorMessage.includes('replaced')) {
        toast.error('Transaction Dropped or Replaced', {
          description: 'Your transaction was dropped. This can happen due to network congestion or if you sent another transaction. Please try again.',
          duration: 6000,
        });
      } else if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        toast.error('Transaction Rejected', {
          description: 'You rejected the transaction in your wallet.',
        });
      } else {
        toast.error('Funding Transaction Failed', {
          description: errorMessage,
        });
      }

      setFundingStep('idle');
      setCurrentStudy(null);
      setCurrentAmount('');
    }
  }, [isFundError, fundError, fundingStep]);

  return {
    // State
    fundingStep,
    isProcessing,

    // Balance
    balance: typedBalance,
    formattedBalance,
    decimals: typedDecimals,
    refetchBalance,

    // Actions
    fundStudy,
    reset,

    // Transaction hashes
    approveHash,
    fundHash,
  };
}
