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

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Shield, Wallet as WalletIcon, RefreshCw } from 'lucide-react';
import { WalletConnectButton } from '@/components/WalletConnect';
import { HumanPassportButton } from '@/presentation/components/features/auth/HumanPassportButton';
import { HumanVerificationBadge } from '@/presentation/components/features/auth/HumanVerificationBadge';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { cn } from '@/shared/lib/utils';

type OnboardingStep = 'wallet' | 'passport' | 'complete';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('wallet');
  const [isPolling, setIsPolling] = useState(false);
  const { address, isConnected } = useAccount();
  const { isVerified, refetch, isLoading: isCheckingVerification, humanityScore } = useHumanPassport({
    address,
    enabled: !!address,
  });

  // Auto-advance steps based on wallet connection
  useEffect(() => {
    if (isConnected && address && currentStep === 'wallet') {
      console.log('Wallet connected:', address);

      // Notify browser extension if opened from extension
      const notifyExtension = async () => {
        try {
          // First, set cookies via API
          await fetch('/api/extension/wallet/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              address,
              method: 'web3',
            }),
          });

          console.log('✅ Wallet info stored in session cookies');

          // Try to get extension ID from URL params or localStorage
          const urlParams = new URLSearchParams(window.location.search);
          const extensionId = urlParams.get('extensionId') ||
                             localStorage.getItem('veritas_extension_id');

          // Check if Chrome extension API is available
          const chromeRuntime = (window as any).chrome?.runtime;

          if (extensionId && chromeRuntime) {
            // Send wallet connection update to extension
            chromeRuntime.sendMessage(
              extensionId,
              {
                type: 'UPDATE_WALLET_CONNECTION',
                data: {
                  origin: window.location.origin,
                  address,
                  method: 'web3',
                  isVerified: false, // Will update when passport verified
                  humanityScore: 0,
                },
              },
              (response: any) => {
                if (chromeRuntime.lastError) {
                  console.warn('Extension message failed:', chromeRuntime.lastError);
                } else {
                  console.log('✅ Extension notified of wallet connection');
                }
              }
            );
          } else {
            console.log('⚠️ No extension ID found, using cookies only');
          }
        } catch (error) {
          console.error('Failed to notify extension:', error);
        }
      };

      notifyExtension();
      setTimeout(() => setCurrentStep('passport'), 500);
    }
  }, [isConnected, address, currentStep]);

  // Auto-advance to complete when verified
  useEffect(() => {
    if (isVerified && currentStep === 'passport' && address) {
      console.log('User verified, advancing to complete');
      setIsPolling(false); // Stop polling when verified

      // Update passport verification status in session
      fetch('/api/extension/passport/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address }),
      })
        .then(() => console.log('✅ Passport status updated in session'))
        .catch(console.error);

      // Notify extension of verification status update
      const notifyExtensionVerification = async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const extensionId = urlParams.get('extensionId') ||
                             localStorage.getItem('veritas_extension_id');
          const chromeRuntime = (window as any).chrome?.runtime;

          if (extensionId && chromeRuntime) {
            chromeRuntime.sendMessage(
              extensionId,
              {
                type: 'UPDATE_WALLET_CONNECTION',
                data: {
                  origin: window.location.origin,
                  address,
                  method: 'web3',
                  isVerified: true,
                  humanityScore: humanityScore || 0,
                },
              },
              (response: any) => {
                if (chromeRuntime.lastError) {
                  console.warn('Extension verification update failed:', chromeRuntime.lastError);
                } else {
                  console.log('✅ Extension notified of verification');
                }
              }
            );
          }
        } catch (error) {
          console.error('Failed to notify extension of verification:', error);
        }
      };

      notifyExtensionVerification();

      setTimeout(() => setCurrentStep('complete'), 1000);
    }
  }, [isVerified, currentStep, address, humanityScore]);

  // DISABLED: Auto-polling causes rate limiting
  // Users must manually click "Check Verification Status" button
  // useEffect(() => {
  //   if (!isPolling || !address || isVerified || currentStep !== 'passport') {
  //     return;
  //   }
  //   ...
  // }, [isPolling, address, isVerified, currentStep, refetch]);

  const handleVerified = (score: number) => {
    console.log('Verified with score:', score);
    setIsPolling(false); // Stop polling when verified
    setTimeout(() => setCurrentStep('complete'), 500);
  };

  const handleCheckStatus = async () => {
    // Manual check - no auto-polling to avoid rate limiting
    if (refetch) {
      await refetch();
    }
  };

  const handleVerifyClick = () => {
    // Don't auto-poll - user must click "Check Status" button manually
    // This prevents rate limiting from Passport API
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
              Welcome to DASHI
            </h1>
            <p className="text-lg text-muted-foreground">
              Create your sovereign health identity with privacy and control
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
                      Choose your preferred wallet provider
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-8">
                  <WalletConnectButton />

                  <p className="text-xs text-muted-foreground text-center max-w-md">
                    We support MetaMask, WalletConnect, Coinbase Wallet, and more.
                    Your wallet is your identity in DASHI.
                  </p>
                </div>
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

                      <div className="rounded-lg bg-blue-600/10 border border-blue-600/20 p-4 text-sm">
                        <p className="font-medium mb-2 text-blue-600">How it works:</p>
                        <ol className="space-y-1 text-blue-600/80 list-decimal list-inside">
                          <li>Click the button below to open Human Passport</li>
                          <li>Connect your wallet and add verification stamps</li>
                          <li>Return here to see your verified status</li>
                        </ol>
                        {humanityScore !== undefined && (
                          <p className="text-xs text-blue-600/70 mt-2">
                            Current score: {humanityScore} (Need ≥ 20 to verify)
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <HumanPassportButton
                          address={address}
                          onVerified={handleVerified}
                          onVerificationStart={handleVerifyClick}
                          size="lg"
                          className="w-full"
                        />

                        <div className="rounded-lg bg-blue-600/10 border border-blue-600/20 p-3 text-sm">
                          <p className="text-blue-600 font-medium">After verifying on Passport:</p>
                          <p className="text-xs text-blue-600/70 mt-1">
                            Click the "Check Verification Status" button below to update your status.
                          </p>
                        </div>

                        <button
                          onClick={handleCheckStatus}
                          disabled={isCheckingVerification}
                          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium hover:bg-accent transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={cn("h-5 w-5", isCheckingVerification && "animate-spin")} />
                          {isCheckingVerification ? 'Checking...' : 'Check Verification Status'}
                        </button>
                      </div>
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
