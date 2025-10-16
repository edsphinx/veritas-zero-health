/**
 * Studies Page (Public View)
 *
 * Main page for browsing and applying to clinical studies.
 * Shows recruiting studies with filtering, search, and quick apply.
 * Public view - accessible to all users (with/without wallet).
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Sparkles,
  Shield,
  Lock,
  ArrowRight,
} from 'lucide-react';

import { StudyList } from '@/components/trials';
import { HumanVerificationBadge } from '@/components/auth/HumanVerificationBadge';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { StudyStatus } from '@/shared/hooks/useStudy';
import { cn } from '@/shared/lib/utils';

export default function StudiesPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isVerified, isLoading: passportLoading } = useHumanPassport({
    address,
    enabled: !!address,
  });

  const [regionFilter, setRegionFilter] = useState<string>('');

  // Handle apply button click
  const handleApplyClick = (studyId: bigint) => {
    if (!isConnected) {
      // Redirect to wallet connection
      router.push('/');
      return;
    }

    if (!isVerified) {
      // Redirect to onboarding
      router.push('/onboarding');
      return;
    }

    // Navigate to study details page
    router.push(`/patient/studies/${studyId.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12"
        >
          {/* Hero */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-4"
            >
              <Sparkles className="h-4 w-4" />
              <span>Anonymous & Verifiable Clinical Studies</span>
            </motion.div>

            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Find Your Clinical Study
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse active clinical studies and apply anonymously using zero-knowledge
              proofs. Your privacy is guaranteed.
            </p>
          </div>

          {/* Verification Status Banner */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              {isVerified ? (
                <div className="rounded-xl border border-green-600/20 bg-green-600/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-600 p-2">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-green-600 mb-1">
                        Verified & Ready to Apply
                      </h3>
                      <p className="text-sm text-green-600/80 mb-3">
                        You&apos;re verified with Human Passport. You can now apply to
                        clinical studies anonymously.
                      </p>
                      <HumanVerificationBadge address={address} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-600/20 bg-amber-600/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-amber-600 p-2">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-amber-600 mb-1">
                        Verification Required
                      </h3>
                      <p className="text-sm text-amber-600/80 mb-4">
                        Complete Human Passport verification to apply to clinical studies.
                      </p>
                      <button
                        onClick={() => router.push('/onboarding')}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
                      >
                        Start Verification
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 rounded-xl border border-blue-600/20 bg-blue-600/10 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-600 p-2">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-blue-600 mb-1">
                    Connect Your Wallet
                  </h3>
                  <p className="text-sm text-blue-600/80 mb-4">
                    Connect your wallet to view personalized study recommendations and
                    apply anonymously.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Connect Wallet
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Region Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium mb-2">
              Filter by Region (Optional)
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g., North America, Europe, Asia..."
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Studies List */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-7xl mx-auto"
        >
          <StudyList
            statusFilter={StudyStatus.Recruiting}
            regionFilter={regionFilter}
            showApplyButton={true}
            onApplyClick={handleApplyClick}
          />
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto mt-16 pt-8 border-t border-border"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">100% Private</h3>
              <p className="text-sm text-muted-foreground">
                Your medical data never leaves your device
              </p>
            </div>

            <div>
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Anonymous</h3>
              <p className="text-sm text-muted-foreground">
                Apply without revealing your identity
              </p>
            </div>

            <div>
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Verifiable</h3>
              <p className="text-sm text-muted-foreground">
                Prove eligibility with zero-knowledge proofs
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
