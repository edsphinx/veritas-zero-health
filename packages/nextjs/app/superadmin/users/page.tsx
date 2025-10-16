/**
 * SuperAdmin Users & Wallets Management Page
 *
 * View and manage all registered users and their wallet addresses
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Users,
  Search,
  Filter,
  User,
  Hospital,
  Microscope,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';
import { UserRole } from '@/shared/types/auth.types';

interface UserData {
  address: string;
  role: UserRole;
  isVerified: boolean;
  humanityScore?: number;
  joinedAt: Date;
  lastActive: Date;
  displayName?: string;
  email?: string;
  activeTrials?: number;
  patientsCount?: number;
  studiesCount?: number;
}

const MOCK_USERS: UserData[] = [
  {
    address: '0xeA5A20D8d9Eeed3D8275993bdF3Bdb4749e7C485',
    role: UserRole.SUPERADMIN,
    isVerified: true,
    humanityScore: 100,
    joinedAt: new Date('2025-10-14'),
    lastActive: new Date(),
    displayName: 'Deployer',
  },
  {
    address: '0x1234567890123456789012345678901234567890',
    role: UserRole.PATIENT,
    isVerified: true,
    humanityScore: 95,
    joinedAt: new Date('2025-10-13'),
    lastActive: new Date('2025-10-14'),
    displayName: 'John Doe',
    email: 'john@example.com',
    activeTrials: 2,
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    role: UserRole.CLINIC,
    isVerified: true,
    humanityScore: 98,
    joinedAt: new Date('2025-10-12'),
    lastActive: new Date('2025-10-14'),
    displayName: 'City General Hospital',
    patientsCount: 150,
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    role: UserRole.RESEARCHER,
    isVerified: true,
    humanityScore: 92,
    joinedAt: new Date('2025-10-11'),
    lastActive: new Date('2025-10-13'),
    displayName: 'Dr. Sarah Smith',
    studiesCount: 3,
  },
];

export default function UsersPage() {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>(
    'all'
  );
  const [users] = useState<UserData[]>(MOCK_USERS);

  if (!isSuperAdmin(address)) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required to view users.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && user.isVerified) ||
      (verificationFilter === 'unverified' && !user.isVerified);

    return matchesSearch && matchesRole && matchesVerification;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Users & Wallets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered users and their wallet addresses
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard label="Total Users" value={users.length} color="primary" />
          <StatsCard
            label="Verified"
            value={users.filter((u) => u.isVerified).length}
            color="success"
          />
          <StatsCard
            label="Patients"
            value={users.filter((u) => u.role === UserRole.PATIENT).length}
            color="primary"
          />
          <StatsCard
            label="Clinics"
            value={users.filter((u) => u.role === UserRole.CLINIC).length}
            color="accent"
          />
          <StatsCard
            label="Researchers"
            value={users.filter((u) => u.role === UserRole.RESEARCHER).length}
            color="success"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by address, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value={UserRole.PATIENT}>Patients</option>
              <option value={UserRole.CLINIC}>Clinics</option>
              <option value={UserRole.RESEARCHER}>Researchers</option>
              <option value={UserRole.ADMIN}>Admins</option>
              <option value={UserRole.SUPERADMIN}>SuperAdmins</option>
            </select>
          </div>
        </div>

        {/* Verification Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setVerificationFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              verificationFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-accent'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setVerificationFilter('verified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              verificationFilter === 'verified'
                ? 'bg-success text-success-foreground'
                : 'bg-card border border-border hover:bg-accent'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setVerificationFilter('unverified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              verificationFilter === 'unverified'
                ? 'bg-warning text-warning-foreground'
                : 'bg-card border border-border hover:bg-accent'
            }`}
          >
            Unverified Only
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Verification</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{user.displayName || 'Anonymous'}</p>
                        {user.email && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(user.address)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`https://sepolia-optimism.etherscan.io/address/${user.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isVerified ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            <span className="text-sm text-success">Verified</span>
                            {user.humanityScore && (
                              <span className="text-xs text-muted-foreground">
                                ({user.humanityScore}%)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-warning" />
                            <span className="text-sm text-warning">Unverified</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.joinedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary hover:text-primary/80 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function StatsCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'success';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const roleConfig: Record<
    UserRole,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    [UserRole.PATIENT]: {
      color: 'bg-primary/10 text-primary',
      icon: <User className="h-3 w-3" />,
      label: 'Patient',
    },
    [UserRole.CLINIC]: {
      color: 'bg-accent/10 text-accent',
      icon: <Hospital className="h-3 w-3" />,
      label: 'Clinic',
    },
    [UserRole.RESEARCHER]: {
      color: 'bg-success/10 text-success',
      icon: <Microscope className="h-3 w-3" />,
      label: 'Researcher',
    },
    [UserRole.ADMIN]: {
      color: 'bg-warning/10 text-warning',
      icon: <Shield className="h-3 w-3" />,
      label: 'Admin',
    },
    [UserRole.SUPERADMIN]: {
      color: 'bg-destructive/10 text-destructive',
      icon: <ShieldAlert className="h-3 w-3" />,
      label: 'SuperAdmin',
    },
    [UserRole.GUEST]: {
      color: 'bg-muted/10 text-muted-foreground',
      icon: <User className="h-3 w-3" />,
      label: 'Guest',
    },
  };

  const config = roleConfig[role];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
