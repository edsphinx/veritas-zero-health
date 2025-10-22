/**
 * Study Creation Wizard - TX Between Steps
 *
 * Multi-step wizard with blockchain transaction execution between each step.
 * Features resumability, checkpointing, and incremental data indexing.
 *
 * Flow:
 * 1. EscrowStep → TX1 → Checkpoint
 * 2. RegistryStep → TX2 → Checkpoint
 * 3. CriteriaStep → TX3 → Checkpoint
 * 4. MilestonesStep → TX4 → Complete
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FlaskConical, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { ProgressIndicator } from '../ProgressIndicator';

import { useAuth } from '@/hooks/useAuth';

import { EscrowStep } from './EscrowStep';
import { RegistryStep } from './RegistryStep';
import { CriteriaStep } from './CriteriaStep';
import { MilestonesStep } from './MilestonesStep';
import { ResumeBanner } from './ResumeBanner';

import {
  useStudyCreationStore,
  type EscrowStepFormData,
  type RegistryStepFormData,
  type CriteriaStepFormData,
} from '@/stores/studyCreationStore';

// ============================================
// Constants
// ============================================

const STEP_LABELS = [
  'Escrow Setup',
  'Registry Publication',
  'Eligibility Criteria',
  'Milestones',
];

// ============================================
// Component
// ============================================

export function StudyCreationWizard() {
  const router = useRouter();
  const { user } = useAuth(); // Get user from useAuth hook

  // Guard against React Strict Mode double execution
  const isInitializingRef = useRef(false);

  const {
    status,
    ids,
    txHashes,
    formData,
    userAddress,
    canResume,
    getCurrentStep,
    startCreation,
    cancelCreation,
    completeEscrowTx,
    completeRegistryTx,
    completeCriteriaTx,
    completeMilestonesTx,
    completeCreation,
    setError,
    reset,
  } = useStudyCreationStore();

  const currentStep = getCurrentStep();
  const isResuming = canResume();

  // Initialize creation if starting fresh
  useEffect(() => {
    // Wait for user to load
    if (!user?.address) {
      return;
    }

    const currentUserAddress = user.address.toLowerCase();

    // Check if store has data from a different user
    if (userAddress && userAddress !== currentUserAddress) {
      console.log('[Wizard] Store belongs to different user, resetting...', {
        storeUser: userAddress,
        currentUser: currentUserAddress,
      });
      cancelCreation(); // Clear store data from previous user
      isInitializingRef.current = false; // Reset flag for new user
      return;
    }

    // Check if already creating or resuming
    if (status !== 'idle') {
      console.log('[Wizard] Resuming existing creation, status:', status, 'databaseId:', ids.databaseId);
      return; // Don't create new study, resume existing
    }

    // Check if we have a databaseId in store (persisted from previous session)
    if (ids.databaseId) {
      console.log('[Wizard] Found existing databaseId in store:', ids.databaseId);
      return; // Already initialized, don't create duplicate
    }

    // Guard against React Strict Mode double execution
    if (isInitializingRef.current) {
      console.log('[Wizard] Initialization already in progress, skipping duplicate call');
      return;
    }

    // Only create new study if truly idle and no databaseId
    const initializeStudy = async () => {
      // Mark as initializing BEFORE the async call
      isInitializingRef.current = true;
      try {
        console.log('[Wizard] Creating new initial study for user:', currentUserAddress);
        const response = await fetch('/api/studies/create-initial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '', // Will be set in wizard
            description: '', // Will be set in wizard
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create initial study');
        }

        const result = await response.json();
        console.log('[Wizard] Initial study created:', result.data.studyId);

        // Start wizard with database ID and user address
        startCreation(result.data.studyId, currentUserAddress, {});
      } catch (error) {
        console.error('[Wizard] Failed to initialize study:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize study');
      }
    };

    initializeStudy();
  }, [user, status, ids.databaseId, userAddress, startCreation, setError, cancelCreation]);

  // ============================================
  // Step 1: Escrow Configuration
  // ============================================

  const handleEscrowComplete = async (
    data: EscrowStepFormData,
    txHash: string,
    escrowId: bigint
  ) => {
    try {
      // Save to Zustand (persists to localStorage)
      completeEscrowTx(txHash, escrowId);

      // Index to database via API
      const response = await fetch('/api/studies/wizard/index-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'escrow',
          txHash,
          totalFunding: data.totalFunding,
          // Pass database ID so API can find the study
          databaseId: ids.databaseId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index escrow step');
      }

      const result = await response.json();
      console.log('[Wizard] Escrow indexed:', result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to index escrow data';
      setError(message);
      throw error;
    }
  };

  // ============================================
  // Step 2: Registry Publication
  // ============================================

  const handleRegistryComplete = async (
    data: Omit<RegistryStepFormData, 'escrowId'>,
    txHash: string,
    registryId: bigint
  ) => {
    try {
      completeRegistryTx(txHash, registryId);

      // Index to database via API
      const response = await fetch('/api/studies/wizard/index-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'registry',
          txHash,
          databaseId: ids.databaseId,
          registryId: registryId.toString(),
          escrowId: ids.escrowId?.toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index registry step');
      }

      const result = await response.json();
      console.log('[Wizard] Registry indexed:', result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to index registry data';
      setError(message);
      throw error;
    }
  };

  // ============================================
  // Step 3: Criteria Setup
  // ============================================

  const handleCriteriaComplete = async (
    data: Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>,
    txHash: string
  ) => {
    try {
      completeCriteriaTx(txHash);

      // Index to database via API
      const response = await fetch('/api/studies/wizard/index-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'criteria',
          txHash,
          databaseId: ids.databaseId,
          registryId: ids.registryId?.toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index criteria step');
      }

      const result = await response.json();
      console.log('[Wizard] Criteria indexed:', result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to index criteria data';
      setError(message);
      throw error;
    }
  };

  // ============================================
  // Step 4: Milestones Setup
  // ============================================

  const handleMilestonesComplete = async (
    txHashes: string[]
    // milestoneIds will be used when implementing database indexing
  ) => {
    try {
      completeMilestonesTx(txHashes);

      // Index milestones to database via API (use first tx hash)
      const response = await fetch('/api/studies/wizard/index-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'milestones',
          txHash: txHashes[0], // Use first milestone tx
          databaseId: ids.databaseId,
          registryId: ids.registryId?.toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index milestones step');
      }

      const result = await response.json();
      console.log('[Wizard] Milestones indexed:', result.data);

      // Mark creation as complete
      completeCreation();

      console.log('[Wizard] Study creation complete!');

      // Redirect to study detail page (using database ID)
      setTimeout(() => {
        reset(); // Clear store
        router.push(`/researcher/studies/${ids.databaseId}`);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete study creation';
      setError(message);
      throw error;
    }
  };

  // ============================================
  // Back Navigation
  // ============================================

  const handleBack = () => {
    // Cannot go back during TX execution
    if (status.includes('escrow') || status.includes('registry') || status.includes('criteria') || status.includes('milestones')) {
      return;
    }

    // Custom back logic per step
    // For now, just warn user
    const confirmBack = confirm('Going back will lose current step progress. Continue?');
    if (confirmBack) {
      // TODO: Implement proper back navigation
      // For MVP, we don't support going back after TX
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.standard}
      >
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/researcher/studies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studies
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/10">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create New Clinical Trial</h1>
            <p className="text-muted-foreground">
              Multi-step wizard with blockchain checkpointing
            </p>
          </div>
        </div>
      </motion.div>

      {/* Resume Banner */}
      {isResuming && status !== 'draft' && (
        <ResumeBanner
          status={status}
          currentStep={currentStep}
          totalSteps={4}
          onCancel={() => {
            const confirmCancel = confirm(
              'This will cancel study creation and lose all progress. Continue?'
            );
            if (confirmCancel) {
              reset();
              router.push('/researcher/studies');
            }
          }}
        />
      )}

      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={4}
        stepLabels={STEP_LABELS}
      />

      {/* Step Content */}
      <div className="min-h-[600px]">
        {/* Step 1: Escrow */}
        {(status === 'draft' || status === 'escrow') && ids.databaseId && (
          <EscrowStep
            databaseId={ids.databaseId}
            onComplete={handleEscrowComplete}
            isResuming={status === 'escrow'}
            initialData={formData?.step1}
          />
        )}

        {/* Step 2: Registry */}
        {(status === 'escrow_done' || status === 'registry') && ids.escrowId && txHashes.escrow && formData?.step1 && (
          <RegistryStep
            escrowId={ids.escrowId}
            escrowTxHash={txHashes.escrow}
            title={formData.step1.title || ''}
            description={formData.step1.description || ''}
            onComplete={handleRegistryComplete}
            onBack={handleBack}
            initialData={formData?.step2}
          />
        )}

        {/* Step 3: Criteria */}
        {(status === 'registry_done' || status === 'criteria') && ids.escrowId && ids.registryId && (
          <CriteriaStep
            escrowId={ids.escrowId}
            registryId={ids.registryId}
            onComplete={handleCriteriaComplete}
            onBack={handleBack}
            initialData={formData?.step3}
          />
        )}

        {/* Step 4: Milestones */}
        {(status === 'criteria_done' || status === 'milestones') && ids.escrowId && ids.registryId && formData?.step1 && (
          <MilestonesStep
            escrowId={ids.escrowId}
            registryId={ids.registryId}
            totalFunding={formData.step1.totalFunding || 0}
            onComplete={handleMilestonesComplete}
            onBack={handleBack}
            initialData={formData?.step4}
          />
        )}

        {/* Complete State */}
        {status === 'complete' && (
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Study Created Successfully!</h2>
            <p className="text-muted-foreground mb-4">
              Redirecting to study details...
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
