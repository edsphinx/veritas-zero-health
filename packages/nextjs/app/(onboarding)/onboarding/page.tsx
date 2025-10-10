/**
 * Onboarding Page
 *
 * Multi-step onboarding flow for new patients
 * Steps:
 * 1. Connect Wallet
 * 2. Verify Human Passport
 * 3. Setup complete
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Shield, Wallet as WalletIcon } from 'lucide-react';
import { HumanWalletConnect } from '@/presentation/components/features/auth/HumanWalletConnect';
import { HumanPassportButton } from '@/presentation/components/features/auth/HumanPassportButton';
import { HumanVerificationBadge } from '@/presentation/components/features/auth/HumanVerificationBadge';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { cn } from '@/shared/lib/utils';

type OnboardingStep = 'wallet' | 'passport' | 'complete';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('wallet');
  const { address, isConnected } = useAccount();
  const { isVerified } = useHumanPassport({
    address,
    enabled: !!address,
  });

  // Auto-advance steps
  const handleWalletConnected = (addr: string) => {
    console.log('Wallet connected:', addr);
    setTimeout(() => setCurrentStep('passport'), 500);
  };

  const handleVerified = (score: number) => {
    console.log('Verified with score:', score);
    setTimeout(() => setCurrentStep('complete'), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-3">
              Welcome to Veritas Zero Health
            </h1>
            <p className="text-lg text-muted-foreground">
              Join the future of private, verifiable clinical trials
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{
                    width:
                      currentStep === 'wallet'
                        ? '0%'
                        : currentStep === 'passport'
                        ? '50%'
                        : '100%',
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Step 1: Wallet */}
              <StepIndicator
                step={1}
                title="Connect Wallet"
                isActive={currentStep === 'wallet'}
                isComplete={isConnected}
              />

              {/* Step 2: Passport */}
              <StepIndicator
                step={2}
                title="Verify Identity"
                isActive={currentStep === 'passport'}
                isComplete={isVerified}
              />

              {/* Step 3: Complete */}
              <StepIndicator
                step={3}
                title="Complete"
                isActive={currentStep === 'complete'}
                isComplete={currentStep === 'complete'}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <WalletIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred login method
                    </p>
                  </div>
                </div>

                <HumanWalletConnect onConnected={handleWalletConnected} />
              </motion.div>
            )}

            {currentStep === 'passport' && (
              <motion.div
                key="passport"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Verify Your Identity</h2>
                      <p className="text-sm text-muted-foreground">
                        Prove you&apos;re a unique human with Human Passport
                      </p>
                    </div>
                  </div>

                  {/* Verification Status */}
                  {!isVerified ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4 text-sm">
                        <p className="font-medium mb-2">Why verify?</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Prevents fake accounts and ensures fair access</li>
                          <li>• Required to apply to clinical trials</li>
                          <li>• One-time verification, valid across all studies</li>
                          <li>• Your medical data remains private</li>
                        </ul>
                      </div>

                      <HumanPassportButton
                        address={address}
                        onVerified={handleVerified}
                        size="lg"
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <HumanVerificationBadge address={address} showDetails />
                  )}
                </div>

                {/* Navigation */}
                {isVerified && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setCurrentStep('complete')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                )}
              </motion.div>
            )}

            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-xl p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex rounded-full bg-green-600 p-4 mb-6"
                >
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-3">
                  You&apos;re All Set!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Your account is ready. You can now browse clinical trials and apply
                  anonymously with zero-knowledge proofs.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Wallet Connected</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {address?.substring(0, 6)}...{address?.substring(38)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">Human Verified</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sybil-resistant identity confirmed
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.a
                    href="/trials"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
                  >
                    Browse Clinical Trials
                  </motion.a>
                  <motion.a
                    href="/dashboard"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 rounded-lg border border-border bg-card px-6 py-3 font-medium hover:bg-accent transition-colors"
                  >
                    Go to Dashboard
                  </motion.a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            <p>
              Need help? Read our{' '}
              <a href="/docs" className="text-primary hover:underline">
                documentation
              </a>{' '}
              or{' '}
              <a href="/support" className="text-primary hover:underline">
                contact support
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({
  step,
  title,
  isActive,
  isComplete,
}: {
  step: number;
  title: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 relative">
      <motion.div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
          isComplete
            ? 'bg-primary text-primary-foreground'
            : isActive
            ? 'bg-primary/20 text-primary border-2 border-primary'
            : 'bg-muted text-muted-foreground'
        )}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
      >
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <span>{step}</span>
        )}
      </motion.div>
      <span
        className={cn(
          'text-xs font-medium absolute -bottom-6 whitespace-nowrap',
          isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {title}
      </span>
    </div>
  );
}
