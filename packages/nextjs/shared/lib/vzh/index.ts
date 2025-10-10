/**
 * VZH (Veritas Zero Health) Library
 *
 * Core library for interacting with Veritas smart contracts
 */

// Contract utilities
export {
  type ContractName,
  getContractAddress,
  getContractABI,
  isContractDeployed,
  getDeployedContracts,
} from './contracts';

// Hooks
export {
  useVzhReadContract,
  type UseVzhReadContractParams,
} from './useVzhReadContract';

export {
  useVzhWriteContract,
  type UseVzhWriteContractParams,
} from './useVzhWriteContract';
