/**
 * Funded Studies Page
 *
 * Shows all studies that this sponsor has funded
 * with tracking and analytics
 */

'use client';

import { } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Beaker,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useStudies } from '@/shared/hooks/useStudies';

export default function FundedStudiesPage() {
  const router = useRouter();
  const { address: _address, isConnected } = useAuth();
  const { studies, loading } = useStudies();

  // TODO: Filter studies that this sponsor has funded
  // For now, showing all active/completed studies
  const fundedStudies = studies.filter(study =>
    study.status === 'Active' || study.status === 'Completed'
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground">
            Please connect your wallet to view your funded studies
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <button
            onClick={() => router.push('/sponsor')}
            className="text-sm text-muted-foreground hover:text-primary mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">My Funded Studies</h1>
              <p className="text-muted-foreground">
                Track the impact of your research funding
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Beaker className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">{fundedStudies.length}</span>
            </div>
            <h3 className="font-semibold mb-1">Active Studies</h3>
            <p className="text-sm text-muted-foreground">Studies in progress</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-2xl font-bold">0</span>
            </div>
            <h3 className="font-semibold mb-1">Total Participants</h3>
            <p className="text-sm text-muted-foreground">Enrolled patients</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-success" />
              <span className="text-2xl font-bold">$0</span>
            </div>
            <h3 className="font-semibold mb-1">Total Invested</h3>
            <p className="text-sm text-muted-foreground">Lifetime funding</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-warning" />
              <span className="text-2xl font-bold">0%</span>
            </div>
            <h3 className="font-semibold mb-1">Avg Completion</h3>
            <p className="text-sm text-muted-foreground">Study progress</p>
          </div>
        </motion.div>

        {/* Studies List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading your funded studies...</p>
          </div>
        ) : fundedStudies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Funded Studies Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              You haven&apos;t funded any studies yet. Browse available studies and make your first
              investment in clinical research.
            </p>
            <button
              onClick={() => router.push('/sponsor/fund')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Studies
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {fundedStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Beaker className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{study.title}</h3>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            study.status === 'Active'
                              ? 'bg-success/10 text-success'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {study.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{study.description}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Started {new Date(study.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          0/{(study as { maxParticipants?: number }).maxParticipants || 0} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/sponsor/studies/${study.id}`)}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Details
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Completion Progress</span>
                    <span className="font-semibold">0%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold mb-1">$0</div>
                    <div className="text-xs text-muted-foreground">Your Investment</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold mb-1">0</div>
                    <div className="text-xs text-muted-foreground">Milestones Complete</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold mb-1">0 days</div>
                    <div className="text-xs text-muted-foreground">Time Remaining</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {fundedStudies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
          >
            <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Fund More Research</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explore more clinical studies and continue making an impact in medical research.
            </p>
            <button
              onClick={() => router.push('/sponsor/fund')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Available Studies
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
