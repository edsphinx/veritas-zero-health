/**
 * Human Passport Client
 *
 * Infrastructure layer service for Human Passport (formerly Gitcoin Passport)
 * Integrates Passport API v2 for Sybil-resistant identity verification
 *
 * API Documentation: https://docs.passport.xyz/building-with-passport/passport-api
 * Base URL: https://api.passport.xyz
 *
 * Requirements:
 * - API Key (from https://passport.xyz developer portal)
 * - Scorer ID (from developer portal)
 *
 * @see https://docs.passport.xyz/
 * @see https://passport.xyz/
 */

export interface PassportConfig {
  apiKey: string; // Required: API key from Passport developer portal
  scorerId: string; // Required: Scorer ID from developer portal
  apiUrl?: string; // Optional: Custom API endpoint (default: https://api.passport.xyz)
  minScore?: number; // Optional: Minimum passing score (default: 20)
}

export interface HumanConfig {
  // Passport configuration (Sybil resistance)
  passport: PassportConfig;

  // TODO: Add Human Wallet configuration when available
  // wallet?: { ... };

  // TODO: Add Human Network configuration when available
  // network?: { ... };
}

/**
 * Passport API v2 Response Types
 * Based on official API documentation
 */

export interface PassportStampScore {
  score: string; // Individual stamp score
}

export interface PassportScoreResponse {
  address: string; // Ethereum address
  score: string; // Total Passport score (string format)
  passing_score: boolean; // Whether score meets threshold
  threshold: string; // Recommended threshold (default: "20")
  last_score_timestamp: string; // ISO timestamp
  expiration_timestamp: string; // ISO timestamp
  stamp_scores: Record<string, PassportStampScore>; // Individual stamp scores
}

export interface PassportStamp {
  version: string;
  credential: any; // Verifiable credential data
}

export interface PassportStampsResponse {
  address: string;
  stamps: PassportStamp[];
}

/**
 * Internal types for application use
 */

export interface VerificationResult {
  success: boolean;
  verified: boolean; // Whether user meets minimum score
  score: number; // Numerical score
  passingScore: boolean; // From API response
  threshold: number; // Score threshold
  lastUpdated: Date;
  expiresAt: Date;
  stampScores?: Record<string, number>; // Individual stamp contributions
}

export interface VerificationDetails {
  verified: boolean;
  score: number;
  threshold: number;
  verifiedAt?: Date;
  expiresAt?: Date;
  stamps?: PassportStamp[];
}

import { testAddressProvider } from './TestAddressProvider';

export class HumanProtocolClient {
  private config: HumanConfig;
  private baseUrl: string;

  constructor(config: HumanConfig) {
    this.config = config;
    this.baseUrl = config.passport.apiUrl || 'https://api.passport.xyz';
  }

  // ============================================
  // Passport API v2 Integration
  // ============================================

