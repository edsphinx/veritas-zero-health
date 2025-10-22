/**
 * Study Creation Store
 *
 * Manages state for multi-step study creation wizard with blockchain transactions.
 * Persists to localStorage to allow resume after browser close or TX failure.
 */

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import type { StudyCreationData } from '@/lib/validations';
import { stringifyWithBigInt, parseWithBigInt } from '@/lib/json-bigint';

// Re-export types for convenience
export type { EscrowStepFormData, RegistryStepFormData, CriteriaStepFormData, MilestoneInputFormData, MilestonesStepFormData } from '@/lib/validations';

// ============================================
// Types
// ============================================

/**
 * Study creation status tracking each blockchain TX step
 */
export type StudyCreationStatus =
  | 'idle'           // No study being created
  | 'draft'          // Form data saved, not yet on blockchain
  | 'escrow'         // TX1: Creating escrow (in progress)
  | 'escrow_done'    // TX1: Escrow created successfully
  | 'registry'       // TX2: Publishing to registry (in progress)
  | 'registry_done'  // TX2: Registry published successfully
  | 'criteria'       // TX3: Setting criteria (in progress)
  | 'criteria_done'  // TX3: Criteria set successfully
  | 'milestones'     // TX4: Adding milestones (in progress)
  | 'complete';      // All TXs complete, study is live

/**
 * Transaction hashes for each blockchain step
 */
export interface StudyCreationTxHashes {
  escrow: string | null;
  registry: string | null;
  criteria: string | null;
  milestones: string[] | null; // Array because we add multiple milestones
}

/**
 * Blockchain IDs returned from contracts
 */
export interface StudyCreationIds {
  databaseId: string | null;    // UUID from our database
  escrowId: bigint | null;       // ID from ResearchFundingEscrow contract
  registryId: bigint | null;     // ID from StudyRegistry contract
}

// ============================================
// Store Interface
// ============================================

interface StudyCreationStore {
  // State
  status: StudyCreationStatus;
  ids: StudyCreationIds;
  txHashes: StudyCreationTxHashes;
  formData: Partial<StudyCreationData> | null;
  error: string | null;
  createdAt: number | null;      // Timestamp when creation started
  userAddress: string | null;    // Wallet address of the user creating the study

  // Getters
  isCreating: () => boolean;
  canResume: () => boolean;
  getCurrentStep: () => number;  // Returns 1-5 based on status

  // Actions - Initialization
  startCreation: (databaseId: string, userAddress: string, formData: Partial<StudyCreationData>) => void;
  resumeCreation: (state: Partial<StudyCreationStore>) => void;
  cancelCreation: () => void;

  // Actions - Transaction Updates
  startEscrowTx: () => void;
  completeEscrowTx: (txHash: string, escrowId: bigint) => void;

  startRegistryTx: () => void;
  completeRegistryTx: (txHash: string, registryId: bigint) => void;

  startCriteriaTx: () => void;
  completeCriteriaTx: (txHash: string) => void;

  startMilestonesTx: () => void;
  completeMilestonesTx: (txHashes: string[]) => void;

  // Actions - Error Handling
  setError: (error: string) => void;
  clearError: () => void;

  // Actions - Completion
  completeCreation: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  status: 'idle' as StudyCreationStatus,
  ids: {
    databaseId: null,
    escrowId: null,
    registryId: null,
  },
  txHashes: {
    escrow: null,
    registry: null,
    criteria: null,
    milestones: null,
  },
  formData: null,
  error: null,
  createdAt: null,
  userAddress: null,
};

// ============================================
// Store Implementation
// ============================================

export const useStudyCreationStore = create<StudyCreationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Getters
        isCreating: () => {
          const status = get().status;
          return status !== 'idle' && status !== 'complete';
        },

        canResume: () => {
          const status = get().status;
          return status !== 'idle' && status !== 'complete';
        },

        getCurrentStep: () => {
          const status = get().status;
          switch (status) {
            case 'idle':
            case 'draft':
              return 1;
            case 'escrow':
            case 'escrow_done':
              return 2;
            case 'registry':
            case 'registry_done':
              return 3;
            case 'criteria':
            case 'criteria_done':
              return 4;
            case 'milestones':
            case 'complete':
              return 5;
            default:
              return 1;
          }
        },

        // Initialization
        startCreation: (databaseId, userAddress, formData) => {
          set({
            status: 'draft',
            ids: { databaseId, escrowId: null, registryId: null },
            formData,
            error: null,
            createdAt: Date.now(),
            userAddress: userAddress.toLowerCase(), // Normalize to lowercase
          });
        },

        resumeCreation: (state) => {
          set(state);
        },

        cancelCreation: () => {
          set(initialState);
        },

        // Escrow TX
        startEscrowTx: () => {
          set({ status: 'escrow', error: null });
        },

        completeEscrowTx: (txHash, escrowId) => {
          set((state) => ({
            status: 'escrow_done',
            ids: { ...state.ids, escrowId },
            txHashes: { ...state.txHashes, escrow: txHash },
            error: null,
          }));
        },

        // Registry TX
        startRegistryTx: () => {
          set({ status: 'registry', error: null });
        },

        completeRegistryTx: (txHash, registryId) => {
          set((state) => ({
            status: 'registry_done',
            ids: { ...state.ids, registryId },
            txHashes: { ...state.txHashes, registry: txHash },
            error: null,
          }));
        },

        // Criteria TX
        startCriteriaTx: () => {
          set({ status: 'criteria', error: null });
        },

        completeCriteriaTx: (txHash) => {
          set((state) => ({
            status: 'criteria_done',
            txHashes: { ...state.txHashes, criteria: txHash },
            error: null,
          }));
        },

        // Milestones TX
        startMilestonesTx: () => {
          set({ status: 'milestones', error: null });
        },

        completeMilestonesTx: (txHashes) => {
          set((state) => ({
            status: 'complete',
            txHashes: { ...state.txHashes, milestones: txHashes },
            error: null,
          }));
        },

        // Error Handling
        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // Completion
        completeCreation: () => {
          set({ status: 'complete' });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'study-creation-storage', // localStorage key
        storage: createJSONStorage(() => ({
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return parseWithBigInt(str) as string;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, stringifyWithBigInt(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        })),
        partialize: (state) => ({
          // Only persist necessary fields (exclude functions)
          // Convert BigInts to strings to avoid serialization errors
          status: state.status,
          ids: {
            databaseId: state.ids.databaseId,
            escrowId: state.ids.escrowId ? state.ids.escrowId.toString() : null,
            registryId: state.ids.registryId ? state.ids.registryId.toString() : null,
          },
          txHashes: state.txHashes,
          formData: state.formData,
          error: state.error,
          createdAt: state.createdAt,
          userAddress: state.userAddress,
        }),
      }
    ),
    { name: 'StudyCreationStore' } // DevTools name
  )
);

// ============================================
// Selectors (for performance optimization)
// ============================================

export const selectIsCreating = (state: StudyCreationStore) => state.isCreating();
export const selectCanResume = (state: StudyCreationStore) => state.canResume();
export const selectCurrentStep = (state: StudyCreationStore) => state.getCurrentStep();
export const selectDatabaseId = (state: StudyCreationStore) => state.ids.databaseId;
export const selectEscrowId = (state: StudyCreationStore) => state.ids.escrowId;
export const selectRegistryId = (state: StudyCreationStore) => state.ids.registryId;
export const selectFormData = (state: StudyCreationStore) => state.formData;
export const selectError = (state: StudyCreationStore) => state.error;
export const selectUserAddress = (state: StudyCreationStore) => state.userAddress;
