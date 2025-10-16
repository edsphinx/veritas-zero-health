'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Lock,
  AlertCircle,
  Loader2,
  Shield,
  DollarSign,
  Users,
  FlaskConical,
} from 'lucide-react';
import { PatientLayout } from '@/components/layout';
import type { Study, StudyMilestone as _StudyMilestone, StudyStatus as _StudyStatus2 } from '@veritas/types';

// Extended milestone interface for mock data (the canonical type uses different field structure)
interface Milestone {
  id: number;
  studyId: number;
  milestoneType: string;
  description: string;
  rewardAmount: string;
  status: string;
  createdAt: number;
  completedAt: number;
  verifiedAt: number;
}

// Extended Study interface for this page's mock data
interface StudyWithMockData extends Omit<Study, 'id' | 'status' | 'createdAt' | 'milestones'> {
  id: number; // Mock uses number instead of UUID string
  sponsor: string;
  certifiedProviders: string[];
  status: string; // Mock uses string directly
  totalFunding: string;
  remainingFunding: string;
  participantCount: number;
  maxParticipants: number;
  createdAt: number; // Mock uses timestamp
  startedAt: number;
  completedAt: number;
  milestones: Milestone[];
}

export default function StudyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const studyId = params?.studyId as string;

  const [study, setStudy] = useState<StudyWithMockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<
    'idle' | 'generating' | 'submitting' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (studyId) {
      loadStudy();
    }
  }, [studyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/studies/${studyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch study');
      }

      const data = await response.json();
      setStudy(data);
    } catch (error) {
      console.error('Error loading study:', error);
      setErrorMessage('Failed to load study details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalReward = () => {
    if (!study) return 0;
    return study.milestones.reduce((sum, m) => sum + Number(m.rewardAmount), 0);
  };

  const handleApplyWithZKProof = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setApplying(true);
      setApplicationStatus('generating');
      setErrorMessage('');

      // Build deep link message for extension
      const deepLinkData = {
        action: 'generate-zk-proof',
        studyId: studyId,
        criteria: {
          minAge: 18, // TODO: Fetch from StudyRegistry contract
          maxAge: 65,
        },
        returnUrl: window.location.href,
      };

      // Option 1: Use postMessage to communicate with extension
      window.postMessage(
        {
          type: 'VERITAS_GENERATE_PROOF',
          data: deepLinkData,
        },
        '*'
      );

      // Listen for proof response from extension
      const handleProofResponse = async (event: MessageEvent) => {
        if (event.data?.type === 'VERITAS_PROOF_GENERATED') {
          const { proof, publicInputs, proofTime } = event.data.data;

          console.log('✅ Received ZK proof from extension');
          console.log(`  - Proof generation time: ${proofTime}ms`);

          setApplicationStatus('submitting');

          // Submit proof to backend
          const response = await fetch(`/api/studies/${studyId}/apply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              proof,
              publicInputs,
              proofTime,
              applicantAddress: address,
            }),
          });

          const result = await response.json();

          if (result.success) {
            setApplicationStatus('success');
            console.log('✅ Application submitted successfully');
            console.log(`  - Transaction: ${result.transactionHash}`);

            // Reload study to update applicant count
            setTimeout(() => {
              loadStudy();
              setApplicationStatus('idle');
              setApplying(false);
            }, 3000);
          } else {
            throw new Error(result.error || 'Application failed');
          }

          window.removeEventListener('message', handleProofResponse);
        } else if (event.data?.type === 'VERITAS_PROOF_ERROR') {
          throw new Error(event.data.error || 'Proof generation failed');
        }
      };

      window.addEventListener('message', handleProofResponse);

      // Timeout after 60 seconds
      setTimeout(() => {
        if (applicationStatus === 'generating') {
          window.removeEventListener('message', handleProofResponse);
          setApplicationStatus('error');
          setErrorMessage(
            'Timeout: Extension did not respond. Make sure the Veritas extension is installed and enabled.'
          );
          setApplying(false);
        }
      }, 60000);
    } catch (error: unknown) {
      console.error('Error applying to study:', error);
      setApplicationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error) || 'Failed to apply to study');
      setApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'border-green-600/20 bg-green-600/10 text-green-600',
      Funding: 'border-blue-600/20 bg-blue-600/10 text-blue-600',
      Created: 'border-gray-600/20 bg-gray-600/10 text-gray-600',
      Paused: 'border-amber-600/20 bg-amber-600/10 text-amber-600',
      Completed: 'border-purple-600/20 bg-purple-600/10 text-purple-600',
      Cancelled: 'border-red-600/20 bg-red-600/10 text-red-600',
    };
    return colors[status] || 'border-border bg-card';
  };

  if (!isConnected) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto p-8"
          >
            <div className="rounded-full bg-primary/10 p-4 w-fit mx-auto mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view study details and apply
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              Connect Wallet
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </motion.div>
        </div>
      </PatientLayout>
    );
  }

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading study details...</p>
          </motion.div>
        </div>
      </PatientLayout>
    );
  }

  if (!study) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto p-8"
          >
            <div className="rounded-full bg-red-600/10 p-4 w-fit mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Study Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage || 'The study you are looking for does not exist'}
            </p>
            <Link
              href="/patient/studies"
              className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Studies
            </Link>
          </motion.div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/patient/studies"
            className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Studies
          </Link>
        </motion.div>

        {/* Study Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary mb-3"
              >
                <FlaskConical className="h-3 w-3" />
                <span>Study #{study.id}</span>
              </motion.div>
              <h1 className="text-4xl font-bold mb-2">{study.title}</h1>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                study.status
              )}`}
            >
              {study.status}
            </span>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">{study.description}</p>

          {/* Study Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Total Funding</p>
              </div>
              <p className="text-2xl font-bold">${study.totalFunding}</p>
              <p className="text-xs text-muted-foreground">USDC</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
              <p className="text-2xl font-bold">
                {study.participantCount} / {study.maxParticipants}
              </p>
              <p className="text-xs text-muted-foreground">
                {study.maxParticipants - study.participantCount} spots left
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-green-600/10 p-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">Total Compensation</p>
              </div>
              <p className="text-2xl font-bold text-green-600">${calculateTotalReward()}</p>
              <p className="text-xs text-muted-foreground">USDC per participant</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Enrollment Progress</span>
              <span className="font-semibold">
                {Math.round((study.participantCount / study.maxParticipants) * 100)}%
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${(study.participantCount / study.maxParticipants) * 100}%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-8 mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">Study Milestones</h2>
          <p className="text-muted-foreground mb-6">
            Complete {study.milestones.length} milestones to earn your full compensation
          </p>

          <div className="space-y-3">
            {study.milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="border border-border rounded-lg p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{milestone.milestoneType}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{milestone.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-green-600 font-bold">${milestone.rewardAmount} USDC</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                        {milestone.status}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Privacy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">
                Anonymous Application with Zero-Knowledge Proofs
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you apply, your browser extension will generate a cryptographic proof that you
                meet the eligibility criteria (age 18-65) WITHOUT revealing your actual age or any
                personal information. The researcher will only see that you qualify - your identity
                remains completely private.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Application Status Messages */}
        {applicationStatus === 'generating' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-amber-600/20 bg-amber-600/10 p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
              <p className="text-amber-600 font-medium">
                Waiting for browser extension to generate ZK proof...
              </p>
            </div>
          </motion.div>
        )}

        {applicationStatus === 'submitting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-blue-600/20 bg-blue-600/10 p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <p className="text-blue-600 font-medium">Submitting proof to blockchain...</p>
            </div>
          </motion.div>
        )}

        {applicationStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-green-600/20 bg-green-600/10 p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-green-600 font-medium">
                Application submitted successfully! Your proof has been verified on-chain.
              </p>
            </div>
          </motion.div>
        )}

        {applicationStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-red-600/20 bg-red-600/10 p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-600 font-semibold">Application Failed</p>
                <p className="text-red-600/80 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Apply Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleApplyWithZKProof}
            disabled={
              applying ||
              study.status !== 'Active' ||
              study.participantCount >= study.maxParticipants
            }
            className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-lg"
          >
            {applying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : study.status !== 'Active' ? (
              'Study Not Accepting Applications'
            ) : study.participantCount >= study.maxParticipants ? (
              'Study Full - No Spots Available'
            ) : (
              'Apply with Zero-Knowledge Proof'
            )}
          </button>

          {/* Extension Install Prompt */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have the Veritas extension?{' '}
              <a href="#" className="text-primary hover:opacity-80 transition-opacity font-semibold">
                Install it here
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
