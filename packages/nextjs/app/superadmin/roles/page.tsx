/**
 * SuperAdmin Role Management Page
 *
 * Allows superadmin to assign roles to wallet addresses
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  User,
  Hospital,
  Microscope,
  ShieldAlert,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';
import { UserRole } from '@/shared/types/auth.types';
import { isAddress } from 'viem';

interface RoleAssignment {
  address: string;
  role: UserRole;
  assignedAt: Date;
  assignedBy: string;
}

export default function RoleManagementPage() {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.PATIENT);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([
    {
      address: '0xeA5A20D8d9Eeed3D8275993bdF3Bdb4749e7C485',
      role: UserRole.SUPERADMIN,
      assignedAt: new Date('2025-10-14'),
      assignedBy: 'System',
    },
  ]);

  if (!isSuperAdmin(address)) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required to manage roles.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const handleAssignRole = async () => {
    if (!isAddress(newAddress)) {
      alert('Invalid Ethereum address');
      return;
    }

    setIsAssigning(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newAssignment: RoleAssignment = {
      address: newAddress,
      role: selectedRole,
      assignedAt: new Date(),
      assignedBy: address || 'Unknown',
    };

    setAssignments([...assignments, newAssignment]);
    setNewAddress('');
    setSelectedRole(UserRole.PATIENT);
    setShowAssignModal(false);
    setIsAssigning(false);
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserCog className="h-8 w-8 text-destructive" />
              Role Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign and manage user roles across the platform
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Assign Role
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<User className="h-6 w-6" />}
            label="Patients"
            count={assignments.filter((a) => a.role === UserRole.PATIENT).length}
            color="primary"
          />
          <StatsCard
            icon={<Hospital className="h-6 w-6" />}
            label="Clinics"
            count={assignments.filter((a) => a.role === UserRole.CLINIC).length}
            color="accent"
          />
          <StatsCard
            icon={<Microscope className="h-6 w-6" />}
            label="Researchers"
            count={assignments.filter((a) => a.role === UserRole.RESEARCHER).length}
            color="success"
          />
          <StatsCard
            icon={<ShieldAlert className="h-6 w-6" />}
            label="Admins"
            count={
              assignments.filter(
                (a) => a.role === UserRole.ADMIN || a.role === UserRole.SUPERADMIN
              ).length
            }
            color="destructive"
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by address or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Assignments Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Assigned At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Assigned By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssignments.map((assignment, index) => (
                  <motion.tr
                    key={`${assignment.address}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono">{assignment.address}</code>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={assignment.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {assignment.assignedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono text-muted-foreground">
                        {assignment.assignedBy.slice(0, 10)}...
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {assignment.role !== UserRole.SUPERADMIN && (
                        <button className="text-destructive hover:text-destructive/80 text-sm font-medium">
                          Revoke
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <UserCog className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No role assignments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl border border-border p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Plus className="h-6 w-6 text-destructive" />
              Assign Role
            </h2>

            <div className="space-y-4">
              {/* Address Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <RoleButton
                    role={UserRole.PATIENT}
                    icon={<User className="h-5 w-5" />}
                    selected={selectedRole === UserRole.PATIENT}
                    onClick={() => setSelectedRole(UserRole.PATIENT)}
                  />
                  <RoleButton
                    role={UserRole.CLINIC}
                    icon={<Hospital className="h-5 w-5" />}
                    selected={selectedRole === UserRole.CLINIC}
                    onClick={() => setSelectedRole(UserRole.CLINIC)}
                  />
                  <RoleButton
                    role={UserRole.RESEARCHER}
                    icon={<Microscope className="h-5 w-5" />}
                    selected={selectedRole === UserRole.RESEARCHER}
                    onClick={() => setSelectedRole(UserRole.RESEARCHER)}
                  />
                  <RoleButton
                    role={UserRole.ADMIN}
                    icon={<Shield className="h-5 w-5" />}
                    selected={selectedRole === UserRole.ADMIN}
                    onClick={() => setSelectedRole(UserRole.ADMIN)}
                  />
                </div>
              </div>

              {/* Warning for Admin Role */}
              {selectedRole === UserRole.ADMIN && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-warning">
                    Admin role grants elevated privileges. Assign with caution.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={isAssigning}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRole}
                  disabled={isAssigning || !newAddress}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Assign Role
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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
  color: 'primary' | 'accent' | 'success' | 'destructive';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
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

function RoleButton({
  role,
  icon,
  selected,
  onClick,
}: {
  role: UserRole;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  const roleLabels: Record<string, string> = {
    [UserRole.PATIENT]: 'Patient',
    [UserRole.CLINIC]: 'Clinic',
    [UserRole.RESEARCHER]: 'Researcher',
    [UserRole.ADMIN]: 'Admin',
  };

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
        selected
          ? 'border-destructive bg-destructive/10 text-destructive'
          : 'border-border hover:border-muted-foreground'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{roleLabels[role]}</span>
      {selected && <Check className="h-4 w-4" />}
    </button>
  );
}
