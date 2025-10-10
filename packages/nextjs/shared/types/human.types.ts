/**
 * Shared type definitions for Human Protocol integration
 *
 * These types are used across the application for Human Wallet,
 * Human Passport, and Human Network interactions.
 */

// ============================================
// Human Wallet Types
// ============================================

export type WalletConnectionMethod = 'web3' | 'email' | 'google' | 'twitter';

export interface HumanWalletConfig {
  enableWeb2Login?: boolean;
  supportedAuthProviders?: ('email' | 'google' | 'twitter')[];
}

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  method?: 'web3' | 'email' | 'social';
  error?: string;
}

export interface WalletStatus {
  connected: boolean;
  address?: string;
  method?: 'web3' | 'email' | 'social';
}

// ============================================
// Human Passport Types
// ============================================

export interface PassportConfig {
  apiKey?: string;
  scorerId?: string;
  minScore?: number; // Minimum humanity score (0-100)
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  score: number;
  timestamp: number;
  proof?: string;
}

export interface VerificationDetails {
  verified: boolean;
  verifiedAt?: number;
  score: number;
  expiresAt?: number;
  proof?: string;
}

export interface PassportVerificationStatus {
  isVerified: boolean;
  humanityScore: number;
  verifiedAt?: number;
  expiresAt?: number;
}

// ============================================
// Human Network Types
// ============================================

export type HumanNetwork = 'mainnet' | 'testnet';

export interface NetworkConfig {
  chainId?: number;
  rpcUrl?: string;
  explorerUrl?: string;
}

// ============================================
// Combined Human Config
// ============================================

export interface HumanConfig {
  wallet?: HumanWalletConfig;
  passport?: PassportConfig;
  network: HumanNetwork;
  apiKey?: string;
  apiUrl?: string;
}

// ============================================
// API Response Types
// ============================================

export interface HumanApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface VerifyPassportRequest {
  address: string;
  did?: string; // Optional DID for linking
}

export interface ConnectWalletRequest {
  method: WalletConnectionMethod;
  identifier?: string; // Email or social identifier
}

// ============================================
// UI State Types
// ============================================

export interface HumanVerificationState {
  isLoading: boolean;
  isVerified: boolean;
  verificationDetails?: VerificationDetails;
  error?: string;
}

export interface HumanWalletState {
  isConnecting: boolean;
  isConnected: boolean;
  address?: string;
  method?: 'web3' | 'email' | 'social';
  error?: string;
}
