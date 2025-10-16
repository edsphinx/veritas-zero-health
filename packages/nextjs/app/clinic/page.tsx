/**
 * Clinic Portal - Main Dashboard
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileCheck,
  Calendar,
  Award,
  ArrowRight,
} from 'lucide-react';
import { ClinicLayout } from '@/components/layout';

export default function ClinicDashboard() {
  return (
    <ClinicLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 p-8"
        >
          <h1 className="text-3xl font-bold mb-2">Clinic Portal</h1>
          <p className="text-muted-foreground text-lg">
            Issue verifiable medical credentials and manage patient appointments.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<Users className="h-6 w-6" />}
            title="Patients"
            description="View all patients"
            href="/clinic/patients"
            delay={0.1}
          />
          <QuickActionCard
            icon={<Award className="h-6 w-6" />}
            title="Issue Credential"
            description="Create SBT"
            href="/clinic/issue"
            delay={0.2}
          />
          <QuickActionCard
            icon={<Calendar className="h-6 w-6" />}
            title="Appointments"
            description="Schedule visits"
            href="/clinic/appointments"
            delay={0.3}
          />
          <QuickActionCard
            icon={<FileCheck className="h-6 w-6" />}
            title="Records"
            description="Manage records"
            href="/clinic/records"
            delay={0.4}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Patients" value="0" color="accent" />
          <StatCard title="Credentials Issued" value="0" color="primary" />
          <StatCard title="Appointments Today" value="0" color="secondary" />
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              No activity yet
            </p>
            <Link
              href="/clinic/issue"
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Issue First Credential
            </Link>
          </div>
        </div>
      </div>
    </ClinicLayout>
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
        className="block p-6 rounded-xl border border-border bg-card hover:border-accent/40 hover:shadow-md transition-all group"
      >
        <div className="rounded-lg bg-accent/10 w-fit p-3 mb-3 text-accent">
          {icon}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <ArrowRight className="h-4 w-4 text-accent mt-2 group-hover:translate-x-1 transition-transform" />
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
  color: 'accent' | 'primary' | 'secondary';
}) {
  const colorClasses = {
    accent: 'border-accent/20 bg-accent/5 text-accent',
    primary: 'border-primary/20 bg-primary/5 text-primary',
    secondary: 'border-secondary/20 bg-secondary/5 text-secondary',
  };

  return (
    <div className={`rounded-xl border ${colorClasses[color]} p-6`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}
