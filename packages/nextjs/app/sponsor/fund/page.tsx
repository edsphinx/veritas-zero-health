/**
 * Fund Study Page (Presentation Layer)
 *
 * Allows sponsors to browse and fund available clinical studies.
 * Shows study details, funding requirements, and deposit interface.
 *
 * This page follows Clean Architecture:
 * - NO business logic (all in use cases)
 * - Uses custom hooks for state management
 * - Pure presentation/UI logic only
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Beaker,
  Calendar,
  Shield,
  ArrowRight,
  Search,
  Info,
  CheckCircle2,
  Wallet,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useStudies } from '@/shared/hooks/useStudies';
import { useFundStudy } from '@/shared/hooks/useFundStudy';
import { SponsorLayout } from '@/components/layout';
import deployedContracts from '@/contracts/deployedContracts';
import { optimismSepolia } from 'viem/chains';
import type { Study } from '@veritas/types';

// Contract configuration
const MOCK_USDC_ADDRESS = '0x29c97a7d15a6eb2c0c6efffc27577991b57b6e67' as `0x${string}`;
const ESCROW_ADDRESS = deployedContracts[optimismSepolia.id].ResearchFundingEscrow.address;
const ESCROW_ABI = deployedContracts[optimismSepolia.id].ResearchFundingEscrow.abi;

// ERC20 ABI for approve, balanceOf and decimals
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default function FundStudyPage() {
  const { address, isConnected } = useAuth();
  const { studies, loading } = useStudies();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [studyDetails, setStudyDetails] = useState<any>(null);

  // Use the funding hook (encapsulates all business logic)
  const {
    fundingStep,
    isProcessing,
    formattedBalance,
    fundStudy: executeFunding,
    reset: resetFunding,
  } = useFundStudy({
    mockUSDCAddress: MOCK_USDC_ADDRESS,
    escrowAddress: ESCROW_ADDRESS,
    escrowABI: ESCROW_ABI,
    erc20ABI: ERC20_ABI,
    userAddress: address as `0x${string}` | undefined,
  });

  // Helper to format USDC amounts
  // NOTE: Milestone rewardAmount is already in display format (e.g., "100.00")
  // We don't need to divide by 1_000_000 anymore
  const formatUSDC = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? Number(amount) : amount;
    return numAmount.toFixed(2);
  };

  // Load study details when selected
  useEffect(() => {
    if (selectedStudy) {
      loadStudyDetails(selectedStudy.escrowId);
    }
  }, [selectedStudy]);

  const loadStudyDetails = async (escrowId: number) => {
    try {
      console.log('Loading study details for escrowId:', escrowId);
      const response = await fetch(`/api/studies/${escrowId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Study details loaded:', data);
        if (data.success && data.data) {
          setStudyDetails(data.data);
        }
      } else {
        console.error('Failed to load study details:', response.status);
      }
    } catch (error) {
      console.error('Error loading study details:', error);
    }
  };

  // Calculate total funding required from milestones
  const getTotalRequired = (): number => {
    if (!studyDetails?.milestones) return 0;
    const total = studyDetails.milestones.reduce(
      (sum: number, m: any) => sum + Number(m.rewardAmount),
      0
    );
    return Number(formatUSDC(total));
  };

  // Calculate funding received so far from actual deposits
  const getFundingReceived = (): number => {
    if (!studyDetails?.deposits || studyDetails.deposits.length === 0) return 0;
    // Sum all deposits (already in display format from API)
    const totalReceived = studyDetails.deposits.reduce(
      (sum: number, d: any) => sum + Number(d.amount) / 1_000_000,
      0
    );
    return totalReceived;
  };

  // Calculate remaining needed
  const getRemainingNeeded = (): number => {
    const required = getTotalRequired();
    const received = getFundingReceived();
    return Math.max(0, required - received);
  };

  // Quick amount buttons handler
  const setQuickAmount = (amount: number) => {
    setFundingAmount(amount.toString());
  };

  // Filter studies that need funding
  const availableStudies = studies.filter(study =>
    study.status === 'Created' || study.status === 'Funding' || study.status === 'Active'
  ).filter(study =>
    searchQuery === '' ||
    study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    study.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle funding completion - reset form
  useEffect(() => {
    if (fundingStep === 'complete') {
      const timer = setTimeout(() => {
        setSelectedStudy(null);
        setFundingAmount('');
        resetFunding();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fundingStep, resetFunding]);

  // Handle form submission
  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudy || !fundingAmount) {
      return;
    }

    await executeFunding({
      study: selectedStudy,
      amount: fundingAmount,
    });
  };

  if (!isConnected) {
    return (
      <SponsorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Please connect your wallet to fund studies
            </p>
          </div>
        </div>
      </SponsorLayout>
    );
  }

  return (
    <SponsorLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Fund a Clinical Study</h1>
                <p className="text-muted-foreground">
                  Support groundbreaking research and make an impact
                </p>
              </div>
            </div>

            {/* USDC Balance Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">Your Balance</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formattedBalance} USDC
              </p>
              <p className="text-xs text-green-600 mt-1">MockUSDC</p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search studies by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Studies Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading available studies...</p>
          </div>
        ) : availableStudies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Studies Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? 'No studies match your search. Try different keywords.'
                : 'There are currently no studies seeking funding. Check back later!'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedStudy(study)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Beaker className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{study.title}</h3>
                      <p className="text-sm text-muted-foreground">Study #{study.escrowId}</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-warning/10 text-warning font-medium">
                    {study.status}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                  {study.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Created
                    </span>
                    <span className="font-semibold">
                      {new Date(study.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Researcher
                    </span>
                    <span className="font-mono text-xs">
                      {study.researcherAddress.slice(0, 6)}...{study.researcherAddress.slice(-4)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStudy(study);
                  }}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Fund This Study
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Funding Modal */}
        {selectedStudy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Fund Study</h2>
                  <p className="text-sm text-muted-foreground">{selectedStudy.title}</p>
                </div>
                <button
                  onClick={() => !isProcessing && setSelectedStudy(null)}
                  disabled={isProcessing}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>

              {/* Funding Progress */}
              {studyDetails && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-700 font-medium">Funding Required</span>
                    <span className="text-xl font-bold text-blue-900">
                      ${getTotalRequired().toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600">Already Funded</span>
                    <span className="text-lg font-semibold text-blue-800">
                      ${getFundingReceived().toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">Remaining Needed</span>
                    <span className="text-lg font-bold text-orange-600">
                      ${getRemainingNeeded().toFixed(2)} USDC
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (getFundingReceived() / getTotalRequired()) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1 text-center">
                      {((getFundingReceived() / getTotalRequired()) * 100).toFixed(1)}% Funded
                    </p>
                  </div>
                </div>
              )}

              {/* Available Balance */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium">Your Balance</span>
                  <span className="text-xl font-bold text-green-900">
                    {formattedBalance} USDC
                  </span>
                </div>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        {fundingStep === 'approving' && 'Step 1/3: Approving USDC...'}
                        {fundingStep === 'funding' && 'Step 2/3: Funding Study...'}
                        {fundingStep === 'indexing' && 'Step 3/3: Updating Database...'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Please wait, do not close this window
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">About This Study</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudy.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Study ID</span>
                    <span className="font-semibold">#{selectedStudy.escrowId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Status</span>
                    <span className="font-semibold text-warning">{selectedStudy.status}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFund}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    Funding Amount (USDC)
                  </label>

                  {/* Quick Amount Buttons - Percentage of Total Required */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setQuickAmount(getTotalRequired() * 0.1)}
                      disabled={isProcessing || !studyDetails}
                      className="px-3 py-2 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`${(getTotalRequired() * 0.1).toFixed(2)} USDC`}
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(getTotalRequired() * 0.25)}
                      disabled={isProcessing || !studyDetails}
                      className="px-3 py-2 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`${(getTotalRequired() * 0.25).toFixed(2)} USDC`}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(getTotalRequired() * 0.5)}
                      disabled={isProcessing || !studyDetails}
                      className="px-3 py-2 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`${(getTotalRequired() * 0.5).toFixed(2)} USDC`}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAmount(getTotalRequired())}
                      disabled={isProcessing || !studyDetails}
                      className="px-3 py-2 rounded-lg border-2 border-green-500/30 bg-green-50 hover:bg-green-100 hover:border-green-500 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`${getTotalRequired().toFixed(2)} USDC - Full amount`}
                    >
                      100%
                    </button>
                  </div>

                  {/* Show amounts under buttons */}
                  {studyDetails && (
                    <div className="grid grid-cols-4 gap-2 mb-3 text-xs text-center text-muted-foreground">
                      <div>${(getTotalRequired() * 0.1).toFixed(2)}</div>
                      <div>${(getTotalRequired() * 0.25).toFixed(2)}</div>
                      <div>${(getTotalRequired() * 0.5).toFixed(2)}</div>
                      <div className="text-green-600 font-semibold">${getTotalRequired().toFixed(2)}</div>
                    </div>
                  )}

                  {/* Manual Input */}
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="number"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="Or enter custom amount..."
                      min="0"
                      step="0.01"
                      max={formattedBalance}
                      required
                      disabled={isProcessing}
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Choose a quick amount or enter a custom contribution (Max: {formattedBalance} USDC)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStudy(null)}
                    disabled={isProcessing}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-3 font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !fundingAmount || Number(fundingAmount) > Number(formattedBalance)}
                    className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Funding
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </SponsorLayout>
  );
}
