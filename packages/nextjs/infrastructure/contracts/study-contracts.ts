/**
 * Study Contracts Configuration
 *
 * Service layer for Clinical Studies and Research Funding Escrow
 * Manages StudyRegistry and ResearchFundingEscrow contract configurations
 * Adapted from bk_nextjs implementation
 */

import { getContractAddress, getContractABI } from './contract-helpers';
import type { Address } from 'viem';

/**
 * Contract configuration interface
 */
export interface ContractConfig {
  address: Address;
  abi: readonly unknown[];
  chainId: number;
}

/**
 * Study data structure from contracts (raw blockchain data)
 * Note: For indexed database studies, use Study type from @veritas/types
 */
export interface StudyFromContract {
  studyId: bigint;
  title: string;
  description: string;
  researcher: Address;
  maxParticipants: bigint;
  currentParticipants: bigint;
  active: boolean;
  certifiedProviders: Address[];
  fundingGoal: bigint;
  currentFunding: bigint;
  createdAt: bigint;
}

/**
 * Milestone data structure from contracts
 */
export interface MilestoneFromContract {
  milestoneId: bigint;
  studyId: bigint;
  description: string;
  amount: bigint;
  dueDate: bigint;
  completed: boolean;
  verified: boolean;
  paidOut: boolean;
}

/**
 * Get StudyRegistry contract configuration
 */
export function getStudyRegistryContract(chainId: number): ContractConfig | null {
  const address = getContractAddress('StudyRegistry', chainId);

  if (!address) {
    console.warn(`StudyRegistry contract not deployed on chain ${chainId}`);
    return null;
  }

  const abi = getContractABI('StudyRegistry');

  return {
    address,
    abi,
    chainId,
  };
}

/**
 * Get ResearchFundingEscrow contract configuration
 */
export function getResearchFundingEscrowContract(chainId: number): ContractConfig | null {
  const address = getContractAddress('ResearchFundingEscrow', chainId);

  if (!address) {
    console.warn(`ResearchFundingEscrow contract not deployed on chain ${chainId}`);
    return null;
  }

  const abi = getContractABI('ResearchFundingEscrow');

  return {
    address,
    abi,
    chainId,
  };
}

/**
 * Get MockUSDC contract configuration
 */
export function getMockUSDCContract(chainId: number): ContractConfig | null {
  const address = getContractAddress('MockUSDC', chainId);

  if (!address) {
    console.warn(`MockUSDC contract not deployed on chain ${chainId}`);
    return null;
  }

  const abi = getContractABI('MockUSDC');

  return {
    address,
    abi,
    chainId,
  };
}

/**
 * Check if study contracts are deployed on chain
 */
export function areStudyContractsDeployed(chainId: number): boolean {
  return !!(
    getContractAddress('StudyRegistry', chainId) &&
    getContractAddress('ResearchFundingEscrow', chainId)
  );
}

/**
 * Get all study-related contract configurations
 */
export function getStudyContracts(chainId: number): {
  registry: ContractConfig | null;
  escrow: ContractConfig | null;
  usdc: ContractConfig | null;
} {
  return {
    registry: getStudyRegistryContract(chainId),
    escrow: getResearchFundingEscrowContract(chainId),
    usdc: getMockUSDCContract(chainId),
  };
}
