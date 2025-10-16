/**
 * VZH Write Contract Hook
 *
 * Base hook for writing to Veritas contracts
 */

'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type ContractName, getContractAddress, getContractABI } from './contracts';
import { useChainId } from 'wagmi';

export interface UseVzhWriteContractParams {
  contractName: ContractName;
}

/**
 * Hook to write to Veritas contracts
 *
 * Wrapper around wagmi's useWriteContract with automatic address/ABI resolution
 *
 * @example
 * ```typescript
 * const { write, isPending, isSuccess } = useVzhWriteContract({
 *   contractName: 'StudyRegistryImpl',
 * });
 *
 * // Later...
 * write({
 *   functionName: 'submitAnonymousApplication',
 *   args: [studyId, proof],
 * });
 * ```
 */
export function useVzhWriteContract({ contractName }: UseVzhWriteContractParams) {
  const chainId = useChainId();
  const address = getContractAddress(contractName, chainId);
  const abi = getContractABI(contractName);

  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
    isError,
    error,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Write to contract with automatic address/ABI
   */
  const write = ({
    functionName,
    args,
  }: {
    functionName: string;
    args?: readonly unknown[];
  }) => {
    if (!address) {
      throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
    }

    return writeContract({
      address,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      abi: abi as any,
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: args as any,
    });
  };

  /**
   * Write to contract async with automatic address/ABI
   */
  const writeAsync = async ({
    functionName,
    args,
  }: {
    functionName: string;
    args?: readonly unknown[];
  }) => {
    if (!address) {
      throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
    }

    return writeContractAsync({
      address,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      abi: abi as any,
      functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: args as any,
    });
  };

  return {
    write,
    writeAsync,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    isError: isError || !!confirmError,
    error: error || confirmError,
  };
}
