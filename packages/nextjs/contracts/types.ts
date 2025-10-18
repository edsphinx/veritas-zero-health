/**
 * ⚠️ TEMPORARY PLACEHOLDER - DO NOT USE IN PRODUCTION
 *
 * This file is a temporary placeholder created during the migration from bk_nextjs.
 * It exists to prevent TypeScript errors during CI/CD when foundry deploys contracts.
 *
 * TODO: Replace with proper contract types when migrating blockchain functionality
 * See: packages/bk_nextjs/contracts/types.ts for reference implementation
 *
 * Migration checklist:
 * - [ ] Review contract deployment flow (foundry scripts)
 * - [ ] Migrate contract ABIs and addresses
 * - [ ] Update type definitions to match deployed contracts
 * - [ ] Test contract interactions with wagmi/viem
 * - [ ] Remove this placeholder and warning
 */

export interface GenericContract {
  address: `0x${string}`;
  abi: readonly any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  inheritedFunctions?: Record<string, string>;
  deployedOnBlock?: number;
}

export type GenericContractsDeclaration = Record<
  number, // chainId
  Record<string, GenericContract> // contractName -> contract
>;
