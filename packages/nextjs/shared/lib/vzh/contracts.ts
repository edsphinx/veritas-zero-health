/**
 * VZH Contract Utilities
 *
 * Centralized contract addresses and ABIs for Veritas Zero Health
 * Uses generated deployedContracts from scaffold-eth-2
 */

import deployedContracts from '@/contracts/deployedContracts';

/**
 * Contract names available in Veritas system
 */
export type ContractName = 'StudyRegistryImpl' | 'AgeVerifier';

/**
 * Get contract address for a specific chain
 */
export function getContractAddress(
  contractName: ContractName,
  chainId: number
): `0x${string}` | undefined {
  const chainContracts = deployedContracts[chainId as keyof typeof deployedContracts];
  if (!chainContracts) return undefined;

  const contract = chainContracts[contractName as keyof typeof chainContracts];
  return contract?.address as `0x${string}` | undefined;
}

/**
 * Get contract ABI
 */
export function getContractABI(contractName: ContractName): readonly any[] {
  // Get from any chain since ABI is the same
  const firstChainId = Object.keys(deployedContracts)[0] as unknown as keyof typeof deployedContracts;
  const chainContracts = deployedContracts[firstChainId];

  if (!chainContracts) return [];

  const contract = chainContracts[contractName as keyof typeof chainContracts];
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
