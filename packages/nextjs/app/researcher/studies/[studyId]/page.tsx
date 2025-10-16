'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock as _Clock,
  DollarSign,
  ExternalLink,
  FileCode,
} from 'lucide-react';
import { ResearcherLayout } from '@/components/layout';
import { useStudy, useVerifiedApplicantsCount } from '@/shared/hooks/useStudy';
import { useAuth } from '@/shared/hooks/useAuth';
import { MedicalCriteriaDisplay } from '@/components/trials/MedicalCriteriaDisplay';
import type { Study, StudyCriteria } from '@veritas/types';

interface Milestone {
  id: number;
  milestoneType: string;
  description: string;
  rewardAmount: string;
  status: string;
}

// Extended Study interface for this page's mock/API data
interface StudyWithMockData extends Omit<Study, 'id' | 'createdAt' | 'milestones'> {
  id: number; // Mock uses number instead of UUID string
  sponsor: string;
  totalFunding: string;
  remainingFunding: string;
  participantCount: number;
  maxParticipants: number;
  milestones: Milestone[];
  criteria?: StudyCriteria | null;
}

interface Applicant {
  applicantNumber: number;
  appliedAt: number;
  verifiedProof: boolean;
  enrolled: boolean;
}

export default function ResearcherStudyDetailPage() {
  const params = useParams();
  const { address: _address, isConnected } = useAuth();
  const studyId = params?.studyId as string;

  const [study, setStudy] = useState<StudyWithMockData | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // Validate studyId is numeric (not "create" or other non-numeric routes)
  const isValidStudyId = studyId && /^\d+$/.test(studyId);

  // Use real blockchain hooks
  const studyIdBigInt = isValidStudyId ? BigInt(studyId) : undefined;
  const { study: _studyOnChain, isLoading: studyLoading } = useStudy(studyIdBigInt);
  const { count: verifiedCount, isLoading: countLoading, refetch } = useVerifiedApplicantsCount(studyIdBigInt);

  const loading = studyLoading || countLoading;
  const verifiedApplicantsCount = verifiedCount ? Number(verifiedCount) : 0;

  useEffect(() => {
    if (studyId) {
      loadStudyData();
    }
  }, [studyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudyData = async () => {
    try {
      // Fetch study details from API (for off-chain data like milestones)
      const studyResponse = await fetch(`/api/studies/${studyId}`);
      if (studyResponse.ok) {
        const studyData = await studyResponse.json();
        if (studyData.success && studyData.data) {
          // Add default values for fields that don&apos;t come from API
          setStudy({
            ...studyData.data,
            totalFunding: studyData.data.totalFunding || '0',
            remainingFunding: studyData.data.remainingFunding || '0',
            participantCount: studyData.data.participantCount || 0,
            maxParticipants: studyData.data.maxParticipants || 0,
            sponsor: studyData.data.sponsor || 'Not funded yet',
          });
        }
      }

      // Fetch real applicants from blockchain events
      const applicationsResponse = await fetch(`/api/studies/${studyId}/applications`);
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        if (applicationsData.success && applicationsData.applications) {
          // Map blockchain data to UI format
          const applicantsList: Applicant[] = applicationsData.applications.map((app: { timestamp: string; [key: string]: unknown }, _index: number) => ({
            applicantNumber: app.applicantNumber,
            appliedAt: app.appliedAt,
            verifiedProof: app.verifiedProof,
            enrolled: false, // TODO: Check enrollment status from StudyEnrollmentData contract
          }));
          setApplicants(applicantsList);
        }
      }
    } catch (error) {
      console.error('Error loading study data:', error);
    }
  };

  // Refetch count when component mounts
  useEffect(() => {
    if (studyIdBigInt) {
      refetch();
    }
  }, [studyIdBigInt, refetch]);

  const _calculateTotalReward = () => {
    if (!study || !study.milestones) return 0;
    return study.milestones.reduce((sum, m) => sum + Number(m.rewardAmount), 0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      Funding: 'bg-blue-100 text-blue-800 border-blue-200',
      Created: 'bg-gray-100 text-gray-800 border-gray-200',
      Completed: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Invalid studyId (like "create")
  if (!isValidStudyId) {
    return (
      <ResearcherLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Study ID</h2>
            <p className="text-gray-600 mb-4">
              The study ID must be a number. If you&apos;re trying to create a study, use the button below.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/researcher/create-study"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Create Study
              </Link>
              <Link
                href="/researcher/studies"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Back to Studies
              </Link>
            </div>
          </div>
        </div>
      </ResearcherLayout>
    );
  }

  if (!isConnected) {
    return (
      <ResearcherLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the researcher dashboard
            </p>
          </div>
        </div>
      </ResearcherLayout>
    );
  }

  if (loading) {
    return (
      <ResearcherLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading study data...</p>
        </div>
      </div>
    </ResearcherLayout>
    );
  }

  if (!study) {
    return (
      <ResearcherLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Study Not Found</h2>
            <Link
              href="/researcher/studies"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← Back to Studies
            </Link>
          </div>
        </div>
      </ResearcherLayout>
    );
  }

  return (
    <ResearcherLayout>
      <div className="max-w-7xl mx-auto p-8">
      {/* Back Button */}
      <Link
        href="/researcher/studies"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Studies
      </Link>

      {/* Study Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{study.title}</h1>
            <p className="text-gray-600 text-sm">Study ID: #{study.id}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
              study.status
            )}`}
          >
            {study.status}
          </span>
        </div>

        <p className="text-gray-700 leading-relaxed mb-6">{study.description}</p>

        {/* Study Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <DollarSign className="h-5 w-5 text-green-600 mb-2" />
            <p className="text-sm text-green-600 mb-1">Total Funding</p>
            <p className="text-2xl font-bold text-green-900">
              ${study.totalFunding} USDC
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <Users className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-sm text-blue-600 mb-1">Enrolled</p>
            <p className="text-2xl font-bold text-blue-900">
              {study.participantCount}/{study.maxParticipants}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <Shield className="h-5 w-5 text-purple-600 mb-2" />
            <p className="text-sm text-purple-600 mb-1">Verified Applicants</p>
            <p className="text-2xl font-bold text-purple-900">
              {verifiedApplicantsCount}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <DollarSign className="h-5 w-5 text-orange-600 mb-2" />
            <p className="text-sm text-orange-600 mb-1">Remaining Budget</p>
            <p className="text-2xl font-bold text-orange-900">
              ${study.remainingFunding} USDC
            </p>
          </div>
        </div>
      </div>

      {/* Blockchain Contracts & Transactions */}
      {(study.escrowTxHash || study.registryTxHash || study.criteriaTxHash) && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileCode className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Blockchain Contracts & Transactions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Study IDs */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Study Identifiers
              </h3>
              <div className="space-y-2 text-sm">
                {study.escrowId !== undefined && (
                  <div>
                    <span className="text-blue-700 font-medium">Escrow ID:</span>
                    <span className="ml-2 text-blue-900 font-mono">#{study.escrowId}</span>
                  </div>
                )}
                {study.registryId !== undefined && (
                  <div>
                    <span className="text-blue-700 font-medium">Registry ID:</span>
                    <span className="ml-2 text-blue-900 font-mono">#{study.registryId}</span>
                  </div>
                )}
                {study.chainId && (
                  <div>
                    <span className="text-blue-700 font-medium">Chain:</span>
                    <span className="ml-2 text-blue-900 font-mono">
                      {study.chainId === 11155420 ? 'Optimism Sepolia' : `Chain ${study.chainId}`}
                    </span>
                  </div>
                )}
                {study.researcherAddress && (
                  <div>
                    <span className="text-blue-700 font-medium">Researcher:</span>
                    <span className="ml-2 text-blue-900 font-mono text-xs">
                      {study.researcherAddress.slice(0, 6)}...{study.researcherAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Addresses */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Smart Contracts
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-purple-700 font-medium">ResearchFundingEscrow</span>
                  <a
                    href={`https://sepolia-optimism.etherscan.io/address/${
                      study.chainId === 11155420
                        ? '0x...'  // TODO: Get from deployedContracts
                        : 'unknown'
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1 mt-1"
                  >
                    <span className="font-mono">View Contract</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">StudyRegistry</span>
                  <a
                    href={`https://sepolia-optimism.etherscan.io/address/${
                      study.chainId === 11155420
                        ? '0x...'  // TODO: Get from deployedContracts
                        : 'unknown'
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1 mt-1"
                  >
                    <span className="font-mono">View Contract</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">EligibilityCodeVerifier</span>
                  <a
                    href="https://sepolia-optimism.etherscan.io/address/0x1BBc9BD3b5b5a2ECB7d99b8b933F866A16bb7B29"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-purple-600 hover:text-purple-800 text-xs flex items-center gap-1 mt-1"
                  >
                    <span className="font-mono">View Contract</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Creation Transactions</h3>
            <div className="space-y-3">
              {study.escrowTxHash && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">1. Create Escrow</p>
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      {study.escrowTxHash.slice(0, 10)}...{study.escrowTxHash.slice(-8)}
                    </p>
                  </div>
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${study.escrowTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {study.registryTxHash && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">2. Publish to Registry</p>
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      {study.registryTxHash.slice(0, 10)}...{study.registryTxHash.slice(-8)}
                    </p>
                  </div>
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${study.registryTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {study.criteriaTxHash && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">3. Set Eligibility Criteria</p>
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      {study.criteriaTxHash.slice(0, 10)}...{study.criteriaTxHash.slice(-8)}
                    </p>
                  </div>
                  <a
                    href={`https://sepolia-optimism.etherscan.io/tx/${study.criteriaTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Criteria Display */}
      {study.criteria && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Eligibility Criteria
          </h2>
          <MedicalCriteriaDisplay criteria={study.criteria} />
        </div>
      )}

      {/* Milestones Overview */}
      {study.milestones && study.milestones.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Study Milestones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {study.milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{milestone.milestoneType}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {milestone.description}
                  </p>
                  <p className="text-green-600 font-bold">
                    ${milestone.rewardAmount} USDC
                  </p>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* Anonymous Applicants */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Anonymous Applicants</h2>
            <p className="text-gray-600 text-sm">
              All applicants have verified their eligibility using Zero-Knowledge Proofs
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">
              {verifiedApplicantsCount}
            </p>
            <p className="text-sm text-gray-600">Verified Proofs</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 leading-relaxed">
                <strong>Privacy Protected:</strong> Applicant identities are anonymous.
                Each applicant has proven they meet your eligibility criteria (age 18-65)
                using cryptographic proofs without revealing personal information. Work
                with certified clinics to enroll eligible participants.
              </p>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        {applicants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No verified applicants yet</p>
            <p className="text-sm mt-2">
              Share your study link with potential participants
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applicants.map((applicant) => (
              <div
                key={applicant.applicantNumber}
                className={`border rounded-lg p-4 ${
                  applicant.enrolled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center">
                      #{applicant.applicantNumber}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        Applicant {applicant.applicantNumber}
                      </p>
                      <p className="text-xs text-gray-500">Anonymous</p>
                    </div>
                  </div>
                  {applicant.verifiedProof && (
                    <Shield className="h-5 w-5 text-green-600" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Applied:</span>
                    <span className="font-medium">
                      {new Date(applicant.appliedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ZK Proof:</span>
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-semibold ${
                        applicant.enrolled ? 'text-green-600' : 'text-gray-600'
                      }`}
                    >
                      {applicant.enrolled ? 'Enrolled' : 'Pending'}
                    </span>
                  </div>
                </div>

                {applicant.enrolled && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Enrolled by certified clinic
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </ResearcherLayout>
  );
}
