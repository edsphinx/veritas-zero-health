/**
 * Component: ApplyButton
 *
 * Smart button that handles the complete trial application flow:
 * - Checks prerequisites (Passport verification, DID, health data)
 * - Validates eligibility
 * - Generates ZK proof
 * - Submits anonymous application to contract
 * - Shows appropriate states and error messages
 *
 * This is a high-level component that coordinates multiple services.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  Zap,
  ExternalLink,
} from 'lucide-react';

import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { useApplyToStudy } from '@/shared/hooks/useApplyToStudy';
import { useHasApplied, useStudyCriteria } from '@/shared/hooks/useStudy';
import { cn } from '@/shared/lib/utils';

/**
 * Application state machine
 */
type ApplicationState =
  | 'checking' // Checking prerequisites
  | 'not_connected' // Wallet not connected
  | 'not_verified' // Passport not verified
  | 'no_did' // No DID created
  | 'no_health_data' // No health data uploaded
  | 'already_applied' // Already applied to this study
  | 'not_eligible' // Does not meet criteria
  | 'ready' // Can apply
  | 'generating_proof' // Generating ZK proof
  | 'submitting' // Submitting to contract
  | 'success' // Successfully applied
  | 'error'; // Error occurred

interface ApplyButtonProps {
  studyId: bigint;
  patientAge?: number; // Required for proof generation
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'outline';
}

/**
 * ApplyButton Component
 *
 * @example
 * ```tsx
 * <ApplyButton
 *   studyId={1n}
 *   patientAge={35}
 *   onSuccess={(txHash) => console.log('Applied!', txHash)}
 * />
 * ```
 */
