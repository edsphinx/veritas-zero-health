/**
 * ERC20 Token Configuration
 *
 * Supported payment tokens for study funding
 * Each chain can have different token addresses
 */

import type { Address } from 'viem';

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  addresses: Record<number, Address>; // chainId -> address
  icon?: string;
}

/**
 * Supported payment tokens
 */
export const PAYMENT_TOKENS: Record<string, TokenConfig> = {
  USDC: {
    symbol: 'USDC',
    name: 'Mock USDC (Testnet)',
    decimals: 6,
    addresses: {
      11155420: '0x29c97a7d15a6eb2c0c6efffc27577991b57b6e67', // MockUSDC deployed on Optimism Sepolia
      10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism Mainnet (Real USDC)
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet (Real USDC)
    },
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    addresses: {
      11155420: '0x0000000000000000000000000000000000000000', // TODO: Add Optimism Sepolia
      10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism Mainnet
    },
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    addresses: {
      11155420: '0x0000000000000000000000000000000000000000', // TODO: Add Optimism Sepolia
      10: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Optimism Mainnet
    },
  },
};

/**
 * Get token configuration by symbol and chain
 */
export function getTokenConfig(symbol: string, chainId: number): {
  address: Address;
  decimals: number;
  name: string;
} | null {
  const token = PAYMENT_TOKENS[symbol.toUpperCase()];
  if (!token) return null;

  const address = token.addresses[chainId];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return null; // Token not deployed on this chain
  }

  return {
    address,
    decimals: token.decimals,
    name: token.name,
  };
}

/**
 * Get available tokens for a specific chain
 */
export function getAvailableTokens(chainId: number): TokenConfig[] {
  return Object.values(PAYMENT_TOKENS).filter(
    (token) =>
      token.addresses[chainId] &&
      token.addresses[chainId] !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === BigInt(0)) {
    return whole.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0');
  return `${whole}.${remainderStr}`;
}

/**
 * Parse token amount from user input to bigint
 */
export function parseTokenAmount(amount: string | number, decimals: number): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const [whole, decimal = ''] = amountStr.split('.');

  const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
  const combined = whole + paddedDecimal;

  return BigInt(combined);
}

/**
 * Standard ERC20 ABI (approve, balanceOf, allowance)
 */
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
