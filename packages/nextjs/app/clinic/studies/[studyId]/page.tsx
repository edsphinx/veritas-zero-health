'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
import { ClinicLayout } from '@/components/layout';
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

interface Milestone {
  id: number;
  milestoneType: string;
  description: string;
  rewardAmount: string;
  status: string;
}

interface Participant {
  address: string;
  enrolledAt: number;
  completedMilestones: number[];
  totalEarned: string;
  active: boolean;
}

interface Study {
  id: number;
  title: string;
  description: string;
  status: string;
  participantCount: number;
  maxParticipants: number;
  milestones: Milestone[];
}

export default function ClinicStudyDetailPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const studyId = params?.studyId as string;

  const [study, setStudy] = useState<Study | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New participant enrollment
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [newParticipantAddress, setNewParticipantAddress] = useState('');

  useEffect(() => {
    if (studyId) {
      loadStudyData();
    }
  }, [studyId]);

  const loadStudyData = async () => {
    try {
      setLoading(true);

      // Fetch study details
      const studyResponse = await fetch(`/api/studies/${studyId}`);
      if (studyResponse.ok) {
        const studyData = await studyResponse.json();
        setStudy(studyData);
      }

      // TODO: Fetch participants from contract
      // Mock data for now
      const mockParticipants: Participant[] = [
        {
          address: '0x1234...5678',
          enrolledAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
          completedMilestones: [1],
          totalEarned: '50',
          active: true,
        },
        {
          address: '0xabcd...ef01',
          enrolledAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          completedMilestones: [],
          totalEarned: '0',
          active: true,
        },
      ];

      setParticipants(mockParticipants);
    } catch (error) {
      console.error('Error loading study data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollParticipant = async () => {
    if (!newParticipantAddress || !newParticipantAddress.startsWith('0x')) {
      alert('Please enter a valid wallet address');
      return;
    }

    try {
      setActionLoading('enroll');

      const response = await fetch(`/api/studies/${studyId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantAddress: newParticipantAddress,
          clinicAddress: address,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Participant enrolled successfully!');
        setNewParticipantAddress('');
        setShowEnrollForm(false);
        loadStudyData();
      } else {
        alert(`Failed to enroll participant: ${result.details}`);
      }
    } catch (error: any) {
      console.error('Error enrolling participant:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteMilestone = async (
    participantAddress: string,
    milestoneId: number
  ) => {
    try {
      setActionLoading(`complete-${participantAddress}-${milestoneId}`);

      const response = await fetch(`/api/studies/${studyId}/milestones/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          participantAddress,
          clinicAddress: address,
          verificationData: `Completed at clinic on ${new Date().toISOString()}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Milestone marked as completed!');
        loadStudyData();
      } else {
        alert(`Failed to complete milestone: ${result.details}`);
      }
    } catch (error: any) {
      console.error('Error completing milestone:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isConnected) {
    return (
      <ClinicLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to access the clinic dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <ClinicLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading study data...</p>
        </div>
      </div>
    );
  }

  if (!study) {
    return (
      <ClinicLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Study Not Found</h2>
          <Link
            href="/clinic/studies"
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
        href="/clinic/studies"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Studies
      </Link>

      {/* Study Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{study.title}</h1>
        <p className="text-gray-600 mb-4">{study.description}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Participants: {study.participantCount} / {study.maxParticipants}
          </span>
          <span className="text-sm text-gray-600">
            Milestones: {study.milestones.length}
          </span>
        </div>
      </div>

      {/* Enroll New Participant */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Enroll New Participant</h2>
          <button
            onClick={() => setShowEnrollForm(!showEnrollForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {showEnrollForm ? 'Cancel' : 'Enroll Patient'}
          </button>
        </div>

        {showEnrollForm && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={newParticipantAddress}
                onChange={(e) => setNewParticipantAddress(e.target.value)}
                placeholder="Patient's wallet address (0x...)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleEnrollParticipant}
                disabled={actionLoading === 'enroll'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {actionLoading === 'enroll' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enrolling...
                  </span>
                ) : (
                  'Confirm Enrollment'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Make sure the patient has completed the ZK proof application first
            </p>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-4">
          Enrolled Participants ({participants.length})
        </h2>

        {participants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No participants enrolled yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {participants.map((participant) => (
              <div
                key={participant.address}
                className="border border-gray-200 rounded-lg p-6"
              >
                {/* Participant Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm text-gray-600 mb-1">
                      {participant.address}
                    </p>
                    <p className="text-xs text-gray-500">
                      Enrolled:{' '}
                      {new Date(participant.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Earned</p>
                    <p className="text-xl font-bold text-green-600">
                      ${participant.totalEarned} USDC
                    </p>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h3 className="font-semibold mb-3">Milestone Progress:</h3>
                  <div className="space-y-2">
                    {study.milestones.map((milestone) => {
                      const isCompleted = participant.completedMilestones.includes(
                        milestone.id
                      );

                      return (
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {milestone.milestoneType}
                              </p>
                              <p className="text-xs text-gray-600">
                                ${milestone.rewardAmount} USDC
                              </p>
                            </div>
                          </div>

                          {!isCompleted && (
                            <button
                              onClick={() =>
                                handleCompleteMilestone(
                                  participant.address,
                                  milestone.id
                                )
                              }
                              disabled={
                                actionLoading ===
                                `complete-${participant.address}-${milestone.id}`
                              }
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-semibold"
                            >
                              {actionLoading ===
                              `complete-${participant.address}-${milestone.id}` ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Marking...
                                </span>
                              ) : (
                                'Mark Complete'
                              )}
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-xs text-green-600 font-semibold">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            </div>
    </ClinicLayout>
        )}
      </div>
    </div>
  );
}