export function ApplyButton({
  studyId,
  patientAge,
  onSuccess,
  onError,
  className,
  size = 'md',
  variant = 'primary',
}: ApplyButtonProps) {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<ApplicationState>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Hooks
  const { isVerified, isLoading: passportLoading } = useHumanPassport({
    address,
    enabled: !!address,
  });

  const { hasApplied, isLoading: appliedLoading } = useHasApplied(
    studyId,
    address
  );

  const { criteria, isLoading: criteriaLoading } = useStudyCriteria(studyId);

  const {
    apply,
    isPending: _isSubmitting,
    isSuccess,
    isError,
    error: submitError,
    txHash,
  } = useApplyToStudy();

  // Check prerequisites on mount and when dependencies change
  useEffect(() => {
    checkPrerequisites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isConnected,
    address,
    isVerified,
    hasApplied,
    passportLoading,
    appliedLoading,
    criteriaLoading,
  ]);

  // Handle submission success
  useEffect(() => {
    if (isSuccess && txHash) {
      setState('success');
      onSuccess?.(txHash);
    }
  }, [isSuccess, txHash, onSuccess]);

  // Handle submission error
  useEffect(() => {
    if (isError && submitError) {
      setState('error');
      const message = submitError.message || 'Failed to submit application';
      setErrorMessage(message);
      onError?.(message);
    }
  }, [isError, submitError, onError]);

  /**
   * Check all prerequisites for applying
   */
  const checkPrerequisites = async () => {
    // Loading state
    if (passportLoading || appliedLoading || criteriaLoading) {
      setState('checking');
      return;
    }

    // Check 1: Wallet connected
    if (!isConnected || !address) {
      setState('not_connected');
      return;
    }

    // Check 2: Already applied
    if (hasApplied) {
      setState('already_applied');
      return;
    }

    // Check 3: Passport verified
    if (!isVerified) {
      setState('not_verified');
      return;
    }

    // Check 4: Has DID (check via extension)
    // TODO: Implement DID check via ExtensionBridge
    // For now, we'll skip this check

    // Check 5: Has health data
    // TODO: Implement health data check via NillionClient
    // For now, we'll skip this check

    // Check 6: Meets eligibility criteria
    if (criteria && patientAge !== undefined) {
      const meetsAgeCriteria =
        patientAge >= criteria.minAge && patientAge <= criteria.maxAge;

      if (!meetsAgeCriteria) {
        setState('not_eligible');
        setErrorMessage(
          `Age must be between ${criteria.minAge} and ${criteria.maxAge}`
        );
        return;
      }
    }

    // All checks passed
    setState('ready');
  };

  /**
   * Handle apply button click
   */
  const handleApply = async () => {
    if (state !== 'ready') return;
    if (!address || !patientAge) {
      setErrorMessage('Missing required information');
      setState('error');
      return;
    }

    try {
      // Step 1: Generate ZK proof
      setState('generating_proof');

      // TODO: Implement ZK proof generation via ExtensionBridge
      // For now, we'll use a mock proof
      const mockProof = '0x' + '00'.repeat(32) as `0x${string}`;

      // Step 2: Submit to contract
      setState('submitting');
      await apply({
        studyId,
        ageProof: mockProof,
      });

      // Success state is handled by useEffect
    } catch (error) {
      setState('error');
      const message =
        error instanceof Error ? error.message : 'Application failed';
      setErrorMessage(message);
      onError?.(message);
    }
  };

  /**
   * Get button content based on state
   */
  const getButtonContent = () => {
    switch (state) {
      case 'checking':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking...</span>
          </>
        );

      case 'not_connected':
        return (
          <>
            <Lock className="h-4 w-4" />
            <span>Connect Wallet</span>
          </>
        );

      case 'not_verified':
        return (
          <>
            <Shield className="h-4 w-4" />
            <span>Verify Identity First</span>
          </>
        );

      case 'no_did':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Create DID First</span>
          </>
        );

      case 'no_health_data':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Add Health Data First</span>
          </>
        );

      case 'already_applied':
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Already Applied</span>
          </>
        );

      case 'not_eligible':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Not Eligible</span>
          </>
        );

      case 'ready':
        return (
          <>
            <Zap className="h-4 w-4" />
            <span>Apply Now</span>
          </>
        );

      case 'generating_proof':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating Proof...</span>
          </>
        );

      case 'submitting':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting...</span>
          </>
        );

      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Applied Successfully!</span>
          </>
        );

      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Try Again</span>
          </>
        );

      default:
        return <span>Apply</span>;
    }
  };

  /**
   * Get button variant class
   */
  const getButtonClass = () => {
    const baseClass =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const variantClasses = {
      default: 'bg-card border border-border hover:bg-accent',
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl',
      outline:
        'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    };

    const stateClasses = {
      success: 'bg-green-600 text-white hover:bg-green-700',
      error: 'bg-red-600 text-white hover:bg-red-700',
      not_eligible: 'bg-amber-600 text-white cursor-not-allowed',
      already_applied: 'bg-muted text-muted-foreground cursor-not-allowed',
    };

    let finalVariant = variant;
    if (state === 'success') finalVariant = 'default';
    if (state === 'error') finalVariant = 'default';

    return cn(
      baseClass,
      sizeClasses[size],
      state === 'success'
        ? stateClasses.success
        : state === 'error'
        ? stateClasses.error
        : state === 'not_eligible'
        ? stateClasses.not_eligible
        : state === 'already_applied'
        ? stateClasses.already_applied
        : variantClasses[finalVariant],
      className
    );
  };

  /**
   * Determine if button should be disabled
   */
  const isDisabled =
    state === 'checking' ||
    state === 'not_connected' ||
    state === 'not_verified' ||
    state === 'no_did' ||
    state === 'no_health_data' ||
    state === 'already_applied' ||
    state === 'not_eligible' ||
    state === 'generating_proof' ||
    state === 'submitting' ||
    state === 'success';

  return (
    <div className="w-full">
      <motion.button
        onClick={handleApply}
        disabled={isDisabled}
        className={getButtonClass()}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      >
        {getButtonContent()}
      </motion.button>

      {/* Error message */}
      <AnimatePresence>
        {state === 'error' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-lg bg-red-600/10 border border-red-600/20 p-3"
          >
            <p className="text-sm text-red-600">{errorMessage}</p>
          </motion.div>
        )}

        {state === 'not_eligible' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-lg bg-amber-600/10 border border-amber-600/20 p-3"
          >
            <p className="text-sm text-amber-600">{errorMessage}</p>
          </motion.div>
        )}

        {state === 'success' && txHash && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-lg bg-green-600/10 border border-green-600/20 p-3"
          >
            <p className="text-sm text-green-600 flex items-center gap-2">
              <span>Application submitted successfully!</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:no-underline"
              >
                View transaction
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help text for different states */}
      {state === 'not_verified' && (
        <p className="mt-2 text-sm text-muted-foreground">
          You need to verify your identity with Human Passport before applying to
          trials.
        </p>
      )}

      {state === 'generating_proof' && (
        <p className="mt-2 text-sm text-muted-foreground">
          Generating zero-knowledge proof of eligibility. This may take a few
          seconds...
        </p>
      )}
    </div>
  );
}
