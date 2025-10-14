/**
 * Researcher Portal - Main Dashboard
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FlaskConical,
  Users,
  BarChart3,
  FileCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { ResearcherLayout } from '@/presentation/components/layout';

export default function ResearcherDashboard() {
  return (
    <ResearcherLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20 p-8"
        >
          <h1 className="text-3xl font-bold mb-2">Researcher Portal</h1>
          <p className="text-muted-foreground text-lg">
            Create and manage clinical trials with privacy-preserving ZK proof verification.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Plus className="h-6 w-6" />}
            title="New Study"
            description="Create trial"
            href="/researcher/create-study"
            delay={0.1}
          />
          <QuickActionCard
            icon={<FlaskConical className="h-6 w-6" />}
            title="My Studies"
            description="Manage trials"
            href="/researcher/studies"
            delay={0.2}
          />
          <QuickActionCard
            icon={<Users className="h-6 w-6" />}
            title="Participants"
            description="View applicants"
            href="/researcher/participants"
            delay={0.3}
          />
          <QuickActionCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Analytics"
            description="Study metrics"
            href="/researcher/analytics"
            delay={0.4}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Studies" value="0" color="secondary" />
          <StatCard title="Total Participants" value="0" color="primary" />
          <StatCard title="ZK Verifications" value="0" color="accent" />
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No studies created yet
            </p>
            <Link
              href="/researcher/create-study"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Study
            </Link>
          </div>
        </div>
      </div>
    </ResearcherLayout>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={href}
        className="block p-6 rounded-xl border border-border bg-card hover:border-secondary/40 hover:shadow-md transition-all group"
      >
        <div className="rounded-lg bg-secondary/10 w-fit p-3 mb-3 text-secondary">
          {icon}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <ArrowRight className="h-4 w-4 text-secondary mt-2 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: 'secondary' | 'primary' | 'accent';
}) {
  const colorClasses = {
    secondary: 'border-secondary/20 bg-secondary/5 text-secondary',
    primary: 'border-primary/20 bg-primary/5 text-primary',
    accent: 'border-accent/20 bg-accent/5 text-accent',
  };

  return (
    <div className={`rounded-xl border ${colorClasses[color]} p-6`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}
