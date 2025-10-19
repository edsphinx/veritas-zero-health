/**
 * Researcher Portal - Main Dashboard
 *
 * Entry point for researchers to manage clinical trials
 * Follows clean architecture with semantic animations and data hooks
 */

'use client';

import { motion } from 'framer-motion';
import {
  FlaskConical,
  Users,
  BarChart3,
  Plus,
} from 'lucide-react';
import {
  StatCard,
  QuickActionCard,
  WelcomeCard,
  RecentActivityCard
} from '@/components/features/researcher';
import { listContainerVariants, listItemVariants } from '@/lib/animations';
import { useResearcherStats } from '@/hooks/useResearcherStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResearcherDashboard() {
  // Fetch stats with hook (following clean architecture)
  const { data: stats, isLoading: statsLoading } = useResearcherStats();

  return (
    <motion.div
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={listItemVariants}>
        <WelcomeCard />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={listItemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Plus className="h-6 w-6" />}
            title="New Study"
            description="Create clinical trial"
            href="/researcher/create-study"
          />
          <QuickActionCard
            icon={<FlaskConical className="h-6 w-6" />}
            title="My Studies"
            description="Manage trials"
            href="/researcher/studies"
          />
          <QuickActionCard
            icon={<Users className="h-6 w-6" />}
            title="Applications"
            description="View applicants"
            href="/researcher/applications"
          />
          <QuickActionCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Analytics"
            description="Study metrics"
            href="/researcher/analytics"
          />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={listItemVariants}>
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Active Studies"
              value={stats?.activeStudies ?? 0}
              color="primary"
              label="Studies"
            />
            <StatCard
              title="Total Participants"
              value={stats?.totalParticipants ?? 0}
              color="secondary"
              label="Participants"
            />
            <StatCard
              title="ZK Verifications"
              value={stats?.zkVerifications ?? 0}
              color="accent"
              label="Verifications"
            />
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={listItemVariants}>
        <RecentActivityCard />
      </motion.div>
    </motion.div>
  );
}
