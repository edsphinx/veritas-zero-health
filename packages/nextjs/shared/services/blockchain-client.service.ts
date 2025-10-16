/**
 * Blockchain Client Service
 *
 * Centralized service for creating and managing Viem clients
 * Provides abstraction over RPC providers and wallet connections
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia, optimism, sepolia, mainnet } from 'viem/chains';

/**
 * Supported chains configuration
 */
const CHAINS: Record<number, Chain> = {
  [optimismSepolia.id]: optimismSepolia,
  [optimism.id]: optimism,
  [sepolia.id]: sepolia,
  [mainnet.id]: mainnet,
};

/**
 * RPC URLs configuration
 * Prioritizes environment variables, falls back to public RPCs
 */
function getRPCUrl(chainId: number): string {
  switch (chainId) {
    case optimismSepolia.id:
      return process.env.OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io';
    case optimism.id:
      return process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io';
    case sepolia.id:
      return process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
    case mainnet.id:
      return process.env.MAINNET_RPC_URL || 'https://eth.llamarpc.com';
    default:
      throw new Error(`No RPC URL configured for chain ${chainId}`);
  }
}

/**
 * Get chain configuration by ID
 */
export function getChain(chainId: number): Chain {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }
  return chain;
}

/**
 * Create a public client for reading from blockchain
 */
export function getPublicClient(chainId: number): PublicClient {
  const chain = getChain(chainId);
  const rpcUrl = getRPCUrl(chainId);

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Create a wallet client from private key
 * Used for server-side signing (API routes)
 */
export function getWalletClientFromPrivateKey(
  chainId: number,
  privateKey: `0x${string}`
): WalletClient {
  const chain = getChain(chainId);
  const rpcUrl = getRPCUrl(chainId);
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Create a wallet client with existing account
 * Used when account is already created
 */
export function getWalletClient(
  chainId: number,
  account: Account
): WalletClient {
  const chain = getChain(chainId);
  const rpcUrl = getRPCUrl(chainId);

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Get default chain ID
 * Returns Optimism Sepolia for development
 */
export function getDefaultChainId(): number {
  const chainIdFromEnv = process.env.CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainIdFromEnv ? parseInt(chainIdFromEnv) : optimismSepolia.id;
}

/**
 * Check if chain is testnet
 */
export function isTestnet(chainId: number): boolean {
  return [optimismSepolia.id, sepolia.id as number].includes(chainId);
}

/**
 * Get account from private key
 * Used for server-side signing operations
 */
export function getAccountFromPrivateKey(privateKey: `0x${string}`): Account {
  return privateKeyToAccount(privateKey);
}

/**
 * Sign a message with private key
 * Abstraction for server-side message signing
 */
export async function signMessageWithPrivateKey(
  privateKey: `0x${string}`,
  message: `0x${string}` | { raw: `0x${string}` }
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(privateKey);
  const signature = await account.signMessage({
    message: typeof message === 'string' ? message : message,
  });
  return signature;
}
