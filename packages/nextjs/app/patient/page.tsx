/**
 * Patient Portal - Main Dashboard
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  FileText,
  FlaskConical,
  Calendar,
  Shield,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { PatientLayout } from '@/presentation/components/layout';

export default function PatientDashboard() {
  return (
    <PatientLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-8"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome to Your DASHI Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your sovereign health identity, medical records, and clinical trial applications.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={<User className="h-6 w-6" />}
            title="My Identity"
            description="View DASHI SBT"
            href="/patient/identity"
            delay={0.1}
          />
          <QuickActionCard
            icon={<FileText className="h-6 w-6" />}
            title="Medical Records"
            description="View & manage"
            href="/patient/records"
            delay={0.2}
          />
          <QuickActionCard
            icon={<FlaskConical className="h-6 w-6" />}
            title="Clinical Trials"
            description="Browse & apply"
            href="/trials"
            delay={0.3}
          />
          <QuickActionCard
            icon={<Calendar className="h-6 w-6" />}
            title="Appointments"
            description="Upcoming visits"
            href="/patient/appointments"
            delay={0.4}
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusCard
            icon={<Shield className="h-8 w-8 text-success" />}
            title="Verification Status"
            status="Verified"
            description="Human Passport verified"
            color="success"
          />
          <StatusCard
            icon={<Lock className="h-8 w-8 text-primary" />}
            title="Data Privacy"
            status="Encrypted"
            description="All records secured with Nillion"
            color="primary"
          />
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>• DASHI identity created</p>
            <p>• Human Passport verification completed</p>
            <p>• Ready to browse clinical trials</p>
          </div>
        </div>
      </div>
    </PatientLayout>
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
        className="block p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all group"
      >
        <div className="rounded-lg bg-primary/10 w-fit p-3 mb-3 text-primary">
          {icon}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <ArrowRight className="h-4 w-4 text-primary mt-2 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}

function StatusCard({
  icon,
  title,
  status,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  description: string;
  color: 'success' | 'primary';
}) {
  const colorClasses = {
    success: 'border-success/20 bg-success/5',
    primary: 'border-primary/20 bg-primary/5',
  };

  return (
    <div className={`rounded-xl border ${colorClasses[color]} p-6`}>
      <div className="flex items-start gap-4">
        <div>{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-2xl font-bold mb-1">{status}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