  /**
   * Get Passport score for an address
   * Uses Passport API v2: GET /v2/stamps/{scorer_id}/score/{address}
   *
   * @param address - Ethereum address to check
   * @returns Verification result with score
   */
  async getPassportScore(address: string): Promise<VerificationResult> {
    try {
      console.log(`[Passport] Getting score for ${address}`);

      // Check if this is a test address that should bypass verification
      if (testAddressProvider.isTestAddress(address)) {
        console.log(`[Passport] ✅ BYPASS: Test address detected, returning mock verification`);
        return testAddressProvider.getMockVerificationResult();
      }

      // Real verification for addresses that require it
      console.log(`[Passport] 🔐 REAL VERIFICATION: Making API call for ${address}`);
      const url = `${this.baseUrl}/v2/stamps/${this.config.passport.scorerId}/score/${address}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.config.passport.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Passport] Score API error ${response.status}:`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: PassportScoreResponse = await response.json();

      // Convert API response to internal format
      const score = parseFloat(data.score);
      const threshold = parseFloat(data.threshold);
      const minScore = this.config.passport.minScore || 20;

      return {
        success: true,
        verified: data.passing_score && score >= minScore,
        score,
        passingScore: data.passing_score,
        threshold,
        lastUpdated: new Date(data.last_score_timestamp),
        expiresAt: new Date(data.expiration_timestamp),
        stampScores: Object.entries(data.stamp_scores || {}).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: parseFloat(value.score),
          }),
          {}
        ),
      };
    } catch (error) {
      console.error('[Passport] Failed to get score:', error);
      throw new Error(
        `Failed to get Passport score: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get Passport stamps for an address
   * Uses Passport API v2: GET /v2/stamps/{address}
   *
   * @param address - Ethereum address to check
   * @param includeMetadata - Whether to include stamp metadata (default: false)
   * @returns Stamps data
   */
  async getPassportStamps(
    address: string,
    includeMetadata = false
  ): Promise<PassportStampsResponse> {
    try {
      console.log(`[Passport] Getting stamps for ${address}`);

      // Updated endpoint path for API v2
      const url = new URL(`${this.baseUrl}/v2/stamps/${address}`);
      if (includeMetadata) {
        url.searchParams.set('include_metadata', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-KEY': this.config.passport.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: PassportStampsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('[Passport] Failed to get stamps:', error);
      throw new Error(
        `Failed to get Passport stamps: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if address is verified (meets minimum score)
   *
   * @param address - Ethereum address to check
   * @returns True if verified, false otherwise
   */
  async isVerified(address: string): Promise<boolean> {
    try {
      const result = await this.getPassportScore(address);
      return result.verified;
    } catch (error) {
      console.error('[Passport] Verification check failed:', error);
      return false;
    }
  }

  /**
   * Get complete verification details for an address
   * Includes score and optionally stamps if available
   *
   * @param address - Ethereum address to check
   * @returns Complete verification details
   */
  async getVerificationDetails(address: string): Promise<VerificationDetails> {
    try {
      // Check if this is a test address that should bypass verification
      if (testAddressProvider.isTestAddress(address)) {
        console.log(`[Passport] ✅ BYPASS: Test address detected for verification details`);
        return testAddressProvider.getMockVerificationDetails(address);
      }

      // Real verification - get score (this endpoint works)
      console.log(`[Passport] 🔐 REAL VERIFICATION: Getting details for ${address}`);
      const scoreResult = await this.getPassportScore(address);

      // Try to get stamps, but don't fail if endpoint doesn't exist
      let stamps: PassportStamp[] | undefined;
      try {
        const stampsResult = await this.getPassportStamps(address);
        stamps = stampsResult.stamps;
      } catch (error) {
        console.warn('[Passport] Stamps endpoint not available, continuing without stamps');
        stamps = undefined;
      }

      return {
        verified: scoreResult.verified,
        score: scoreResult.score,
        threshold: scoreResult.threshold,
        verifiedAt: scoreResult.lastUpdated,
        expiresAt: scoreResult.expiresAt,
        stamps,
      };
    } catch (error) {
      console.error('[Passport] Failed to get details:', error);
      throw new Error(
        `Failed to get verification details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

}

/**
 * Factory function to create Passport client
 *
 * @param config - Configuration options
 * @returns Configured client instance
 */
export function createPassportClient(
  config?: Partial<HumanConfig>
): HumanProtocolClient {
  const defaultConfig: HumanConfig = {
    passport: {
      apiKey: process.env.NEXT_PUBLIC_PASSPORT_API_KEY || '',
      scorerId: process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID || '',
      minScore: 20, // Default recommended threshold
      ...config?.passport,
    },
  };

  return new HumanProtocolClient(defaultConfig);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use createPassportClient instead
 */
export function createHumanProtocolClient(
  config?: Partial<HumanConfig>
): HumanProtocolClient {
  return createPassportClient(config);
}
