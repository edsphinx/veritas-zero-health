'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { ResearcherLayout } from '@/components/layout';
import { useStudy, useVerifiedApplicantsCount } from '@/shared/hooks/useStudy';

interface Milestone {
  id: number;
  milestoneType: string;
  description: string;
  rewardAmount: string;
  status: string;
}

interface Study {
  id: number;
  title: string;
  description: string;
  sponsor: string;
  status: string;
  totalFunding: string;
  remainingFunding: string;
  participantCount: number;
  maxParticipants: number;
  milestones: Milestone[];
}

interface Applicant {
  applicantNumber: number;
  appliedAt: number;
  verifiedProof: boolean;
  enrolled: boolean;
}

export default function ResearcherStudyDetailPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const studyId = params?.studyId as string;

  const [study, setStudy] = useState<Study | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // Validate studyId is numeric (not "create" or other non-numeric routes)
  const isValidStudyId = studyId && /^\d+$/.test(studyId);

  // Use real blockchain hooks
  const studyIdBigInt = isValidStudyId ? BigInt(studyId) : undefined;
  const { study: studyOnChain, isLoading: studyLoading } = useStudy(studyIdBigInt);
  const { count: verifiedCount, isLoading: countLoading, refetch } = useVerifiedApplicantsCount(studyIdBigInt);

  const loading = studyLoading || countLoading;
  const verifiedApplicantsCount = verifiedCount ? Number(verifiedCount) : 0;

  useEffect(() => {
    if (studyId) {
      loadStudyData();
    }
  }, [studyId]);

  const loadStudyData = async () => {
    try {
      // Fetch study details from API (for off-chain data like milestones)
      const studyResponse = await fetch(`/api/studies/${studyId}`);
      if (studyResponse.ok) {
        const studyData = await studyResponse.json();
        setStudy(studyData);
      }

      // Fetch real applicants from blockchain events
      const applicationsResponse = await fetch(`/api/studies/${studyId}/applications`);
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        if (applicationsData.success && applicationsData.applications) {
          // Map blockchain data to UI format
          const applicantsList: Applicant[] = applicationsData.applications.map((app: any, index: number) => ({
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

  const calculateTotalReward = () => {
    if (!study) return 0;
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
              The study ID must be a number. If you're trying to create a study, use the button below.
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
    );
  }

  return (
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
              ${study.totalFunding}
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
              ${study.remainingFunding}
            </p>
          </div>
        </div>
      </div>

      {/* Milestones Overview */}
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
  );
}
