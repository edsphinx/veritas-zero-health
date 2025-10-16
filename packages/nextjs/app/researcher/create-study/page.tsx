/**
 * Create Clinical Study Page
 *
 * Researcher portal page for creating new clinical trials
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import {
  Beaker,
  DollarSign,
  Users,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ResearcherLayout } from '@/components/layout';
import { toast } from 'sonner';

export default function CreateStudyPage() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);

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

    // Eligibility Criteria
    minAge: 18,
    maxAge: 65,
    requiresAgeProof: true,
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
      toast.loading('Creating study on blockchain...', {
        description: 'Please confirm the transactions in your wallet',
        id: 'blockchain-tx',
      });

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
      toast.loading('Transaction 1/3: Creating escrow...', { id: 'blockchain-tx' });

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

      const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowHash });
      const escrowStudyId = escrowReceipt.logs[0]?.topics[1]
        ? parseInt(escrowReceipt.logs[0].topics[1], 16)
        : null;

      // Transaction 2: Publish to registry
      toast.loading('Transaction 2/3: Publishing to registry...', { id: 'blockchain-tx' });

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

      const registryReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });
      const registryStudyId = registryReceipt.logs[0]?.topics[1]
        ? parseInt(registryReceipt.logs[0].topics[1], 16)
        : null;

      // Transaction 3: Set eligibility criteria
      toast.loading('Transaction 3/3: Setting eligibility criteria...', { id: 'blockchain-tx' });

      const criteriaHash = await walletClient.writeContract({
        address: registryContract.address as `0x${string}`,
        abi: registryContract.abi,
        functionName: 'setStudyCriteria',
        args: [
          BigInt(registryStudyId!),
          studyParams.minAge,
          studyParams.maxAge,
          studyParams.eligibilityCodeHash,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash: criteriaHash });

      // Dismiss loading toast
      toast.dismiss('blockchain-tx');

      // Show success toast
      toast.success('Study Created Successfully!', {
        description: `Escrow ID: ${escrowStudyId} | Registry ID: ${registryStudyId} | Max Participants: ${maxParticipants}`,
        duration: 8000,
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
      });

    } catch (error: any) {
      console.error('Error creating study:', error);
      toast.dismiss('blockchain-tx');
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
