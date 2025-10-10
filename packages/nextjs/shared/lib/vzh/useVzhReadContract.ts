/**
 * VZH Read Contract Hook
 *
 * Base hook for reading from Veritas contracts
 */

'use client';

import { useReadContract } from 'wagmi';
import { type ContractName, getContractAddress, getContractABI } from './contracts';

export interface UseVzhReadContractParams<TFunctionName extends string = string> {
  contractName: ContractName;
  functionName: TFunctionName;
  args?: readonly unknown[];
  chainId?: number;
  enabled?: boolean;
}

/**
 * Hook to read from Veritas contracts
 *
 * Wrapper around wagmi's useReadContract with automatic address/ABI resolution
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useVzhReadContract({
 *   contractName: 'StudyRegistryImpl',
 *   functionName: 'getTotalStudies',
 * });
 * ```
 */
export function useVzhReadContract<TFunctionName extends string = string>({
  contractName,
  functionName,
  args,
  chainId,
  enabled = true,
}: UseVzhReadContractParams<TFunctionName>) {
  // Get contract address and ABI
  const address = chainId ? getContractAddress(contractName, chainId) : undefined;
  const abi = getContractABI(contractName);

  // Use wagmi's useReadContract
  const result = useReadContract({
    address,
    abi,
    functionName,
    args,
    query: {
      enabled: enabled && !!address,
    },
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch,
  };
}
