/**
 * Researchers Service
 *
 * Service layer for Researcher-specific operations
 * Manages researcher interactions with studies and funding
 */

import type { Address } from 'viem';
import { getStudyRegistryContract } from './studies.service';
import { getPublicClient } from './blockchain-client.service';

/**
 * Researcher profile data
 */
export interface ResearcherProfile {
  address: Address;
  name?: string;
  institution?: string;
  specialization?: string;
  verified: boolean;
  activeStudies: bigint[];
  totalStudiesCreated: bigint;
}

/**
 * Get researcher profile from blockchain
 */
export async function getResearcherProfile(
  researcherAddress: Address,
  chainId: number
): Promise<ResearcherProfile | null> {
  const contract = getStudyRegistryContract(chainId);
  if (!contract) return null;

  const _publicClient = getPublicClient(chainId);

  try {
    // This would call actual contract methods
    // For now, return structure
    return {
      address: researcherAddress,
      verified: false,
      activeStudies: [],
      totalStudiesCreated: BigInt(0),
    };
  } catch (error) {
    console.error('Error fetching researcher profile:', error);
    return null;
  }
}

/**
 * Check if address is a verified researcher
 */
export async function isVerifiedResearcher(
  researcherAddress: Address,
  chainId: number
): Promise<boolean> {
  const contract = getStudyRegistryContract(chainId);
  if (!contract) return false;

  const _publicClient = getPublicClient(chainId);

  try {
    // Would call contract method like: contract.isVerifiedResearcher(address)
    // For now, return false as placeholder
    return false;
  } catch (error) {
    console.error('Error checking researcher verification:', error);
    return false;
  }
}

/**
 * Get studies created by researcher
 */
export async function getResearcherStudies(
  researcherAddress: Address,
  chainId: number
): Promise<bigint[]> {
  const contract = getStudyRegistryContract(chainId);
  if (!contract) return [];

  const _publicClient = getPublicClient(chainId);

  try {
    // Would call contract method to get researcher's studies
    return [];
  } catch (error) {
    console.error('Error fetching researcher studies:', error);
    return [];
  }
}

/**
 * Get researcher wallet configuration from environment
 * For testing/development purposes
 */
export function getResearcherWalletConfig(researcherId: 1 | 2): {
  privateKey: `0x${string}`;
  address: Address;
} | null {
  const privateKeyEnv = `RESEARCHER_${researcherId}_PRIVATE_KEY`;
  const addressEnv = `RESEARCHER_${researcherId}_ADDRESS`;

  const privateKey = process.env[privateKeyEnv] as `0x${string}` | undefined;
  const address = process.env[addressEnv] as Address | undefined;

  if (!privateKey || !address) {
    console.warn(`Researcher ${researcherId} wallet not configured in environment`);
    return null;
  }

  return { privateKey, address };
}
