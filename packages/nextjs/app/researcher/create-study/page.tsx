/**
 * Create Clinical Study Page
 *
 * Researcher portal page for creating new clinical trials
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Beaker,
  DollarSign,
  Users,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { ResearcherLayout } from '@/components/layout';
import { toast } from 'sonner';
import { useAuth } from '@/shared/hooks/useAuth';

export default function CreateStudyPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    step: number;
    message: string;
    hash?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    region: '',
    compensation: '',

    // Funding
    totalFunding: '',
    paymentPerParticipant: '',
    requiredAppointments: 5,

    // Eligibility Criteria - Age (✅ ZK Proof Available: Halo2/Plonk + Mopro WASM)
    minAge: 18,
    maxAge: 65,
    requiresAgeProof: true,

    // Eligibility Criteria - Medical (✅ ZK Proof Available: Groth16 + Circom)
    requiredDiagnoses: [] as string[],
    excludedDiagnoses: [] as string[],
    requiredBiomarkers: [] as string[],
    requiredVitals: [] as string[],
    medicalAllergies: [] as string[],

    // Future Criteria (⚠️ ZK Proof NOT Available - for demo only)
    requiredMedications: [] as string[],
    excludedMedications: [] as string[],
    minBMI: '',
    maxBMI: '',
    smokingStatus: 'any' as 'any' | 'smoker' | 'non-smoker' | 'former-smoker',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Wallet Not Connected', {
        description: 'Please connect your wallet first to create a study',
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate max participants
      const maxParticipants = Math.floor(
        Number(formData.totalFunding) / Number(formData.paymentPerParticipant)
      );

      // Show loading toast
      const loadingToast = toast.loading('Validating study parameters...', {
        description: 'Preparing blockchain transactions',
      });

      // Step 1: Validate study parameters via API
      const validationResponse = await fetch('/api/studies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxParticipants,
          creatorAddress: address,
        }),
      });

      if (!validationResponse.ok) {
        const error = await validationResponse.json();
        throw new Error(error.details || 'Validation failed');
      }

      const validationResult = await validationResponse.json();

      if (!validationResult.success) {
        throw new Error('Study validation failed');
      }

      toast.dismiss(loadingToast);

      // Step 2: Execute blockchain transactions via user's wallet
      setTxStatus({ step: 1, message: 'Preparing blockchain transactions...' });

      // Import contracts and viem
      const { createPublicClient, createWalletClient, http, custom } = await import('viem');
      const { optimismSepolia } = await import('viem/chains');
      const deployedContracts = await import('@/contracts/deployedContracts');

      // Get contract addresses and ABIs
      const escrowContract = deployedContracts.default[11155420].ResearchFundingEscrow;
      const registryContract = deployedContracts.default[11155420].StudyRegistry;

      if (!escrowContract || !registryContract) {
        throw new Error('Contracts not deployed on Optimism Sepolia');
      }

      // Create public client
      const publicClient = createPublicClient({
        chain: optimismSepolia,
        transport: http(),
      });

      // Create wallet client from connected wallet
      const walletClient = createWalletClient({
        account: address,
        chain: optimismSepolia,
        transport: custom((window as any).ethereum),
      });

      const { studyParams } = validationResult.data;

      // Transaction 1: Create study in escrow
      setTxStatus({ step: 1, message: 'Transaction 1/4: Creating escrow...' });

      const escrowHash = await walletClient.writeContract({
        address: escrowContract.address as `0x${string}`,
        abi: escrowContract.abi,
        functionName: 'createStudy',
        args: [
          studyParams.title,
          studyParams.description,
          studyParams.certifiedProviders,
          BigInt(studyParams.maxParticipants),
        ],
      });

      setTxStatus({ step: 1, message: 'Waiting for confirmation...', hash: escrowHash });
      const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowHash });
      const escrowStudyId = escrowReceipt.logs[0]?.topics[1]
        ? parseInt(escrowReceipt.logs[0].topics[1], 16)
        : null;

      // Transaction 2: Publish to registry
      setTxStatus({ step: 2, message: 'Transaction 2/4: Publishing to registry...' });

      const registryHash = await walletClient.writeContract({
        address: registryContract.address as `0x${string}`,
        abi: registryContract.abi,
        functionName: 'publishStudy',
        args: [
          studyParams.region,
          studyParams.compensation,
          `ipfs://metadata/${escrowStudyId}`,
        ],
      });

      setTxStatus({ step: 2, message: 'Waiting for confirmation...', hash: registryHash });
      const registryReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });
      const registryStudyId = registryReceipt.logs[0]?.topics[1]
        ? parseInt(registryReceipt.logs[0].topics[1], 16)
        : null;

      // Transaction 3: Set eligibility criteria
      setTxStatus({ step: 3, message: 'Transaction 3/4: Setting eligibility criteria...' });

      const criteriaHash = await walletClient.writeContract({
        address: registryContract.address as `0x${string}`,
        abi: registryContract.abi,
        functionName: 'setStudyCriteria',
        args: [
          BigInt(registryStudyId!),
          Number(studyParams.minAge), // uint32 in contract
          Number(studyParams.maxAge), // uint32 in contract
          BigInt(studyParams.eligibilityCodeHash), // uint256 in contract
        ],
      });

      setTxStatus({ step: 3, message: 'Waiting for confirmation...', hash: criteriaHash });
      const criteriaReceipt = await publicClient.waitForTransactionReceipt({ hash: criteriaHash });

      // Transaction 4: Add Milestones
      setTxStatus({ step: 4, message: `Adding ${formData.requiredAppointments} milestones...` });

      const rewardPerAppointment = Math.floor(
        (Number(formData.paymentPerParticipant) / formData.requiredAppointments) * 1e6 // Convert to USDC (6 decimals)
      );

      const milestoneTxHashes: string[] = [];
      const milestoneTypes = ['Initial Visit', 'Follow-up Visit', 'Follow-up Visit', 'Follow-up Visit', 'Study Completion'];

      for (let i = 0; i < formData.requiredAppointments; i++) {
        const milestoneIndex = i + 1;
        const milestoneType = i === 0 ? 0 : (i === formData.requiredAppointments - 1 ? 3 : 2);
        const description = milestoneTypes[Math.min(i, milestoneTypes.length - 1)];

        setTxStatus({
          step: 4,
          message: `Adding milestone ${milestoneIndex}/${formData.requiredAppointments}: ${description}...`
        });

        const milestoneHash = await walletClient.writeContract({
          address: escrowContract.address as `0x${string}`,
          abi: escrowContract.abi,
          functionName: 'addMilestone',
          args: [
            BigInt(escrowStudyId!),
            milestoneType,
            description,
            BigInt(rewardPerAppointment),
          ],
        });

        setTxStatus({
          step: 4,
          message: `Waiting for milestone ${milestoneIndex}/${formData.requiredAppointments} confirmation...`,
          hash: milestoneHash
        });

        await publicClient.waitForTransactionReceipt({ hash: milestoneHash });
        milestoneTxHashes.push(milestoneHash);
      }

      // Success! Show toast immediately with Etherscan link
      toast.success('Study Created Successfully!', {
        description: `Study ID: ${escrowStudyId} | Max Participants: ${maxParticipants}`,
        duration: 5000,
        action: {
          label: 'View on Etherscan',
          onClick: () => {
            window.open(
              `https://sepolia-optimism.etherscan.io/tx/${escrowHash}`,
              '_blank'
            );
          },
        },
      });

      // Index the study in our database for fast lookups (non-blocking)
      setTxStatus({ step: 5, message: 'Indexing study data...' });

      try {
        // 1. Index the study
        const indexResponse = await fetch('/api/studies/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registryId: registryStudyId!,
            escrowId: escrowStudyId!,
            title: formData.title,
            description: formData.description,
            researcherAddress: address,
            escrowTxHash: escrowHash,
            registryTxHash: registryHash,
            criteriaTxHash: criteriaHash,
            escrowBlockNumber: escrowReceipt.blockNumber.toString(),
            registryBlockNumber: registryReceipt.blockNumber.toString(),
            chainId: 11155420,
          }),
        });

        const indexResult = await indexResponse.json();

        if (!indexResult.success) {
          console.warn('[Study Creation] Failed to index study:', indexResult.error);
          throw new Error('Failed to index study');
        }

        const studyId = indexResult.data.id;
        console.log('[Study Creation] Study indexed successfully:', indexResult.data);

        // 2. Index study criteria
        setTxStatus({ step: 5, message: 'Indexing eligibility criteria...' });

        const eligibilityCodeHash = studyParams.eligibilityCodeHash;

        const criteriaIndexResponse = await fetch(`/api/studies/${studyId}/criteria/index`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            escrowId: escrowStudyId!,
            minAge: formData.minAge,
            maxAge: formData.maxAge,
            eligibilityCodeHash,
            transactionHash: criteriaHash,
            blockNumber: criteriaReceipt.blockNumber.toString(),
          }),
        });

        const criteriaIndexResult = await criteriaIndexResponse.json();

        if (!criteriaIndexResult.success) {
          console.warn('[Study Creation] Failed to index criteria:', criteriaIndexResult.error);
        } else {
          console.log('[Study Creation] Criteria indexed successfully');
        }

        // 3. Index milestones
        setTxStatus({ step: 5, message: 'Indexing milestones...' });

        const milestoneData = await Promise.all(
          milestoneTxHashes.map(async (txHash, index) => {
            const receipt = await publicClient.getTransactionReceipt({
              hash: txHash as `0x${string}`
            });
            const milestoneType = index === 0 ? 0 : (index === formData.requiredAppointments - 1 ? 3 : 2);
            const description = milestoneTypes[Math.min(index, milestoneTypes.length - 1)];

            return {
              milestoneId: index,
              milestoneType,
              description,
              rewardAmount: rewardPerAppointment.toString(),
              transactionHash: txHash,
              blockNumber: receipt.blockNumber.toString(),
            };
          })
        );

        const milestonesIndexResponse = await fetch(`/api/studies/${studyId}/milestones/index`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            escrowId: escrowStudyId!,
            milestones: milestoneData,
          }),
        });

        const milestonesIndexResult = await milestonesIndexResponse.json();

        if (!milestonesIndexResult.success) {
          console.warn('[Study Creation] Failed to index milestones:', milestonesIndexResult.error);
        } else {
          console.log('[Study Creation] Milestones indexed successfully:', milestonesIndexResult.milestones?.length);
        }

      } catch (indexError) {
        console.error('[Study Creation] Error indexing data:', indexError);
        // Continue anyway - study exists on blockchain
      }

      // Keep overlay visible and redirect quickly
      // Note: We use escrowStudyId because that's where the full study data is stored
      setTimeout(() => {
        router.push(`/researcher/studies/${escrowStudyId}`);
      }, 1000);

      // Reset form
      setFormData({
        title: '',
        description: '',
        region: '',
        compensation: '',
        totalFunding: '',
        paymentPerParticipant: '',
        requiredAppointments: 5,
        minAge: 18,
        maxAge: 65,
        requiresAgeProof: true,
        requiredDiagnoses: [],
        excludedDiagnoses: [],
        requiredBiomarkers: [],
        requiredVitals: [],
        medicalAllergies: [],
        requiredMedications: [],
        excludedMedications: [],
        minBMI: '',
        maxBMI: '',
        smokingStatus: 'any',
      });

    } catch (error: any) {
      console.error('Error creating study:', error);
      setTxStatus(null);
      toast.error('Failed to Create Study', {
        description: error?.message || 'An unexpected error occurred. Check console for details.',
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const maxParticipants = formData.totalFunding && formData.paymentPerParticipant
    ? Math.floor(Number(formData.totalFunding) / Number(formData.paymentPerParticipant))
    : 0;

  return (
    <ResearcherLayout>
      {/* Transaction Progress Overlay */}
      <AnimatePresence>
        {txStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="text-center space-y-6">
                {/* Progress Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      {txStatus.step === 5 ? (
                        <CheckCircle2 className="h-10 w-10 text-success animate-bounce" />
                      ) : (
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      )}
                    </div>
                    {txStatus.step <= 4 && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {txStatus.step}/4
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Message */}
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {txStatus.step === 5 ? 'Study Created Successfully!' : 'Creating Study...'}
                  </h3>
                  <p className="text-muted-foreground">{txStatus.message}</p>
                </div>

                {/* Transaction Hash */}
                {txStatus.hash && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Transaction Hash:</p>
                    <a
                      href={`https://sepolia-optimism.etherscan.io/tx/${txStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-mono"
                    >
                      {txStatus.hash.slice(0, 10)}...{txStatus.hash.slice(-8)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Progress Steps */}
                <div className="space-y-2 pt-4">
                  {[
                    { step: 1, label: 'Create Escrow' },
                    { step: 2, label: 'Publish to Registry' },
                    { step: 3, label: 'Set Criteria' },
                    { step: 4, label: 'Add Milestones' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        txStatus.step > item.step
                          ? 'bg-success/10 text-success'
                          : txStatus.step === item.step
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {txStatus.step > item.step ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      ) : txStatus.step === item.step ? (
                        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {txStatus.step === 5 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-sm text-success font-medium">
                      ✓ All transactions confirmed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Redirecting to study details...
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Beaker className="h-8 w-8 text-success" />
            Create Clinical Study
          </h1>
          <p className="text-muted-foreground">
            Define your study criteria and funding parameters. All applicants will apply anonymously using ZK proofs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Study Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Type 2 Diabetes Treatment Study"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the study, methodology, and objectives..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Region *
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., North America, Europe, Global"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Compensation Description *
                  </label>
                  <input
                    type="text"
                    value={formData.compensation}
                    onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                    placeholder="e.g., $500/month for 6 months"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Funding Parameters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-accent" />
              Funding & Payments
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total Funding (USDC) *
                  </label>
                  <input
                    type="number"
                    value={formData.totalFunding}
                    onChange={(e) => setFormData({ ...formData, totalFunding: e.target.value })}
                    placeholder="10000"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Total amount to deposit in escrow</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment per Participant (USDC) *
                  </label>
                  <input
                    type="number"
                    value={formData.paymentPerParticipant}
                    onChange={(e) => setFormData({ ...formData, paymentPerParticipant: e.target.value })}
                    placeholder="250"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Amount per successful completion</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Required Appointments *
                  </label>
                  <input
                    type="number"
                    value={formData.requiredAppointments}
                    onChange={(e) => setFormData({ ...formData, requiredAppointments: Number(e.target.value) })}
                    min="1"
                    max="20"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Appointments to complete</p>
                </div>
              </div>

              {/* Calculated Stats */}
              {maxParticipants > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Calculated Parameters:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Max Participants</p>
                        <p className="text-2xl font-bold">{maxParticipants}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Appointments</p>
                        <p className="text-2xl font-bold">{maxParticipants * formData.requiredAppointments}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cost per Appointment</p>
                        <p className="text-2xl font-bold">
                          ${(Number(formData.paymentPerParticipant) / formData.requiredAppointments).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Eligibility Criteria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Eligibility Criteria
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Age *
                  </label>
                  <input
                    type="number"
                    value={formData.minAge}
                    onChange={(e) => setFormData({ ...formData, minAge: Number(e.target.value) })}
                    min="0"
                    max="120"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maximum Age *
                  </label>
                  <input
                    type="number"
                    value={formData.maxAge}
                    onChange={(e) => setFormData({ ...formData, maxAge: Number(e.target.value) })}
                    min="0"
                    max="120"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="requiresAgeProof"
                  checked={formData.requiresAgeProof}
                  onChange={(e) => setFormData({ ...formData, requiresAgeProof: e.target.checked })}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <label htmlFor="requiresAgeProof" className="text-sm font-medium flex-1">
                  Require ZK age proof (anonymous verification)
                </label>
              </div>

              {formData.requiresAgeProof && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-success">
                    Applicants will prove they meet age requirements using Zero-Knowledge Proofs without revealing their exact age or identity.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Study...
                </>
              ) : (
                <>
                  <Beaker className="h-5 w-5" />
                  Create Study & Fund Escrow
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </motion.div>

          {/* Info Box */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-warning mb-2">Next Steps After Creation:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-warning">
                  <li>Study will be published on-chain to StudyRegistry contract on Optimism Sepolia</li>
                  <li>Escrow will be funded with {formData.totalFunding || '___'} USDC</li>
                  <li>Patients can browse and apply anonymously using ZK proofs</li>
                  <li>You'll see verified applicant count (without identities)</li>
                  <li>Payments released automatically after participants complete {formData.requiredAppointments} appointments</li>
                </ol>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ResearcherLayout>
  );
}
