/**
 * Mock Study Blockchain Service
 *
 * Simulates blockchain transactions for study creation wizard.
 * TODO: Replace with real blockchain client implementations when contracts are ready.
 *
 * This mock service:
 * - Simulates transaction delays (1-3 seconds)
 * - Returns mock transaction hashes
 * - Returns mock blockchain IDs (bigint)
 * - Can throw errors for testing error handling
 */

import type {
  EscrowStepFormData,
  RegistryStepFormData,
  CriteriaStepFormData,
  MilestoneInputFormData,
} from '@/lib/validations';

// ============================================
// Types
// ============================================

export interface CreateEscrowResult {
  txHash: string;
  escrowId: bigint;
}

export interface PublishRegistryResult {
  txHash: string;
  registryId: bigint;
}

export interface SetCriteriaResult {
  txHash: string;
}

export interface AddMilestonesResult {
  txHashes: string[]; // One per milestone in sequential mode, or single hash in batch mode
  milestoneIds: bigint[];
}

// ============================================
// Mock Helpers
// ============================================

/**
 * Simulate transaction delay (1-3 seconds)
 */
function simulateTxDelay(): Promise<void> {
  const delay = 1000 + Math.random() * 2000; // 1-3 seconds
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Generate mock transaction hash
 */
function generateMockTxHash(): string {
  const randomHex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${randomHex}`;
}

/**
 * Generate mock blockchain ID
 */
function generateMockId(): bigint {
  return BigInt(Math.floor(Math.random() * 1000000));
}

/**
 * Simulate occasional transaction failure (10% chance)
 */
function maybeThrowError(operationName: string): void {
  const shouldFail = Math.random() < 0.1; // 10% failure rate
  if (shouldFail) {
    throw new Error(`Transaction failed: ${operationName}`);
  }
}

// ============================================
// Mock Blockchain Service
// ============================================

export class MockStudyBlockchainService {
  /**
   * Step 1: Create escrow contract
   * Maps to: ResearchFundingEscrow.createStudy()
   */
  static async createEscrow(
    data: EscrowStepFormData
  ): Promise<CreateEscrowResult> {
    console.log('[MOCK] Creating escrow with data:', data);

    await simulateTxDelay();
    maybeThrowError('createEscrow');

    const result: CreateEscrowResult = {
      txHash: generateMockTxHash(),
      escrowId: generateMockId(),
    };

    console.log('[MOCK] Escrow created:', result);
    return result;
  }

  /**
   * Step 2: Publish study to registry
   * Maps to: StudyRegistry.publishStudy()
   */
  static async publishToRegistry(
    data: RegistryStepFormData & { title: string; description: string }
  ): Promise<PublishRegistryResult> {
    console.log('[MOCK] Publishing to registry with data:', data);

    await simulateTxDelay();
    maybeThrowError('publishToRegistry');

    const result: PublishRegistryResult = {
      txHash: generateMockTxHash(),
      registryId: generateMockId(),
    };

    console.log('[MOCK] Registry published:', result);
    return result;
  }

  /**
   * Step 3: Set study criteria
   * Maps to: StudyRegistry.setStudyCriteria()
   */
  static async setCriteria(
    data: CriteriaStepFormData
  ): Promise<SetCriteriaResult> {
    console.log('[MOCK] Setting criteria with data:', data);

    await simulateTxDelay();
    maybeThrowError('setCriteria');

    const result: SetCriteriaResult = {
      txHash: generateMockTxHash(),
    };

    console.log('[MOCK] Criteria set:', result);
    return result;
  }

  /**
   * Step 4: Add milestones (sequential mode)
   * Maps to: ResearchFundingEscrow.addMilestone() × N
   */
  static async addMilestonesSequential(
    escrowId: bigint,
    milestones: MilestoneInputFormData[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<AddMilestonesResult> {
    console.log(
      `[MOCK] Adding ${milestones.length} milestones sequentially to escrow ${escrowId}`
    );

    const txHashes: string[] = [];
    const milestoneIds: bigint[] = [];

    for (let i = 0; i < milestones.length; i++) {
      await simulateTxDelay();
      maybeThrowError(`addMilestone-${i}`);

      const txHash = generateMockTxHash();
      const milestoneId = generateMockId();

      txHashes.push(txHash);
      milestoneIds.push(milestoneId);

      console.log(
        `[MOCK] Milestone ${i + 1}/${milestones.length} created:`,
        milestoneId
      );

      if (onProgress) {
        onProgress(i + 1, milestones.length);
      }
    }

    const result: AddMilestonesResult = { txHashes, milestoneIds };
    console.log('[MOCK] All milestones created:', result);
    return result;
  }

  /**
   * Step 4: Add milestones (batch mode)
   * Maps to: ResearchFundingEscrow.addMilestones() - FUTURE smart contract upgrade
   */
  static async addMilestonesBatch(
    escrowId: bigint,
    milestones: MilestoneInputFormData[]
  ): Promise<AddMilestonesResult> {
    console.log(
      `[MOCK] Adding ${milestones.length} milestones in batch to escrow ${escrowId}`
    );

    await simulateTxDelay();
    maybeThrowError('addMilestonesBatch');

    const result: AddMilestonesResult = {
      txHashes: [generateMockTxHash()], // Single TX hash
      milestoneIds: milestones.map(() => generateMockId()),
    };

    console.log('[MOCK] Batch milestones created:', result);
    return result;
  }
}

// ============================================
// USDC Approval Helper (for Step 1)
// ============================================

export interface USDCApprovalResult {
  txHash: string;
  approved: boolean;
}

export class MockUSDCService {
  /**
   * Check USDC balance
   */
  static async checkBalance(address: string): Promise<number> {
    console.log(`[MOCK] Checking USDC balance for ${address}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 100000; // Mock: 100k USDC
  }

  /**
   * Check USDC approval for escrow contract
   */
  static async checkApproval(
    owner: string,
    spender: string
  ): Promise<number> {
    console.log(`[MOCK] Checking USDC approval: ${owner} → ${spender}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 0; // Mock: no approval yet
  }

  /**
   * Approve USDC for escrow contract
   */
  static async approve(
    spender: string,
    amount: number
  ): Promise<USDCApprovalResult> {
    console.log(`[MOCK] Approving ${amount} USDC for ${spender}`);
    await simulateTxDelay();
    maybeThrowError('approve');

    return {
      txHash: generateMockTxHash(),
      approved: true,
    };
  }
}
