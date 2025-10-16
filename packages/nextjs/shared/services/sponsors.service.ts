/**
 * Sponsors Service
 *
 * Service layer for Sponsor-specific operations
 * Manages sponsor interactions with funding and studies
 */

import type { Address } from 'viem';
import { getResearchFundingEscrowContract, getMockUSDCContract } from './studies.service';
import { getPublicClient } from './blockchain-client.service';

/**
 * Sponsor profile data
 */
export interface SponsorProfile {
  address: Address;
  name?: string;
  organization?: string;
  verified: boolean;
  totalFunded: bigint;
  activeSponsored: bigint[];
  totalStudiesSponsored: bigint;
}

/**
 * Funding record
 */
export interface FundingRecord {
  sponsor: Address;
  studyId: bigint;
  amount: bigint;
  timestamp: bigint;
  transactionHash: string;
}

/**
 * Get sponsor profile from blockchain
 */
export async function getSponsorProfile(
  sponsorAddress: Address,
  chainId: number
): Promise<SponsorProfile | null> {
  const contract = getResearchFundingEscrowContract(chainId);
  if (!contract) return null;

  const _publicClient = getPublicClient(chainId);

  try {
    // Would call contract methods to get sponsor data
    return {
      address: sponsorAddress,
      verified: false,
      totalFunded: BigInt(0),
      activeSponsored: [],
      totalStudiesSponsored: BigInt(0),
    };
  } catch (error) {
    console.error('Error fetching sponsor profile:', error);
    return null;
  }
}

/**
 * Get sponsor's funding history
 */
export async function getSponsorFundingHistory(
  sponsorAddress: Address,
  chainId: number
): Promise<FundingRecord[]> {
  const contract = getResearchFundingEscrowContract(chainId);
  if (!contract) return [];

  const _publicClient = getPublicClient(chainId);

  try {
    // Would query events or contract methods
    return [];
  } catch (error) {
    console.error('Error fetching sponsor funding history:', error);
    return [];
  }
}

/**
 * Get total amount funded by sponsor
 */
export async function getSponsorTotalFunding(
  sponsorAddress: Address,
  chainId: number
): Promise<bigint> {
  const contract = getResearchFundingEscrowContract(chainId);
  if (!contract) return BigInt(0);

  const _publicClient = getPublicClient(chainId);

  try {
    // Would call contract method
    return BigInt(0);
  } catch (error) {
    console.error('Error fetching sponsor total funding:', error);
    return BigInt(0);
  }
}

/**
 * Check sponsor's USDC balance
 */
export async function getSponsorUSDCBalance(
  sponsorAddress: Address,
  chainId: number
): Promise<bigint> {
  const usdcContract = getMockUSDCContract(chainId);
  if (!usdcContract) return BigInt(0);

  const publicClient = getPublicClient(chainId);

  try {
    const balance = await publicClient.readContract({
      address: usdcContract.address,
      abi: usdcContract.abi,
      functionName: 'balanceOf',
      args: [sponsorAddress],
    });

    return balance as bigint;
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    return BigInt(0);
  }
}

/**
 * Check if sponsor has approved escrow to spend USDC
 */
export async function getSponsorUSDCAllowance(
  sponsorAddress: Address,
  chainId: number
): Promise<bigint> {
  const usdcContract = getMockUSDCContract(chainId);
  const escrowContract = getResearchFundingEscrowContract(chainId);

  if (!usdcContract || !escrowContract) return BigInt(0);

  const publicClient = getPublicClient(chainId);

  try {
    const allowance = await publicClient.readContract({
      address: usdcContract.address,
      abi: usdcContract.abi,
      functionName: 'allowance',
      args: [sponsorAddress, escrowContract.address],
    });

    return allowance as bigint;
  } catch (error) {
    console.error('Error fetching USDC allowance:', error);
    return BigInt(0);
  }
}

/**
 * Get sponsor wallet configuration from environment
 * For testing/development purposes
 */
export function getSponsorWalletConfig(sponsorId: 1 | 2): {
  privateKey: `0x${string}`;
  address: Address;
} | null {
  const privateKeyEnv = `SPONSOR_${sponsorId}_PRIVATE_KEY`;
  const addressEnv = `SPONSOR_${sponsorId}_ADDRESS`;

  const privateKey = process.env[privateKeyEnv] as `0x${string}` | undefined;
  const address = process.env[addressEnv] as Address | undefined;

  if (!privateKey || !address) {
    console.warn(`Sponsor ${sponsorId} wallet not configured in environment`);
    return null;
  }

  return { privateKey, address };
}
