/**
 * Study Blockchain Service
 *
 * Encapsulates all blockchain operations for clinical studies.
 * Implements step-by-step creation flow for wizard resumability.
 * Adapted from bk_nextjs implementation with multi-step support.
 */

import { type Address, type Hex } from 'viem';
import {
  getPublicClient,
  getWalletClientFromPrivateKey,
  getDefaultChainId,
} from './blockchain-client.service';
import {
  getResearchFundingEscrowContract,
  getStudyRegistryContract,
} from '../contracts/study-contracts';

// ==================== TYPE DEFINITIONS ====================

/**
 * Step 1: Create Escrow
 */
export interface CreateEscrowParams {
  title: string;
  description: string;
  totalFunding: number;
  certifiedProviders?: Address[];
  maxParticipants: number;
}

export interface CreateEscrowResult {
  success: true;
  escrowId: bigint;
  txHash: Hex;
  blockNumber: string;
}

/**
 * Step 2: Publish to Registry
 */
export interface PublishToRegistryParams {
  escrowId: bigint;
  region: string;
  compensation: string;
  metadataURI?: string;
}

export interface PublishToRegistryResult {
  success: true;
  registryId: bigint;
  txHash: Hex;
  blockNumber: string;
}

/**
 * Step 3: Set Criteria
 */
export interface SetCriteriaParams {
  registryId: bigint;
  minAge: number;
  maxAge: number;
  eligibilityCodeHash?: bigint;
}

export interface SetCriteriaResult {
  success: true;
  txHash: Hex;
  blockNumber: string;
}

/**
 * Step 4: Add Milestones
 */
export interface MilestoneParams {
  type: string;
  description: string;
  rewardAmount: number;
}

export interface AddMilestonesResult {
  success: true;
  milestoneIds: bigint[];
  txHashes: Hex[];
}

/**
 * Legacy: Full study creation (3-step process)
 * @deprecated Use individual step functions for wizard flow
 */
export interface CreateStudyParams {
  title: string;
  description: string;
  region: string;
  compensation: string;
  maxParticipants: number;
  minAge: number;
  maxAge: number;
  certifiedProviders?: Address[];
  medicalCriteria?: {
    requiredDiagnoses?: string[];
    excludedDiagnoses?: string[];
    requiredMedications?: string[];
    excludedMedications?: string[];
  };
}

export interface StudyCreationResult {
  success: true;
  escrowStudyId: number | null;
  registryStudyId: number | null;
  transactions: {
    escrow: {
      hash: Hex;
      blockNumber: string;
    };
    registry: {
      hash: Hex;
      blockNumber: string;
    };
    criteria: {
      hash: Hex;
    };
  };
}

export interface AnonymousApplicationParams {
  studyId: bigint;
  zkProof: {
    proof: Hex;
    publicSignals: bigint[];
  };
  eligibilityCodeHash: bigint;
}

export interface ApplicationResult {
  success: true;
  applicantId: bigint;
  transactionHash: Hex;
}

// ==================== STEP-BY-STEP CREATION FLOW ====================

/**
 * Step 1: Create study escrow
 * Executes TX1 and returns escrow ID for checkpointing
 */
