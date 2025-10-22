/**
 * Contract Helper Utilities
 *
 * Centralized contract addresses and ABIs for Veritas Zero Health
 * Adapted from bk_nextjs implementation
 */

import deployedContracts from '@/contracts/deployedContracts';
import type { Address } from 'viem';

/**
 * Contract names available in Veritas system
 */
export type ContractName =
  | 'StudyRegistry'
  | 'StudyParticipationSBT'
  | 'StudyEnrollmentData'
  | 'ResearchFundingEscrow'
  | 'HealthIdentitySBT'
  | 'PatientAccountFactory'
  | 'MedicalProviderRegistry'
  | 'CommitmentVaultFactory'
  | 'EligibilityCodeVerifier'
  | 'MockHumanPassport'
  | 'MockUSDC'
  | 'StudyAccessNFT';

/**
 * Map from canonical contract names to deployedContracts keys
 */
const CONTRACT_NAME_MAP: Record<string, string> = {
  'StudyRegistry': 'studyRegistry',
  'StudyParticipationSBT': 'participationSBT',
  'StudyEnrollmentData': 'enrollmentData',
  'ResearchFundingEscrow': 'researchEscrow',
  'HealthIdentitySBT': 'healthIdentity',
  'PatientAccountFactory': 'accountFactory',
  'MedicalProviderRegistry': 'providerRegistry',
  'CommitmentVaultFactory': 'vaultFactory',
  'EligibilityCodeVerifier': 'eligibilityVerifier',
  'MockHumanPassport': 'humanPassport',
  'MockUSDC': 'mockUSDC',
  'StudyAccessNFT': 'studyAccessNFT',
};

/**
 * Get contract address for a specific chain
 */
export function getContractAddress(
  contractName: ContractName,
  chainId: number
): Address | undefined {
  const chainContracts = deployedContracts[chainId as keyof typeof deployedContracts];
  if (!chainContracts) return undefined;

  // Map canonical name to deployedContracts key
  const deployedName = CONTRACT_NAME_MAP[contractName] || contractName;

  const contract = chainContracts[deployedName as keyof typeof chainContracts] as {
    address: Address;
  };
  return contract?.address;
}

/**
 * Get contract ABI
 */
export function getContractABI(contractName: ContractName): readonly unknown[] {
  // Get from any chain since ABI is the same
  const firstChainId = Object.keys(deployedContracts)[0] as unknown as keyof typeof deployedContracts;
  const chainContracts = deployedContracts[firstChainId];

  if (!chainContracts) return [];

  // Map canonical name to deployedContracts key
  const deployedName = CONTRACT_NAME_MAP[contractName] || contractName;

  const contract = chainContracts[deployedName as keyof typeof chainContracts] as {
    abi: readonly unknown[];
  };
  return contract?.abi || [];
}

/**
 * Check if contract is deployed on chain
 */
export function isContractDeployed(
  contractName: ContractName,
  chainId: number
): boolean {
  return !!getContractAddress(contractName, chainId);
}

/**
 * Get all deployed contracts for a chain
 */
export function getDeployedContracts(chainId: number) {
  return deployedContracts[chainId as keyof typeof deployedContracts];
}
