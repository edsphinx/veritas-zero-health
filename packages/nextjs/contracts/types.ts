/**
 * Contract Types
 *
 * Type definitions for deployed contracts
 */

export interface GenericContract {
  address: `0x${string}`;
  abi: readonly any[];
  inheritedFunctions?: Record<string, string>;
  deployedOnBlock?: number;
}

export type GenericContractsDeclaration = Record<
  number, // chainId
  Record<string, GenericContract> // contractName -> contract
>;
