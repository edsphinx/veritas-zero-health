/**
 * SuperAdmin System Configuration Page
 *
 * Manage network settings, environment variables, and system parameters
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import {
  Settings,
  Network,
  Server,
  Key,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Globe,
  Database,
  Lock,
  Zap,
} from 'lucide-react';
import { SuperAdminLayout } from '@/components/layout';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';

interface SystemConfig {
  network: {
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    name: string;
  };
  contracts: {
    healthIdentitySBT: string;
    studyRegistry: string;
    studyEscrow: string;
    eligibilityVerifier: string;
  };
  features: {
    zkProofs: boolean;
    nillionEncryption: boolean;
    humanPassport: boolean;
    studyRegistry: boolean;
  };
  limits: {
    maxStudyParticipants: number;
    minEscrowAmount: string;
    maxFileSize: number;
  };
}

const DEFAULT_CONFIG: SystemConfig = {
  network: {
    chainId: 11155420,
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    name: 'Optimism Sepolia',
  },
  contracts: {
    healthIdentitySBT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    studyRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    studyEscrow: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    eligibilityVerifier: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  },
  features: {
    zkProofs: true,
    nillionEncryption: true,
    humanPassport: true,
    studyRegistry: true,
  },
  limits: {
    maxStudyParticipants: 1000,
    minEscrowAmount: '0.01',
    maxFileSize: 10,
  },
};

export default function SystemConfigPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isSuperAdmin(address)) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              SuperAdmin privileges required to access system configuration.
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              System Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage network settings, contracts, and system parameters
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-success font-medium">Configuration saved successfully!</span>
          </motion.div>
        )}

        {/* Network Status */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Current Network</h3>
              <p className="text-sm text-muted-foreground">
                Connected to {config.network.name} (Chain ID: {chainId})
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Connected
            </div>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6">
          {/* Network Settings */}
          <ConfigSection
            icon={<Globe className="h-6 w-6" />}
            title="Network Settings"
            description="Configure blockchain network parameters"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConfigField
                label="Chain ID"
                value={config.network.chainId.toString()}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    network: { ...config.network, chainId: parseInt(value) },
                  })
                }
                type="number"
              />
              <ConfigField
                label="Network Name"
                value={config.network.name}
                onChange={(value) =>
                  setConfig({ ...config, network: { ...config.network, name: value } })
                }
              />
              <ConfigField
                label="RPC URL"
                value={config.network.rpcUrl}
                onChange={(value) =>
                  setConfig({ ...config, network: { ...config.network, rpcUrl: value } })
                }
                className="md:col-span-2"
              />
              <ConfigField
                label="Explorer URL"
                value={config.network.explorerUrl}
                onChange={(value) =>
                  setConfig({ ...config, network: { ...config.network, explorerUrl: value } })
                }
                className="md:col-span-2"
              />
            </div>
          </ConfigSection>

          {/* Contract Addresses */}
          <ConfigSection
            icon={<Database className="h-6 w-6" />}
            title="Contract Addresses"
            description="Deployed smart contract addresses"
          >
            <div className="space-y-4">
              <ConfigField
                label="Health Identity SBT"
                value={config.contracts.healthIdentitySBT}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    contracts: { ...config.contracts, healthIdentitySBT: value },
                  })
                }
                mono
              />
              <ConfigField
                label="Study Registry"
                value={config.contracts.studyRegistry}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    contracts: { ...config.contracts, studyRegistry: value },
                  })
                }
                mono
              />
              <ConfigField
                label="Study Escrow"
                value={config.contracts.studyEscrow}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    contracts: { ...config.contracts, studyEscrow: value },
                  })
                }
                mono
              />
              <ConfigField
                label="Eligibility Verifier"
                value={config.contracts.eligibilityVerifier}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    contracts: { ...config.contracts, eligibilityVerifier: value },
                  })
                }
                mono
              />
            </div>
          </ConfigSection>

          {/* Feature Flags */}
          <ConfigSection
            icon={<Zap className="h-6 w-6" />}
            title="Feature Flags"
            description="Enable or disable platform features"
          >
            <div className="space-y-4">
              <ToggleField
                label="ZK Proofs"
                description="Enable zero-knowledge proof verification for eligibility"
                enabled={config.features.zkProofs}
                onChange={(enabled) =>
                  setConfig({
                    ...config,
                    features: { ...config.features, zkProofs: enabled },
                  })
                }
              />
              <ToggleField
                label="Nillion Encryption"
                description="Enable Nillion blind computation for sensitive health data"
                enabled={config.features.nillionEncryption}
                onChange={(enabled) =>
                  setConfig({
                    ...config,
                    features: { ...config.features, nillionEncryption: enabled },
                  })
                }
              />
              <ToggleField
                label="Human Passport"
                description="Require Gitcoin Passport verification for users"
                enabled={config.features.humanPassport}
                onChange={(enabled) =>
                  setConfig({
                    ...config,
                    features: { ...config.features, humanPassport: enabled },
                  })
                }
              />
              <ToggleField
                label="Study Registry"
                description="Enable clinical trial registry functionality"
                enabled={config.features.studyRegistry}
                onChange={(enabled) =>
                  setConfig({
                    ...config,
                    features: { ...config.features, studyRegistry: enabled },
                  })
                }
              />
            </div>
          </ConfigSection>

          {/* System Limits */}
          <ConfigSection
            icon={<Lock className="h-6 w-6" />}
            title="System Limits"
            description="Configure platform limits and restrictions"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ConfigField
                label="Max Study Participants"
                value={config.limits.maxStudyParticipants.toString()}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    limits: { ...config.limits, maxStudyParticipants: parseInt(value) },
                  })
                }
                type="number"
              />
              <ConfigField
                label="Min Escrow Amount (ETH)"
                value={config.limits.minEscrowAmount}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    limits: { ...config.limits, minEscrowAmount: value },
                  })
                }
                type="number"
                step="0.001"
              />
              <ConfigField
                label="Max File Size (MB)"
                value={config.limits.maxFileSize.toString()}
                onChange={(value) =>
                  setConfig({
                    ...config,
                    limits: { ...config.limits, maxFileSize: parseInt(value) },
                  })
                }
                type="number"
              />
            </div>
          </ConfigSection>

          {/* Warning */}
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning">
              <p className="font-semibold mb-1">Configuration Warning</p>
              <p>
                Changing these settings may affect platform functionality. Make sure you understand
                the implications before saving changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function ConfigSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  type = 'text',
  step,
  mono = false,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className={`w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
          mono ? 'font-mono text-sm' : ''
        }`}
      />
    </div>
  );
}

function ToggleField({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div className="flex-1">
        <h4 className="font-medium mb-1">{label}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-success' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
