/**
 * Studies Blockchain Service
 *
 * Encapsulates all blockchain operations for clinical studies.
 * Hides viem/ABI/chain details from API routes and components.
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
} from './studies.service';

// ==================== TYPE DEFINITIONS ====================

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

// ==================== STUDY CREATION ====================

/**
 * Create a new clinical study across all contracts
 * Handles 3-step process: Escrow → Registry → Criteria
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

  const eligibilityCodeHash = 0n; // TODO: Generate from medicalCriteria

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

// ==================== ANONYMOUS APPLICATION ====================

/**
 * Submit anonymous application with ZK proof
 */
export async function submitAnonymousApplication(
  _params: AnonymousApplicationParams
): Promise<ApplicationResult> {
  const chainId = getDefaultChainId();
  const _publicClient = getPublicClient(chainId);
  const registryContract = getStudyRegistryContract(chainId);

  if (!registryContract) {
    throw new Error('StudyRegistry contract not deployed');
  }

  // Note: This would typically use the patient's wallet
  // For now, we need to handle this differently as it's a public transaction
  throw new Error('Anonymous application requires patient wallet integration');
}

// ==================== STUDY QUERIES ====================

/**
 * Get study by ID from registry
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStudyFromChain(studyId: bigint): Promise<any> {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStudyCriteriaFromChain(studyId: bigint): Promise<any> {
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
  const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

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
