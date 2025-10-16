/**
 * Health Identity SBT Service
 *
 * Service layer for Health Identity Soulbound Token operations
 * Provides abstraction over blockchain contract interactions
 */

import { getContractAddress, getContractABI } from '@/shared/lib/vzh/contracts';
import type { Address } from 'viem';

/**
 * Health Identity data structure
 */
export interface HealthIdentity {
  nillionDID: string;
  humanPassportId: bigint;
  attestationCount: bigint;
  createdAt: bigint;
  active: boolean;
}

/**
 * Contract configuration for Health Identity SBT
 */
export interface HealthIdentitySBTConfig {
  address: Address;
  abi: readonly any[];
  chainId: number;
}

/**
 * Get Health Identity SBT contract configuration for a chain
 */
export function getHealthIdentitySBTContract(chainId: number): HealthIdentitySBTConfig | null {
  const address = getContractAddress('HealthIdentitySBT', chainId);

  if (!address) {
    console.warn(`HealthIdentitySBT contract not deployed on chain ${chainId}`);
    return null;
  }

  const abi = getContractABI('HealthIdentitySBT');

  return {
    address,
    abi,
    chainId,
  };
}

/**
 * Get Human Passport contract configuration for a chain
 */
export function getHumanPassportContract(chainId: number): HealthIdentitySBTConfig | null {
  const address = getContractAddress('MockHumanPassport', chainId);

  if (!address) {
    console.warn(`MockHumanPassport contract not deployed on chain ${chainId}`);
    return null;
  }

  const abi = getContractABI('MockHumanPassport');

  return {
    address,
    abi,
    chainId,
  };
}

/**
 * Check if Health Identity SBT is deployed on chain
 */
export function isHealthIdentitySBTDeployed(chainId: number): boolean {
  return !!getContractAddress('HealthIdentitySBT', chainId);
}

/**
 * Get default chain ID for Health Identity SBT
 * Returns Optimism Sepolia (11155420) as default
 */
export function getDefaultHealthIdentityChainId(): number {
  return 11155420; // Optimism Sepolia
}

// ==================== READ OPERATIONS ====================

import { getPublicClient } from './blockchain-client.service';

/**
 * Check if an address has a Health Identity SBT
 */
export async function hasHealthIdentity(
  address: Address,
  chainId?: number
): Promise<boolean> {
  const actualChainId = chainId ?? getDefaultHealthIdentityChainId();
  const contract = getHealthIdentitySBTContract(actualChainId);

  if (!contract) {
    throw new Error(`HealthIdentitySBT contract not deployed on chain ${actualChainId}`);
  }

  const publicClient = getPublicClient(actualChainId);

  try {
    const result = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'hasHealthIdentity',
      args: [address],
    });

    return result as boolean;
  } catch (error) {
    console.error('[HealthIdentitySBT] Error checking identity:', error);
    return false;
  }
}

/**
 * Get Health Identity for an address
 */
export async function getHealthIdentity(
  address: Address,
  chainId?: number
): Promise<HealthIdentity | null> {
  const actualChainId = chainId ?? getDefaultHealthIdentityChainId();
  const contract = getHealthIdentitySBTContract(actualChainId);

  if (!contract) {
    throw new Error(`HealthIdentitySBT contract not deployed on chain ${actualChainId}`);
  }

  const publicClient = getPublicClient(actualChainId);

  try {
    const result = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getHealthIdentity',
      args: [address],
    });

    // Contract returns tuple
    const [nillionDID, humanPassportId, attestationCount, createdAt, active] = result as [
      string,
      bigint,
      bigint,
      bigint,
      boolean
    ];

    return {
      nillionDID,
      humanPassportId,
      attestationCount,
      createdAt,
      active,
    };
  } catch (error) {
    console.error('[HealthIdentitySBT] Error getting identity:', error);
    return null;
  }
}

/**
 * Get attestations for a user
 */
export async function getUserAttestations(
  address: Address,
  chainId?: number
): Promise<string[]> {
  const actualChainId = chainId ?? getDefaultHealthIdentityChainId();
  const contract = getHealthIdentitySBTContract(actualChainId);

  if (!contract) {
    throw new Error(`HealthIdentitySBT contract not deployed on chain ${actualChainId}`);
  }

  const publicClient = getPublicClient(actualChainId);

  try {
    const result = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getUserAttestations',
      args: [address],
    });

    return (result as string[]) || [];
  } catch (error) {
    console.error('[HealthIdentitySBT] Error getting attestations:', error);
    return [];
  }
}

/**
 * Get complete Health Identity data (identity + attestations)
 */
export async function getCompleteHealthIdentity(
  address: Address,
  chainId?: number
): Promise<{
  hasIdentity: boolean;
  identity: HealthIdentity | null;
  attestations: string[];
} | null> {
  try {
    const actualChainId = chainId ?? getDefaultHealthIdentityChainId();

    // Check if has identity first
    const hasId = await hasHealthIdentity(address, actualChainId);

    if (!hasId) {
      return {
        hasIdentity: false,
        identity: null,
        attestations: [],
      };
    }

    // Fetch identity and attestations in parallel
    const [identity, attestations] = await Promise.all([
      getHealthIdentity(address, actualChainId),
      getUserAttestations(address, actualChainId),
    ]);

    return {
      hasIdentity: true,
      identity,
      attestations,
    };
  } catch (error) {
    console.error('[HealthIdentitySBT] Error getting complete identity:', error);
    return null;
  }
}
