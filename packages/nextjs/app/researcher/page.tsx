/**
 * Researcher Portal - Main Dashboard
 *
 * Entry point for researchers to manage clinical trials
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
import { fadeUpVariants, listContainerVariants, transitions } from '@/lib/animations';

export default function ResearcherDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.standard}
      >
        <WelcomeCard />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
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
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <StatCard title="Active Studies" value="0" color="primary" label="Studies" icon={null} />
        <StatCard title="Total Participants" value="0" color="secondary" label="Participants" icon={null} />
        <StatCard title="ZK Verifications" value="0" color="accent" label="Verifications" icon={null} />
      </motion.div>

      {/* Recent Activity - Empty State */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.3 }}
      >
        <RecentActivityCard />
      </motion.div>
    </div>
  );
}
