/**
 * Sponsor Portal Dashboard
 *
 * Main dashboard for sponsors showing:
 * - Available studies to fund
 * - Funded studies overview
 * - Funding statistics
 */

'use client';

import { } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Beaker,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { SponsorLayout } from '@/components/layout';
import { useStudies } from '@/shared/hooks/useStudies';
import { useSponsor } from '@/shared/hooks/useSponsor';

export default function SponsorDashboard() {
  const router = useRouter();
  const { studies, loading: studiesLoading } = useStudies();
  const { totalFunded, activeStudiesCount, totalDeposits, deposits: _deposits, loading: sponsorLoading } = useSponsor();

  const loading = studiesLoading || sponsorLoading;

  // Filter studies that need funding (created but not fully funded)
  const availableStudies = studies.filter(study =>
    study.status === 'Created' || study.status === 'Funding'
  );

  const _fundedStudies = studies.filter(study =>
    study.status === 'Active' || study.status === 'Completed'
  );

  // Format total funded for display
  const totalFundedUSD = totalFunded ? Number(totalFunded) / 1_000_000 : 0;

  return (
    <SponsorLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Sponsor Portal</h1>
              <p className="text-muted-foreground">
                Fund clinical research and make an impact
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
              <span className="text-2xl font-bold">{availableStudies.length}</span>
            </div>
            <h3 className="font-semibold mb-1">Available Studies</h3>
            <p className="text-sm text-muted-foreground">Studies seeking funding</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <span className="text-2xl font-bold">{activeStudiesCount}</span>
            </div>
            <h3 className="font-semibold mb-1">Funded Studies</h3>
            <p className="text-sm text-muted-foreground">Studies you&apos;ve supported</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-2xl font-bold">{totalDeposits}</span>
            </div>
            <h3 className="font-semibold mb-1">Total Deposits</h3>
            <p className="text-sm text-muted-foreground">Number of funding transactions</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-warning" />
              <span className="text-2xl font-bold">${totalFundedUSD.toLocaleString()}</span>
            </div>
            <h3 className="font-semibold mb-1">Total Funding</h3>
            <p className="text-sm text-muted-foreground">Lifetime contributions</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <button
            onClick={() => router.push('/sponsor/fund')}
            className="group rounded-xl border border-primary/20 bg-primary/5 p-8 text-left hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fund a Study</h3>
            <p className="text-muted-foreground">
              Browse available studies and provide funding to support clinical research
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              <span>{availableStudies.length} studies available</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/sponsor/studies')}
            className="group rounded-xl border border-border bg-card p-8 text-left hover:bg-accent hover:border-accent transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2">My Funded Studies</h3>
            <p className="text-muted-foreground">
              Track progress and impact of studies you&apos;ve funded
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-success font-medium">
              <Target className="h-4 w-4" />
              <span>{activeStudiesCount} active investments</span>
            </div>
          </button>
        </motion.div>

        {/* Available Studies Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Studies Seeking Funding</h2>
            <button
              onClick={() => router.push('/sponsor/fund')}
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading studies...</p>
            </div>
          ) : availableStudies.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Studies Available</h3>
              <p className="text-muted-foreground">
                There are currently no studies seeking funding. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableStudies.slice(0, 6).map((study, index) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/sponsor/fund/${study.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Beaker className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                      {study.status}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-2">{study.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {study.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Participants:</span>
                    <span className="font-semibold">{(study as { maxParticipants?: number }).maxParticipants || 0}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </SponsorLayout>
  );
}