export async function createEscrow(
  params: CreateEscrowParams,
  researcherPrivateKey: Hex
): Promise<CreateEscrowResult> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClientFromPrivateKey(chainId, researcherPrivateKey);

  if (!walletClient.account || !walletClient.chain) {
    throw new Error('Failed to initialize wallet client');
  }

  const escrowContract = getResearchFundingEscrowContract(chainId);

  if (!escrowContract) {
    throw new Error('ResearchFundingEscrow contract not deployed');
  }

  const certifiedProviders = params.certifiedProviders && params.certifiedProviders.length > 0
    ? params.certifiedProviders
    : [walletClient.account.address];

  console.log('[StudyBlockchain] Creating study escrow...');

  const txHash = await walletClient.writeContract({
    address: escrowContract.address,
    abi: escrowContract.abi,
    functionName: 'createStudy',
    args: [
      params.title,
      params.description,
      certifiedProviders,
      BigInt(params.maxParticipants),
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const escrowId = receipt.logs[0]?.topics[1]
    ? BigInt(receipt.logs[0].topics[1])
    : BigInt(0);

  console.log(`[StudyBlockchain] Escrow created with ID: ${escrowId}`);

  return {
    success: true,
    escrowId,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  };
}

/**
 * Step 2: Publish study to registry
 * Executes TX2 and returns registry ID for checkpointing
 */
export async function publishToRegistry(
  params: PublishToRegistryParams,
  researcherPrivateKey: Hex
): Promise<PublishToRegistryResult> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClientFromPrivateKey(chainId, researcherPrivateKey);

  if (!walletClient.account || !walletClient.chain) {
    throw new Error('Failed to initialize wallet client');
  }

  const registryContract = getStudyRegistryContract(chainId);

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  const metadataURI = params.metadataURI || `ipfs://metadata/${params.escrowId}`;

  console.log('[StudyBlockchain] Publishing to registry...');

  const txHash = await walletClient.writeContract({
    address: registryContract.address,
    abi: registryContract.abi,
    functionName: 'publishStudy',
    args: [
      params.region,
      params.compensation,
      metadataURI,
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const registryId = receipt.logs[0]?.topics[1]
    ? BigInt(receipt.logs[0].topics[1])
    : BigInt(0);

  console.log(`[StudyBlockchain] Registry ID: ${registryId}`);

  return {
    success: true,
    registryId,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  };
}

/**
 * Step 3: Set eligibility criteria
 * Executes TX3
 */
export async function setCriteria(
  params: SetCriteriaParams,
  researcherPrivateKey: Hex
): Promise<SetCriteriaResult> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClientFromPrivateKey(chainId, researcherPrivateKey);

  if (!walletClient.account || !walletClient.chain) {
    throw new Error('Failed to initialize wallet client');
  }

  const registryContract = getStudyRegistryContract(chainId);

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  const eligibilityCodeHash = params.eligibilityCodeHash || BigInt(0);

  console.log('[StudyBlockchain] Setting criteria...');

  const txHash = await walletClient.writeContract({
    address: registryContract.address,
    abi: registryContract.abi,
    functionName: 'setStudyCriteria',
    args: [
      params.registryId,
      params.minAge,
      params.maxAge,
      eligibilityCodeHash,
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log('[StudyBlockchain] Criteria set successfully');

  return {
    success: true,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  };
}

/**
 * Step 4a: Add milestones sequentially (≤6 milestones)
 * Executes multiple TXs sequentially with progress updates
 */
export async function addMilestonesSequential(
  escrowId: bigint,
  milestones: MilestoneParams[],
  researcherPrivateKey: Hex,
  onProgress?: (completed: number, total: number) => void
): Promise<AddMilestonesResult> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClientFromPrivateKey(chainId, researcherPrivateKey);

  if (!walletClient.account || !walletClient.chain) {
    throw new Error('Failed to initialize wallet client');
  }

  const escrowContract = getResearchFundingEscrowContract(chainId);

  if (!escrowContract) {
    throw new Error('ResearchFundingEscrow contract not deployed');
  }

  console.log(`[StudyBlockchain] Adding ${milestones.length} milestones sequentially...`);

  const txHashes: Hex[] = [];
  const milestoneIds: bigint[] = [];

  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];

    const txHash = await walletClient.writeContract({
      address: escrowContract.address,
      abi: escrowContract.abi,
      functionName: 'addMilestone',
      args: [
        escrowId,
        milestone.description,
        BigInt(Math.floor(milestone.rewardAmount * 1e6)), // Convert to USDC decimals
      ],
      chain: walletClient.chain,
      account: walletClient.account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const milestoneId = receipt.logs[0]?.topics[1]
      ? BigInt(receipt.logs[0].topics[1])
      : BigInt(i);

    txHashes.push(txHash);
    milestoneIds.push(milestoneId);

    if (onProgress) {
      onProgress(i + 1, milestones.length);
    }

    console.log(`[StudyBlockchain] Milestone ${i + 1}/${milestones.length} created (ID: ${milestoneId})`);
  }

  return {
    success: true,
    milestoneIds,
    txHashes,
  };
}

/**
 * Step 4b: Add milestones in batch (>6 milestones)
 * Executes single TX with all milestones
 */
export async function addMilestonesBatch(
  escrowId: bigint,
  milestones: MilestoneParams[],
  researcherPrivateKey: Hex
): Promise<AddMilestonesResult> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClientFromPrivateKey(chainId, researcherPrivateKey);

  if (!walletClient.account || !walletClient.chain) {
    throw new Error('Failed to initialize wallet client');
  }

  const escrowContract = getResearchFundingEscrowContract(chainId);

  if (!escrowContract) {
    throw new Error('ResearchFundingEscrow contract not deployed');
  }

  console.log(`[StudyBlockchain] Adding ${milestones.length} milestones in batch...`);

  const descriptions = milestones.map(m => m.description);
  const amounts = milestones.map(m => BigInt(Math.floor(m.rewardAmount * 1e6)));

  const txHash = await walletClient.writeContract({
    address: escrowContract.address,
    abi: escrowContract.abi,
    functionName: 'addMilestonesBatch',
    args: [escrowId, descriptions, amounts],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Extract milestone IDs from events
  const milestoneIds = receipt.logs
    .filter(log => log.topics[0] !== undefined)
    .map((log, index) => log.topics[1] ? BigInt(log.topics[1]) : BigInt(index));

  console.log(`[StudyBlockchain] Batch created ${milestoneIds.length} milestones`);

  return {
    success: true,
    milestoneIds,
    txHashes: [txHash],
  };
}

// ==================== LEGACY: FULL STUDY CREATION ====================

/**
 * Create a new clinical study across all contracts
 * Handles 3-step process: Escrow → Registry → Criteria
 * @deprecated Use individual step functions for wizard flow
 */
export async function createStudyOnChain(
  params: CreateStudyParams,
  researcherPrivateKey: Hex
): Promise<StudyCreationResult> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const walletClient = getWalletClientFromPrivateKey(chainId, researcherPrivateKey);

  if (!walletClient.account || !walletClient.chain) {
    throw new Error('Failed to initialize wallet client');
  }

  const escrowContract = getResearchFundingEscrowContract(chainId);
  const registryContract = getStudyRegistryContract(chainId);

  if (!escrowContract) {
    throw new Error('ResearchFundingEscrow contract not deployed');
  }

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  const certifiedProviders = params.certifiedProviders && params.certifiedProviders.length > 0
    ? params.certifiedProviders
    : [walletClient.account.address];

  // STEP 1: Create study in ResearchFundingEscrow
  console.log('[StudyBlockchain] Creating study in escrow...');

  const escrowHash = await walletClient.writeContract({
    address: escrowContract.address,
    abi: escrowContract.abi,
    functionName: 'createStudy',
    args: [
      params.title,
      params.description,
      certifiedProviders,
      BigInt(params.maxParticipants),
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowHash });
  const escrowStudyId = escrowReceipt.logs[0]?.topics[1]
    ? parseInt(escrowReceipt.logs[0].topics[1], 16)
    : null;

  console.log(`[StudyBlockchain] Escrow study ID: ${escrowStudyId}`);

  // STEP 2: Publish study to StudyRegistry
  console.log('[StudyBlockchain] Publishing to registry...');

  const registryHash = await walletClient.writeContract({
    address: registryContract.address,
    abi: registryContract.abi,
    functionName: 'publishStudy',
    args: [
      params.region,
      params.compensation,
      `ipfs://metadata/${escrowStudyId}`,
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  const registryReceipt = await publicClient.waitForTransactionReceipt({ hash: registryHash });
  const registryStudyId = registryReceipt.logs[0]?.topics[1]
    ? parseInt(registryReceipt.logs[0].topics[1], 16)
    : null;

  console.log(`[StudyBlockchain] Registry study ID: ${registryStudyId}`);

  // STEP 3: Set eligibility criteria
  console.log('[StudyBlockchain] Setting criteria...');

  const eligibilityCodeHash = BigInt(0); // TODO: Generate from medicalCriteria

  const criteriaHash = await walletClient.writeContract({
    address: registryContract.address,
    abi: registryContract.abi,
    functionName: 'setStudyCriteria',
    args: [
      BigInt(registryStudyId!),
      params.minAge,
      params.maxAge,
      eligibilityCodeHash,
    ],
    chain: walletClient.chain,
    account: walletClient.account,
  });

  await publicClient.waitForTransactionReceipt({ hash: criteriaHash });

  console.log('[StudyBlockchain] Study created successfully');

  return {
    success: true,
    escrowStudyId,
    registryStudyId,
    transactions: {
      escrow: {
        hash: escrowHash,
        blockNumber: escrowReceipt.blockNumber.toString(),
      },
      registry: {
        hash: registryHash,
        blockNumber: registryReceipt.blockNumber.toString(),
      },
      criteria: {
        hash: criteriaHash,
      },
    },
  };
}

// ==================== QUERIES ====================

/**
 * Get study by ID from registry
 */
export async function getStudyFromChain(studyId: bigint): Promise<unknown> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const registryContract = getStudyRegistryContract(chainId);

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  const study = await publicClient.readContract({
    address: registryContract.address,
    abi: registryContract.abi,
    functionName: 'getStudy',
    args: [studyId],
  });

  return study;
}

/**
 * Get eligibility criteria for a study
 */
export async function getStudyCriteriaFromChain(studyId: bigint): Promise<unknown> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const registryContract = getStudyRegistryContract(chainId);

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  const criteria = await publicClient.readContract({
    address: registryContract.address,
    abi: registryContract.abi,
    functionName: 'getStudyCriteria',
    args: [studyId],
  });

  return criteria;
}

/**
 * Get anonymous applications for a study by reading blockchain events
 */
export async function getStudyApplications(studyId: bigint): Promise<{
  applicationsCount: number;
  applications: Array<{
    applicantNumber: number;
    applicantAddress: Address;
    appliedAt: number;
    verifiedProof: boolean;
    blockNumber: string;
    transactionHash: Hex;
  }>;
}> {
  const chainId = getDefaultChainId();
  const publicClient = getPublicClient(chainId);
  const registryContract = getStudyRegistryContract(chainId);

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  // Get current block for optimized event fetching
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

  // AnonymousApplicationSubmitted event ABI
  const applicationEvent = {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'studyId', type: 'uint256' },
      { indexed: true, name: 'applicant', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'AnonymousApplicationSubmitted',
    type: 'event',
  } as const;

  // Fetch events
  const logs = await publicClient.getLogs({
    address: registryContract.address,
    event: applicationEvent,
    args: {
      studyId,
    },
    fromBlock,
    toBlock: 'latest',
  });

  // Transform logs into application objects
  const applications = logs.map((log, index) => ({
    applicantNumber: index + 1,
    applicantAddress: log.args.applicant as Address,
    appliedAt: Number(log.args.timestamp) * 1000, // Convert to milliseconds
    verifiedProof: true, // If event was emitted, proof was verified
    blockNumber: log.blockNumber.toString(),
    transactionHash: log.transactionHash,
  }));

  return {
    applicationsCount: applications.length,
    applications,
  };
}
