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
    details?: string; // Additional details for indexing
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

    // Eligibility Criteria - Age (✅ ZK Proof Available: Halo2/PLONK + Mopro WASM, Off-chain)
    minAge: 18,
    maxAge: 65,
    requiresAgeProof: true,

    // Eligibility Criteria - Medical (✅ ZK Proof Available: Circom/Groth16, On-chain OP Sepolia)
    eligibilityCodeHash: '0', // Will be computed from patient data + criteria
    requiresEligibilityProof: true, // Enable by default for demo

    // Medical Criteria - Biomarkers
    hba1c: { enabled: false, min: '', max: '' },
    cholesterol: { enabled: false, min: '', max: '' },
    ldl: { enabled: false, min: '', max: '' },
    hdl: { enabled: false, min: '', max: '' },
    triglycerides: { enabled: false, min: '', max: '' },

    // Medical Criteria - Vital Signs
    systolicBP: { enabled: false, min: '', max: '' },
    diastolicBP: { enabled: false, min: '', max: '' },
    bmi: { enabled: false, min: '', max: '' },
    heartRate: { enabled: false, min: '', max: '' },

    // Medical Criteria - Medications & Allergies
    requiredMedications: [] as string[],
    excludedMedications: [] as string[],
    excludedAllergies: [] as string[],

    // Medical Criteria - Diagnoses (ICD-10)
    requiredDiagnoses: [] as string[],
    excludedDiagnoses: [] as string[],
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ethereum = (window as any).ethereum;
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: optimismSepolia,
        transport: custom(ethereum),
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
        account: address as `0x${string}`,
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
        account: address as `0x${string}`,
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
        account: address as `0x${string}`,
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
          account: address as `0x${string}`,
        });

        setTxStatus({
          step: 4,
          message: `Waiting for milestone ${milestoneIndex}/${formData.requiredAppointments} confirmation...`,
          hash: milestoneHash
        });

        await publicClient.waitForTransactionReceipt({ hash: milestoneHash });
        milestoneTxHashes.push(milestoneHash);
      }

      // Show toast for blockchain success
      toast.success('Blockchain Transactions Complete!', {
        description: `Study ID: ${escrowStudyId} | Now indexing to database...`,
        duration: 3000,
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

      // Index the study in our database (MUST complete before redirect)
      setTxStatus({ step: 5, message: 'Indexing study to database...' });

      try {
        // 1. Index the study - WAIT for this to complete
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

        if (!indexResponse.ok) {
          throw new Error(`Failed to index study: HTTP ${indexResponse.status}`);
        }

        const indexResult = await indexResponse.json();

        if (!indexResult.success) {
          console.error('[Study Creation] Failed to index study:', indexResult.error);
          throw new Error(indexResult.error || 'Failed to index study');
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
            // Include medical criteria details if eligibility proof is required
            medicalCriteria: formData.requiresEligibilityProof ? {
              hba1c: formData.hba1c,
              cholesterol: formData.cholesterol,
              ldl: formData.ldl,
              hdl: formData.hdl,
              triglycerides: formData.triglycerides,
              systolicBP: formData.systolicBP,
              diastolicBP: formData.diastolicBP,
              bmi: formData.bmi,
              heartRate: formData.heartRate,
              requiredMedications: formData.requiredMedications,
              excludedMedications: formData.excludedMedications,
              excludedAllergies: formData.excludedAllergies,
              requiredDiagnoses: formData.requiredDiagnoses,
              excludedDiagnoses: formData.excludedDiagnoses,
            } : null,
          }),
        });

        if (!criteriaIndexResponse.ok) {
          throw new Error(`Failed to index criteria: HTTP ${criteriaIndexResponse.status}`);
        }

        const criteriaIndexResult = await criteriaIndexResponse.json();

        if (!criteriaIndexResult.success) {
          console.error('[Study Creation] Failed to index criteria:', criteriaIndexResult.error);
          throw new Error(criteriaIndexResult.error || 'Failed to index criteria');
        }

        console.log('[Study Creation] Criteria indexed successfully');

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

        if (!milestonesIndexResponse.ok) {
          throw new Error(`Failed to index milestones: HTTP ${milestonesIndexResponse.status}`);
        }

        const milestonesIndexResult = await milestonesIndexResponse.json();

        if (!milestonesIndexResult.success) {
          console.error('[Study Creation] Failed to index milestones:', milestonesIndexResult.error);
          throw new Error(milestonesIndexResult.error || 'Failed to index milestones');
        }

        console.log('[Study Creation] Milestones indexed successfully:', milestonesIndexResult.milestones?.length);

        // ALL indexing completed successfully - now show success and redirect
        setTxStatus({
          step: 5,
          message: 'Study created and indexed successfully! Redirecting...',
        });

        toast.success('Study Created Successfully!', {
          description: `Study #${escrowStudyId} is now live and ready for patient applications.`,
          duration: 3000,
        });

        // Redirect to the study detail page after brief delay
        // Note: We use escrowStudyId because that's where the full study data is stored
        setTimeout(() => {
          router.push(`/researcher/studies/${escrowStudyId}`);
        }, 1500);

      } catch (indexError: unknown) {
        console.error('[Study Creation] Error indexing data:', indexError);
        setTxStatus(null);

        // Show error to user - do NOT redirect since indexing failed
        toast.error('Failed to Index Study', {
          description: `Blockchain transactions succeeded, but failed to index study in database: ${indexError instanceof Error ? indexError.message : String(indexError)}. Please contact support with Study ID: ${escrowStudyId}`,
          duration: 10000,
        });

        // Re-throw to prevent redirect and show error state
        throw indexError;
      }

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
        eligibilityCodeHash: '0',
        requiresEligibilityProof: false,
        hba1c: { enabled: false, min: '', max: '' },
        cholesterol: { enabled: false, min: '', max: '' },
        ldl: { enabled: false, min: '', max: '' },
        hdl: { enabled: false, min: '', max: '' },
        triglycerides: { enabled: false, min: '', max: '' },
        systolicBP: { enabled: false, min: '', max: '' },
        diastolicBP: { enabled: false, min: '', max: '' },
        bmi: { enabled: false, min: '', max: '' },
        heartRate: { enabled: false, min: '', max: '' },
        requiredMedications: [],
        excludedMedications: [],
        excludedAllergies: [],
        requiredDiagnoses: [],
        excludedDiagnoses: [],
      });

    } catch (error: unknown) {
      console.error('Error creating study:', error);
      setTxStatus(null);
      toast.error('Failed to Create Study', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Check console for details.',
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

          {/* Eligibility Criteria - Age (Off-chain ZK) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-success/30 bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="h-6 w-6 text-success" />
                Age Verification (Off-Chain)
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-success">ZK Proof Available</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Age Range - ZK Verified */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold">Age Requirements</h3>
                  <div className="px-2 py-0.5 rounded bg-success/10 text-success text-xs font-medium">
                    Halo2 + PLONK
                  </div>
                </div>

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
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-success"
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
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-success"
                      required
                    />
                  </div>
                </div>

                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-success">
                        Anonymous Age Verification with Zero-Knowledge Proofs
                      </p>
                      <ul className="text-xs text-success space-y-1">
                        <li>• Patients prove age range without revealing exact age</li>
                        <li>• Generated client-side in browser extension (33-60ms)</li>
                        <li>• Verified cryptographically on Optimism Sepolia</li>
                        <li>• No personal data leaves patient&apos;s device</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Eligibility Criteria - Medical (On-chain ZK) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-primary/30 bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Medical Eligibility (On-Chain)
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">ZK Proof Available</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable Medical Eligibility */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold">Medical Criteria Verification</h3>
                  <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                    Circom + Groth16
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="requiresEligibilityProof"
                    checked={formData.requiresEligibilityProof}
                    onChange={(e) => setFormData({ ...formData, requiresEligibilityProof: e.target.checked })}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="requiresEligibilityProof" className="text-sm font-medium flex-1">
                    Require medical eligibility proof (verified on-chain)
                  </label>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-primary">
                        Trustless Medical Verification with Zero-Knowledge Proofs
                      </p>
                      <ul className="text-xs text-primary space-y-1">
                        <li>• Patients prove medical eligibility without revealing exact health data</li>
                        <li>• Generated in browser extension using Circom + Groth16 (2-5s)</li>
                        <li>• <strong>Verified on-chain</strong> in Optimism Sepolia smart contract</li>
                        <li>• Supports: biomarkers (HbA1c, cholesterol), vitals (BP, BMI), diagnoses (ICD-10)</li>
                        <li>• Verifier deployed: <code className="text-xs">0x1BBc9BD...1C0Dd</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Criteria Form - Only shown when enabled */}
              {formData.requiresEligibilityProof && (
                <>
                  {/* Biomarkers Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary">Biomarker Criteria</h3>

                    {/* HbA1c */}
                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={formData.hba1c.enabled}
                          onChange={(e) => setFormData({ ...formData, hba1c: { ...formData.hba1c, enabled: e.target.checked } })}
                          className="w-4 h-4"
                        />
                        <label className="font-medium">HbA1c (Hemoglobin A1c)</label>
                        <span className="text-xs text-muted-foreground">(%)</span>
                      </div>
                      {formData.hba1c.enabled && (
                        <div className="grid grid-cols-2 gap-3 ml-6">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Minimum</label>
                            <input
                              type="number"
                              value={formData.hba1c.min}
                              onChange={(e) => setFormData({ ...formData, hba1c: { ...formData.hba1c, min: e.target.value } })}
                              placeholder="7.0"
                              step="0.1"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Maximum</label>
                            <input
                              type="number"
                              value={formData.hba1c.max}
                              onChange={(e) => setFormData({ ...formData, hba1c: { ...formData.hba1c, max: e.target.value } })}
                              placeholder="10.0"
                              step="0.1"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LDL Cholesterol */}
                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={formData.ldl.enabled}
                          onChange={(e) => setFormData({ ...formData, ldl: { ...formData.ldl, enabled: e.target.checked } })}
                          className="w-4 h-4"
                        />
                        <label className="font-medium">LDL Cholesterol</label>
                        <span className="text-xs text-muted-foreground">(mg/dL)</span>
                      </div>
                      {formData.ldl.enabled && (
                        <div className="grid grid-cols-2 gap-3 ml-6">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Minimum</label>
                            <input
                              type="number"
                              value={formData.ldl.min}
                              onChange={(e) => setFormData({ ...formData, ldl: { ...formData.ldl, min: e.target.value } })}
                              placeholder="0"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Maximum</label>
                            <input
                              type="number"
                              value={formData.ldl.max}
                              onChange={(e) => setFormData({ ...formData, ldl: { ...formData.ldl, max: e.target.value } })}
                              placeholder="130"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vital Signs Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary">Vital Signs Criteria</h3>

                    {/* BMI */}
                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={formData.bmi.enabled}
                          onChange={(e) => setFormData({ ...formData, bmi: { ...formData.bmi, enabled: e.target.checked } })}
                          className="w-4 h-4"
                        />
                        <label className="font-medium">BMI (Body Mass Index)</label>
                        <span className="text-xs text-muted-foreground">(kg/m²)</span>
                      </div>
                      {formData.bmi.enabled && (
                        <div className="grid grid-cols-2 gap-3 ml-6">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Minimum</label>
                            <input
                              type="number"
                              value={formData.bmi.min}
                              onChange={(e) => setFormData({ ...formData, bmi: { ...formData.bmi, min: e.target.value } })}
                              placeholder="25"
                              step="0.1"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Maximum</label>
                            <input
                              type="number"
                              value={formData.bmi.max}
                              onChange={(e) => setFormData({ ...formData, bmi: { ...formData.bmi, max: e.target.value } })}
                              placeholder="40"
                              step="0.1"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Systolic BP */}
                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={formData.systolicBP.enabled}
                          onChange={(e) => setFormData({ ...formData, systolicBP: { ...formData.systolicBP, enabled: e.target.checked } })}
                          className="w-4 h-4"
                        />
                        <label className="font-medium">Systolic Blood Pressure</label>
                        <span className="text-xs text-muted-foreground">(mmHg)</span>
                      </div>
                      {formData.systolicBP.enabled && (
                        <div className="grid grid-cols-2 gap-3 ml-6">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Minimum</label>
                            <input
                              type="number"
                              value={formData.systolicBP.min}
                              onChange={(e) => setFormData({ ...formData, systolicBP: { ...formData.systolicBP, min: e.target.value } })}
                              placeholder="90"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Maximum</label>
                            <input
                              type="number"
                              value={formData.systolicBP.max}
                              onChange={(e) => setFormData({ ...formData, systolicBP: { ...formData.systolicBP, max: e.target.value } })}
                              placeholder="140"
                              className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Diagnoses Section */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary">Diagnosis Requirements (ICD-10)</h3>

                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <label className="block text-sm font-medium mb-2">Required Diagnoses</label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Patients must have these diagnoses. Common codes: E11.9 (Type 2 Diabetes), I10 (Hypertension)
                      </p>
                      <select
                        className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                        onChange={(e) => {
                          if (e.target.value && !formData.requiredDiagnoses.includes(e.target.value)) {
                            setFormData({
                              ...formData,
                              requiredDiagnoses: [...formData.requiredDiagnoses, e.target.value]
                            });
                          }
                          e.target.value = '';
                        }}
                      >
                        <option value="">-- Select diagnosis to add --</option>
                        <option value="E11.9">E11.9 - Type 2 Diabetes Mellitus</option>
                        <option value="I10">I10 - Essential Hypertension</option>
                        <option value="E78.5">E78.5 - Hyperlipidemia</option>
                        <option value="E66.9">E66.9 - Obesity</option>
                      </select>
                      {formData.requiredDiagnoses.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.requiredDiagnoses.map((dx) => (
                            <div key={dx} className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              <span>{dx}</span>
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  requiredDiagnoses: formData.requiredDiagnoses.filter(d => d !== dx)
                                })}
                                className="hover:text-primary/70"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <label className="block text-sm font-medium mb-2">Excluded Medications</label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Patients must NOT be taking these medications
                      </p>
                      <select
                        className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                        onChange={(e) => {
                          if (e.target.value && !formData.excludedMedications.includes(e.target.value)) {
                            setFormData({
                              ...formData,
                              excludedMedications: [...formData.excludedMedications, e.target.value]
                            });
                          }
                          e.target.value = '';
                        }}
                      >
                        <option value="">-- Select medication to exclude --</option>
                        <option value="WARFARIN">Warfarin (Anticoagulant)</option>
                        <option value="INSULIN">Insulin</option>
                        <option value="METFORMIN">Metformin</option>
                        <option value="ASPIRIN">Aspirin</option>
                      </select>
                      {formData.excludedMedications.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.excludedMedications.map((med) => (
                            <div key={med} className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              <span>{med}</span>
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  excludedMedications: formData.excludedMedications.filter(m => m !== med)
                                })}
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-background/50">
                      <label className="block text-sm font-medium mb-2">Excluded Allergies</label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Patients must NOT have these allergies (ensures they can safely take study drug)
                      </p>
                      <select
                        className="w-full px-3 py-2 text-sm rounded border border-border bg-background"
                        onChange={(e) => {
                          if (e.target.value && !formData.excludedAllergies.includes(e.target.value)) {
                            setFormData({
                              ...formData,
                              excludedAllergies: [...formData.excludedAllergies, e.target.value]
                            });
                          }
                          e.target.value = '';
                        }}
                      >
                        <option value="">-- Select allergy to exclude --</option>
                        <option value="PENICILLIN">Penicillin</option>
                        <option value="SULFA">Sulfa Drugs</option>
                        <option value="METFORMIN">Metformin</option>
                        <option value="STATINS">Statins</option>
                      </select>
                      {formData.excludedAllergies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.excludedAllergies.map((allergy) => (
                            <div key={allergy} className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              <span>{allergy}</span>
                              <button
                                type="button"
                                onClick={() => setFormData({
                                  ...formData,
                                  excludedAllergies: formData.excludedAllergies.filter(a => a !== allergy)
                                })}
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Working Combinations Warning */}
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-warning">
                          Validated Criteria Combinations for Demo
                        </p>
                        <div className="text-xs text-warning space-y-2">
                          <p><strong>For your demo video, use this combination (verified working):</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>HbA1c: 7.0 - 10.0%</li>
                            <li>LDL: 0 - 130 mg/dL</li>
                            <li>BMI: 25 - 40</li>
                            <li>Required Diagnosis: E11.9 (Type 2 Diabetes)</li>
                            <li>Excluded Medication: WARFARIN</li>
                            <li>Excluded Allergy: METFORMIN</li>
                          </ul>
                          <p className="mt-2 italic">
                            This exact combination is tested and generates valid ZK proofs. The circuit computes Poseidon hashes for each category.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
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
                  <li>You&apos;ll see verified applicant count (without identities)</li>
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
