/**
 * Configuration Index
 *
 * Central export point for all configuration modules
 */

// Blockchain configuration
export {
  DEFAULT_CHAIN_ID,
  SUPPORTED_CHAIN_IDS,
  CHAIN_NAMES,
  BLOCK_EXPLORER_URLS,
  RPC_URLS,
  getTransactionUrl,
  getAddressUrl,
  isChainSupported,
  getChainName,
} from './blockchain.config';

// Token configuration
export {
  PAYMENT_TOKENS,
  ERC20_ABI,
  getTokenConfig,
  getAvailableTokens,
  formatTokenAmount,
  parseTokenAmount,
  type TokenConfig,
} from './tokens.config';
