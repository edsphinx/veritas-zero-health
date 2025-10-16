/**
 * My Studies Page (Patient View)
 *
 * Shows only the studies where the patient is enrolled/participating.
 * Private view - requires wallet connection and authentication.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Users as _Users,
  DollarSign as _DollarSign,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { PatientLayout } from '@/components/layout';
import { useAuth } from '@/shared/hooks/useAuth';
import type { Study as _Study, StudyStatus as _StudyStatus } from '@veritas/types';

interface Milestone {
  id: number;
  milestoneType: string;
  description: string;
  rewardAmount: string;
  status: string;
}

// Extended Study interface for this page's mock data
// Note: This is mock data structure, not the canonical Study type from @veritas/types
interface StudyWithProgress {
  id: number; // Mock uses number instead of UUID string
  title: string;
  description: string;
  status: 'Created' | 'Funding' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  totalFunding: string;
  remainingFunding: string;
  participantCount: number;
  maxParticipants: number;
  milestones: Milestone[];
  myProgress?: {
    enrolledAt: number;
    completedMilestones: number;
    totalEarned: string;
  };
}

export default function MyStudiesPage() {
  const router = useRouter();
  const { address: _address, isConnected } = useAuth();
  const [studies, setStudies] = useState<StudyWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (isConnected) {
      loadMyStudies();
    }
  }, [isConnected, filter]);

  const loadMyStudies = async () => {
    try {
      setLoading(true);

      // TODO: Fetch from ResearchFundingEscrow contract filtered by participant address
      // Mock data for now
      const mockStudies: StudyWithProgress[] = [
        {
          id: 1,
          title: 'Type 2 Diabetes Treatment Study',
          description:
            '12-month study testing new medication for Type 2 Diabetes. Participants will receive monthly check-ins and compensation.',
          status: 'Active',
          totalFunding: '10000',
          remainingFunding: '8500',
          participantCount: 6,
          maxParticipants: 40,
          milestones: [
            {
              id: 1,
              milestoneType: 'Initial Consultation',
              description: 'First medical consultation',
              rewardAmount: '50',
              status: 'Completed',
            },
            {
              id: 2,
              milestoneType: 'Month 1 Check-in',
              description: 'First month progress check',
              rewardAmount: '50',
              status: 'Pending',
            },
            {
              id: 3,
              milestoneType: 'Month 3 Check-in',
              description: 'Three month evaluation',
              rewardAmount: '50',
              status: 'Pending',
            },
            {
              id: 4,
              milestoneType: 'Month 6 Check-in',
              description: 'Six month evaluation',
              rewardAmount: '50',
              status: 'Pending',
            },
            {
              id: 5,
              milestoneType: 'Final Evaluation',
              description: 'Study completion',
              rewardAmount: '50',
              status: 'Pending',
            },
          ],
          myProgress: {
            enrolledAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
            completedMilestones: 1,
            totalEarned: '50',
          },
        },
      ];

      setStudies(mockStudies);
    } catch (error) {
      console.error('Error loading my studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalReward = (milestones: Milestone[]) => {
    return milestones.reduce((sum, m) => sum + Number(m.rewardAmount), 0);
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
            className="text-center max-w-md mx-auto"
          >
            <div className="rounded-full bg-primary/10 p-4 w-fit mx-auto mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your enrolled studies
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              Connect Wallet
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-4"
          >
            <FlaskConical className="h-4 w-4" />
            <span>My Enrolled Studies</span>
          </motion.div>

          <h1 className="text-4xl font-bold mb-2">My Studies</h1>
          <p className="text-muted-foreground text-lg">
            Track your progress and earnings from enrolled clinical studies
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-8"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            All Studies
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              filter === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              filter === 'completed'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            Completed
          </button>
        </motion.div>

        {/* Studies Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading your studies...</p>
          </div>
        ) : studies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12 rounded-xl border border-border bg-card p-8"
          >
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Studies Yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t enrolled in any clinical studies
            </p>
            <button
              onClick={() => router.push('/studies')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              <FlaskConical className="h-4 w-4" />
              Browse Available Studies
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="rounded-xl border border-border bg-card hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Study Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold flex-1">{study.title}</h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        study.status
                      )}`}
                    >
                      {study.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {study.description}
                  </p>
                </div>

                {/* Progress Stats */}
                {study.myProgress && (
                  <div className="p-6 bg-muted/20 border-b border-border">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Progress</p>
                        <p className="text-lg font-bold">
                          {study.myProgress.completedMilestones}/{study.milestones.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Earned</p>
                        <p className="text-lg font-bold text-green-600">
                          ${study.myProgress.totalEarned}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Reward</p>
                        <p className="text-lg font-bold">
                          ${calculateTotalReward(study.milestones)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (study.myProgress.completedMilestones /
                                study.milestones.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Milestones Preview */}
                <div className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Milestones
                  </h3>
                  <div className="space-y-2">
                    {study.milestones.slice(0, 3).map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          {milestone.status === 'Completed' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span
                            className={
                              milestone.status === 'Completed'
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }
                          >
                            {milestone.milestoneType}
                          </span>
                        </span>
                        <span className="font-semibold">${milestone.rewardAmount}</span>
                      </div>
                    ))}
                    {study.milestones.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{study.milestones.length - 3} more milestones
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => router.push(`/patient/studies/${study.id}`)}
                    className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                  >
                    View Progress & Details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Browse More Studies CTA */}
        {studies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
          >
            <h3 className="text-xl font-semibold mb-2">Looking for More Studies?</h3>
            <p className="text-muted-foreground mb-4">
              Browse available clinical studies and apply with zero-knowledge proofs
            </p>
            <button
              onClick={() => router.push('/studies')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              <FlaskConical className="h-4 w-4" />
              Browse All Studies
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </PatientLayout>
  );
}
