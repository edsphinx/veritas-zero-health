/**
 * SuperAdmin Portal - Main Dashboard
 *
 * Restricted to superadmin addresses only
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  ShieldAlert,
  UserCog,
  Users,
  FileCode,
  Settings,
  BarChart3,
  ScrollText,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';

export default function SuperAdminDashboard() {
  const { address } = useAccount();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    setHasAccess(isSuperAdmin(address));
  }, [address]);

  if (!hasAccess) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required. Only authorized addresses can access this portal.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-destructive/10 to-primary/10 border border-destructive/20 p-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SuperAdmin Control Panel</h1>
              <p className="text-muted-foreground mt-1">
                Full system access - Manage roles, contracts, and system configuration
              </p>
            </div>
          </div>

          {/* Superadmin Info */}
          <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Logged in as SuperAdmin</p>
            <p className="font-mono text-sm">{address}</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<UserCog className="h-6 w-6" />}
            title="Role Management"
            description="Assign roles to wallets"
            href="/superadmin/roles"
            delay={0.1}
            badge="Core"
            color="destructive"
          />
          <QuickActionCard
            icon={<Users className="h-6 w-6" />}
            title="Users & Wallets"
            description="Manage system users"
            href="/superadmin/users"
            delay={0.2}
            color="primary"
          />
          <QuickActionCard
            icon={<FileCode className="h-6 w-6" />}
            title="Contracts"
            description="View deployed contracts"
            href="/superadmin/contracts"
            delay={0.3}
            color="accent"
          />
          <QuickActionCard
            icon={<Settings className="h-6 w-6" />}
            title="System Config"
            description="Network & environment"
            href="/superadmin/system"
            delay={0.4}
            color="primary"
          />
          <QuickActionCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Analytics"
            description="System metrics"
            href="/superadmin/analytics"
            delay={0.5}
            color="accent"
          />
          <QuickActionCard
            icon={<ScrollText className="h-6 w-6" />}
            title="Audit Logs"
            description="System activity logs"
            href="/superadmin/logs"
            delay={0.6}
            color="muted"
          />
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusCard
            icon={<CheckCircle2 className="h-8 w-8 text-success" />}
            title="Network"
            status="Optimism Sepolia"
            description="Connected and operational"
            color="success"
          />
          <StatusCard
            icon={<CheckCircle2 className="h-8 w-8 text-success" />}
            title="Contracts"
            status="Deployed"
            description="All contracts operational"
            color="success"
          />
          <StatusCard
            icon={<CheckCircle2 className="h-8 w-8 text-primary" />}
            title="System"
            status="Healthy"
            description="All services running"
            color="primary"
          />
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-2xl font-bold mb-4">System Overview</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>• SuperAdmin access configured for 2 addresses</p>
            <p>• All contracts deployed on Optimism Sepolia</p>
            <p>• Service layer architecture implemented</p>
            <p>• Ready for role management</p>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  delay,
  badge,
  color = 'primary',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  delay: number;
  badge?: string;
  color?: 'primary' | 'destructive' | 'accent' | 'muted';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary hover:border-primary/40',
    destructive: 'bg-destructive/10 text-destructive hover:border-destructive/40',
    accent: 'bg-accent/10 text-accent hover:border-accent/40',
    muted: 'bg-muted/10 text-muted-foreground hover:border-muted/40',
  };

  const iconColorClasses = {
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    accent: 'bg-accent/10 text-accent',
    muted: 'bg-muted/10 text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={href}
        className={`block p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all group ${colorClasses[color]}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-lg w-fit p-3 ${iconColorClasses[color]}`}>
            {icon}
          </div>
          {badge && (
            <span className="px-2 py-1 text-xs font-semibold bg-destructive/10 text-destructive rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <ArrowRight className="h-4 w-4 text-current mt-2 group-hover:translate-x-1 transition-transform" />
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
