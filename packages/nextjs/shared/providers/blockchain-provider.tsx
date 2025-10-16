/**
 * Blockchain Provider
 *
 * Centralized blockchain configuration and context
 * Provides network settings, RPC URLs, and chain configuration
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { type Chain } from 'viem';
import { optimismSepolia, optimism } from 'viem/chains';

// ==================== TYPES ====================

export interface BlockchainConfig {
  /** Current chain ID */
  chainId: number;

  /** Current chain object */
  chain: Chain;

  /** RPC URL for this chain */
  rpcUrl: string;

  /** Block explorer URL */
  explorerUrl: string;

  /** Whether this is a testnet */
  isTestnet: boolean;

  /** Contract deployment addresses */
  contracts: {
    studyRegistry?: `0x${string}`;
    researchFundingEscrow?: `0x${string}`;
    studyParticipationSBT?: `0x${string}`;
    studyEnrollmentData?: `0x${string}`;
    eligibilityVerifier?: `0x${string}`;
    healthIdentitySBT?: `0x${string}`;
    complianceScore?: `0x${string}`;
  };
}

// ==================== CHAIN CONFIGURATIONS ====================

/**
 * Optimism Sepolia (Testnet)
 */
const OPTIMISM_SEPOLIA_CONFIG: BlockchainConfig = {
  chainId: optimismSepolia.id,
  chain: optimismSepolia,
  rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
  explorerUrl: 'https://sepolia-optimism.etherscan.io',
  isTestnet: true,
  contracts: {
    // These would be loaded from deployedContracts.ts or environment
    // For now, we'll set them as optional
  },
};

/**
 * Optimism Mainnet
 */
const OPTIMISM_MAINNET_CONFIG: BlockchainConfig = {
  chainId: optimism.id,
  chain: optimism,
  rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  explorerUrl: 'https://optimistic.etherscan.io',
  isTestnet: false,
  contracts: {},
};

/**
 * Get configuration for a chain ID
 */
function getChainConfig(chainId: number): BlockchainConfig {
  switch (chainId) {
    case optimismSepolia.id:
      return OPTIMISM_SEPOLIA_CONFIG;
    case optimism.id:
      return OPTIMISM_MAINNET_CONFIG;
    default:
      console.warn(`Unsupported chain ID: ${chainId}, falling back to Optimism Sepolia`);
      return OPTIMISM_SEPOLIA_CONFIG;
  }
}

// ==================== CONTEXT ====================

interface BlockchainContextValue extends BlockchainConfig {
  /** Switch to a different chain */
  switchChain: (chainId: number) => void;

  /** Get transaction URL for explorer */
  getTxUrl: (txHash: string) => string;

  /** Get address URL for explorer */
  getAddressUrl: (address: string) => string;

  /** Get contract address by name */
  getContractAddress: (contractName: keyof BlockchainConfig['contracts']) => `0x${string}` | undefined;
}

const BlockchainContext = createContext<BlockchainContextValue | null>(null);

// ==================== PROVIDER ====================

interface BlockchainProviderProps {
  children: ReactNode;
  /** Initial chain ID (defaults to env or Optimism Sepolia) */
  initialChainId?: number;
}

export function BlockchainProvider({ children, initialChainId }: BlockchainProviderProps) {
  // Determine initial chain from env or props
  const defaultChainId = initialChainId ||
    parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '') ||
    optimismSepolia.id;

  // For now, use static config (in future, could add state for chain switching)
  const config = getChainConfig(defaultChainId);

  const switchChain = (chainId: number) => {
    // In a real implementation, this would:
    // 1. Update state
    // 2. Trigger wallet network switch
    // 3. Re-initialize contracts
    console.log(`[BlockchainProvider] Switch chain requested: ${chainId}`);
    console.warn('Chain switching not yet implemented');
  };

  const getTxUrl = (txHash: string): string => {
    return `${config.explorerUrl}/tx/${txHash}`;
  };

  const getAddressUrl = (address: string): string => {
    return `${config.explorerUrl}/address/${address}`;
  };

  const getContractAddress = (
    contractName: keyof BlockchainConfig['contracts']
  ): `0x${string}` | undefined => {
    return config.contracts[contractName];
  };

  const value: BlockchainContextValue = {
    ...config,
    switchChain,
    getTxUrl,
    getAddressUrl,
    getContractAddress,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * Hook to access blockchain configuration
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { chainId, chain, getTxUrl, getContractAddress } = useBlockchain();
 *
 *   const registryAddress = getContractAddress('studyRegistry');
 *   const txUrl = getTxUrl('0x123...');
 *
 *   return <div>Connected to {chain.name}</div>;
 * }
 * ```
 */
export function useBlockchain(): BlockchainContextValue {
  const context = useContext(BlockchainContext);

  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }

  return context;
}

// ==================== UTILITIES ====================

/**
 * Format chain name for display
 */
export function formatChainName(chainId: number): string {
  const config = getChainConfig(chainId);
  return config.isTestnet ? `${config.chain.name} (Testnet)` : config.chain.name;
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return [optimismSepolia.id as number, optimism.id as number].includes(chainId);
}

/**
 * Get all supported chains
 */
export function getSupportedChains(): BlockchainConfig[] {
  return [OPTIMISM_SEPOLIA_CONFIG, OPTIMISM_MAINNET_CONFIG];
}
