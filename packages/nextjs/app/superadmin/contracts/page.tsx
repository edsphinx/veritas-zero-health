/**
 * SuperAdmin Contracts Overview Page
 *
 * View all deployed smart contracts and their information
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  FileCode,
  ExternalLink,
  Copy,
  CheckCircle2,
  Shield,
  Beaker,
  DollarSign,
  Database,
  Network,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';
import Link from 'next/link';

interface ContractInfo {
  name: string;
  address: string;
  category: 'identity' | 'studies' | 'escrow' | 'verification' | 'governance';
  description: string;
  deployedAt: Date;
  version: string;
  verified: boolean;
  txCount?: number;
}

const DEPLOYED_CONTRACTS: ContractInfo[] = [
  {
    name: 'HealthIdentitySBT',
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    category: 'identity',
    description: 'Soulbound token for verifiable health identity',
    deployedAt: new Date('2025-10-14'),
    version: '1.0.0',
    verified: true,
    txCount: 45,
  },
  {
    name: 'StudyRegistry',
    address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    category: 'studies',
    description: 'Clinical trial registry and management',
    deployedAt: new Date('2025-10-14'),
    version: '1.0.0',
    verified: true,
    txCount: 23,
  },
  {
    name: 'StudyEscrow',
    address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    category: 'escrow',
    description: 'Escrow contract for study funding',
    deployedAt: new Date('2025-10-14'),
    version: '1.0.0',
    verified: true,
    txCount: 12,
  },
  {
    name: 'EligibilityCodeVerifier',
    address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    category: 'verification',
    description: 'ZK proof verifier for eligibility codes',
    deployedAt: new Date('2025-10-14'),
    version: '1.0.0',
    verified: true,
    txCount: 8,
  },
  {
    name: 'MockHumanPassport',
    address: '0x0540017f66790fdaadfe2c84b50935012bca3b5e',
    category: 'identity',
    description: 'Human verification passport (mock for testing)',
    deployedAt: new Date('2025-10-14'),
    version: '1.0.0',
    verified: true,
    txCount: 34,
  },
];

export default function ContractsPage() {
  const { address } = useAccount();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isSuperAdmin(address)) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required to view contracts.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const filteredContracts =
    selectedCategory === 'all'
      ? DEPLOYED_CONTRACTS
      : DEPLOYED_CONTRACTS.filter((c) => c.category === selectedCategory);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileCode className="h-8 w-8 text-accent" />
            Smart Contracts
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all deployed smart contracts on Optimism Sepolia
          </p>
        </div>

        {/* Network Info */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Network: Optimism Sepolia</h3>
              <p className="text-sm text-muted-foreground">Chain ID: 11155420 (Testnet)</p>
            </div>
            <a
              href="https://sepolia-optimism.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              View on Explorer
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            icon={<Database className="h-6 w-6" />}
            label="Total Contracts"
            value={DEPLOYED_CONTRACTS.length}
            color="primary"
          />
          <StatsCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            label="Verified"
            value={DEPLOYED_CONTRACTS.filter((c) => c.verified).length}
            color="success"
          />
          <StatsCard
            icon={<Shield className="h-6 w-6" />}
            label="Identity Contracts"
            value={DEPLOYED_CONTRACTS.filter((c) => c.category === 'identity').length}
            color="accent"
          />
          <StatsCard
            icon={<Beaker className="h-6 w-6" />}
            label="Study Contracts"
            value={
              DEPLOYED_CONTRACTS.filter(
                (c) => c.category === 'studies' || c.category === 'escrow'
              ).length
            }
            color="success"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <CategoryPill
            label="All Contracts"
            category="all"
            selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            count={DEPLOYED_CONTRACTS.length}
          />
          <CategoryPill
            label="Identity"
            category="identity"
            selected={selectedCategory === 'identity'}
            onClick={() => setSelectedCategory('identity')}
            count={DEPLOYED_CONTRACTS.filter((c) => c.category === 'identity').length}
          />
          <CategoryPill
            label="Studies"
            category="studies"
            selected={selectedCategory === 'studies'}
            onClick={() => setSelectedCategory('studies')}
            count={DEPLOYED_CONTRACTS.filter((c) => c.category === 'studies').length}
          />
          <CategoryPill
            label="Escrow"
            category="escrow"
            selected={selectedCategory === 'escrow'}
            onClick={() => setSelectedCategory('escrow')}
            count={DEPLOYED_CONTRACTS.filter((c) => c.category === 'escrow').length}
          />
          <CategoryPill
            label="Verification"
            category="verification"
            selected={selectedCategory === 'verification'}
            onClick={() => setSelectedCategory('verification')}
            count={DEPLOYED_CONTRACTS.filter((c) => c.category === 'verification').length}
          />
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredContracts.map((contract, index) => (
            <motion.div
              key={contract.address}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <CategoryIcon category={contract.category} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold">{contract.name}</h3>
                      {contract.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">v{contract.version}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{contract.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                        {contract.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(contract.address)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`https://sepolia-optimism.etherscan.io/address/${contract.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Deployed: {contract.deployedAt.toLocaleDateString()}</span>
                      {contract.txCount !== undefined && (
                        <span>{contract.txCount} transactions</span>
                      )}
                    </div>
                  </div>
                </div>
                <CategoryBadge category={contract.category} />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Link
                  href={`/superadmin/contracts/${contract.category}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://sepolia-optimism.etherscan.io/address/${contract.address}#code`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  View Source Code
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
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
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  category: _category,
  selected,
  onClick,
  count,
}: {
  label: string;
  category: string;
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

function CategoryBadge({ category }: { category: string }) {
  const config: Record<
    string,
    { color: string; label: string }
  > = {
    identity: { color: 'bg-primary/10 text-primary', label: 'Identity' },
    studies: { color: 'bg-success/10 text-success', label: 'Studies' },
    escrow: { color: 'bg-accent/10 text-accent', label: 'Escrow' },
    verification: { color: 'bg-warning/10 text-warning', label: 'Verification' },
    governance: { color: 'bg-destructive/10 text-destructive', label: 'Governance' },
  };

  const { color, label } = config[category] || config.identity;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ReactNode> = {
    identity: <Shield className="h-6 w-6 text-primary" />,
    studies: <Beaker className="h-6 w-6 text-success" />,
    escrow: <DollarSign className="h-6 w-6 text-accent" />,
    verification: <CheckCircle2 className="h-6 w-6 text-warning" />,
    governance: <Network className="h-6 w-6 text-destructive" />,
  };

  return icons[category] || icons.identity;
}
