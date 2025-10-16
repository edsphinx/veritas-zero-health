/**
 * SuperAdmin Audit Logs Page
 *
 * View system activity logs and audit trail
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  UserCog,
  Database,
  Settings,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';

type LogLevel = 'info' | 'warning' | 'error' | 'success';
type LogCategory = 'auth' | 'role' | 'contract' | 'system' | 'all';

interface AuditLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  action: string;
  user: string;
  details: string;
  ip?: string;
  metadata?: Record<string, any>;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date('2025-10-14T10:30:00'),
    level: 'success',
    category: 'role',
    action: 'Role Assigned',
    user: '0xeA5A...C485',
    details: 'Assigned RESEARCHER role to 0x1234...7890',
    ip: '192.168.1.100',
  },
  {
    id: '2',
    timestamp: new Date('2025-10-14T09:15:00'),
    level: 'info',
    category: 'auth',
    action: 'Login',
    user: '0xeA5A...C485',
    details: 'SuperAdmin logged in',
    ip: '192.168.1.100',
  },
  {
    id: '3',
    timestamp: new Date('2025-10-14T08:45:00'),
    level: 'warning',
    category: 'system',
    action: 'Configuration Changed',
    user: '0xeA5A...C485',
    details: 'Updated network RPC URL',
    ip: '192.168.1.100',
  },
  {
    id: '4',
    timestamp: new Date('2025-10-13T16:20:00'),
    level: 'error',
    category: 'contract',
    action: 'Transaction Failed',
    user: '0x1234...7890',
    details: 'Failed to deploy contract: insufficient gas',
    ip: '192.168.1.101',
  },
  {
    id: '5',
    timestamp: new Date('2025-10-13T14:10:00'),
    level: 'success',
    category: 'contract',
    action: 'Contract Deployed',
    user: '0xeA5A...C485',
    details: 'Deployed EligibilityCodeVerifier at 0xCf7E...0Fc9',
    ip: '192.168.1.100',
  },
  {
    id: '6',
    timestamp: new Date('2025-10-13T12:05:00'),
    level: 'info',
    category: 'role',
    action: 'Role Revoked',
    user: '0xeA5A...C485',
    details: 'Revoked ADMIN role from 0x2345...8901',
    ip: '192.168.1.100',
  },
  {
    id: '7',
    timestamp: new Date('2025-10-13T10:30:00'),
    level: 'warning',
    category: 'auth',
    action: 'Failed Login Attempt',
    user: '0x3456...9012',
    details: 'Invalid signature verification',
    ip: '192.168.1.102',
  },
  {
    id: '8',
    timestamp: new Date('2025-10-12T18:45:00'),
    level: 'success',
    category: 'system',
    action: 'System Update',
    user: '0xeA5A...C485',
    details: 'Updated platform to version 1.1.0',
    ip: '192.168.1.100',
  },
];

export default function AuditLogsPage() {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory>('all');
  const [logs] = useState<AuditLog[]>(MOCK_LOGS);

  if (!isSuperAdmin(address)) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required to view audit logs.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

    return matchesSearch && matchesLevel && matchesCategory;
  });

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Action', 'User', 'Details', 'IP'],
      ...filteredLogs.map((log) => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.action,
        log.user,
        log.details,
        log.ip || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ScrollText className="h-8 w-8 text-primary" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              System activity logs and audit trail
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            icon={<Info className="h-6 w-6" />}
            label="Info"
            count={logs.filter((l) => l.level === 'info').length}
            color="primary"
          />
          <StatsCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            label="Success"
            count={logs.filter((l) => l.level === 'success').length}
            color="success"
          />
          <StatsCard
            icon={<AlertTriangle className="h-6 w-6" />}
            label="Warnings"
            count={logs.filter((l) => l.level === 'warning').length}
            color="warning"
          />
          <StatsCard
            icon={<XCircle className="h-6 w-6" />}
            label="Errors"
            count={logs.filter((l) => l.level === 'error').length}
            color="destructive"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs by action, user, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as LogCategory)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="role">Role Management</option>
              <option value="contract">Contracts</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Level Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          <LevelPill
            label="All"
            level="all"
            selected={levelFilter === 'all'}
            onClick={() => setLevelFilter('all')}
            count={logs.length}
          />
          <LevelPill
            label="Info"
            level="info"
            selected={levelFilter === 'info'}
            onClick={() => setLevelFilter('info')}
            count={logs.filter((l) => l.level === 'info').length}
          />
          <LevelPill
            label="Success"
            level="success"
            selected={levelFilter === 'success'}
            onClick={() => setLevelFilter('success')}
            count={logs.filter((l) => l.level === 'success').length}
          />
          <LevelPill
            label="Warning"
            level="warning"
            selected={levelFilter === 'warning'}
            onClick={() => setLevelFilter('warning')}
            count={logs.filter((l) => l.level === 'warning').length}
          />
          <LevelPill
            label="Error"
            level="error"
            selected={levelFilter === 'error'}
            onClick={() => setLevelFilter('error')}
            count={logs.filter((l) => l.level === 'error').length}
          />
        </div>

        {/* Logs Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-xs">
                            {log.timestamp.toLocaleDateString()}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <LevelBadge level={log.level} />
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={log.category} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{log.action}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                        {log.user}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-md truncate">
                      {log.details}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No logs found</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function StatsCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function LevelPill({
  label,
  level,
  selected,
  onClick,
  count,
}: {
  label: string;
  level: string;
  selected: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border hover:bg-accent'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function LevelBadge({ level }: { level: LogLevel }) {
  const config = {
    info: {
      color: 'bg-primary/10 text-primary',
      icon: <Info className="h-3 w-3" />,
      label: 'Info',
    },
    success: {
      color: 'bg-success/10 text-success',
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Success',
    },
    warning: {
      color: 'bg-warning/10 text-warning',
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'Warning',
    },
    error: {
      color: 'bg-destructive/10 text-destructive',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Error',
    },
  };

  const { color, icon, label } = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: LogCategory }) {
  if (category === 'all') return null;

  const config: Record<
    Exclude<LogCategory, 'all'>,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    auth: {
      color: 'bg-primary/10 text-primary',
      icon: <Shield className="h-3 w-3" />,
      label: 'Auth',
    },
    role: {
      color: 'bg-accent/10 text-accent',
      icon: <UserCog className="h-3 w-3" />,
      label: 'Role',
    },
    contract: {
      color: 'bg-success/10 text-success',
      icon: <Database className="h-3 w-3" />,
      label: 'Contract',
    },
    system: {
      color: 'bg-warning/10 text-warning',
      icon: <Settings className="h-3 w-3" />,
      label: 'System',
    },
  };

  const { color, icon, label } = config[category];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}
