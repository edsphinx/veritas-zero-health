/**
 * Human Passport (Gitcoin Passport) Client
 *
 * Infrastructure layer service for Gitcoin Passport API v2
 * Provides Sybil-resistant identity verification using stamps
 *
 * API Documentation: https://docs.passport.xyz/building-with-passport/passport-api
 * Base URL: https://api.passport.xyz
 *
 * Requirements:
 * - NEXT_PUBLIC_PASSPORT_API_KEY (from https://passport.xyz developer portal)
 * - NEXT_PUBLIC_PASSPORT_SCORER_ID (from developer portal)
 *
 * @see https://docs.passport.xyz/
 * @see https://passport.xyz/
 */

import type {
  PassportConfig,
  VerificationResult,
  VerificationDetails,
} from '@veritas/types';

// ============================================
// Internal API Response Types
// ============================================

interface PassportStampScore {
  score: string;
}

interface PassportScoreResponse {
  address: string;
  score: string;
  passing_score: boolean;
  threshold: string;
  last_score_timestamp: string;
  expiration_timestamp: string;
  stamp_scores: Record<string, PassportStampScore>;
}

interface PassportStamp {
  version: string;
  credential: unknown;
}

interface PassportStampsResponse {
  address: string;
  stamps: PassportStamp[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert API response to VerificationResult
 */
function toVerificationResult(
  apiResponse: PassportScoreResponse,
  minScore = 20
): VerificationResult {
  const score = parseFloat(apiResponse.score);
  const threshold = parseFloat(apiResponse.threshold);

  return {
    success: true,
    verified: apiResponse.passing_score && score >= minScore,
    score,
    passingScore: apiResponse.passing_score,
    threshold,
    lastUpdated: apiResponse.last_score_timestamp,
    expiresAt: apiResponse.expiration_timestamp,
    stampScores: Object.entries(apiResponse.stamp_scores || {}).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: parseFloat(value.score),
      }),
      {}
    ),
  };
}

export class PassportClient {
  private config: PassportConfig;
  private baseUrl: string;

  constructor(config: PassportConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || 'https://api.passport.xyz';

    // Validate required config
    if (!this.config.apiKey) {
      throw new Error('Passport API key is required');
    }
    if (!this.config.scorerId) {
      throw new Error('Passport Scorer ID is required');
    }
  }

  // ============================================
  // Passport API v2 Methods
  // ============================================

  /**
   * Get Passport score for an address
   * Uses Passport API v2: GET /v2/stamps/{scorer_id}/score/{address}
   *
   * @param address - Ethereum address to check
   * @returns Verification result with score and stamps
   */
  async getPassportScore(address: string): Promise<VerificationResult> {
    try {
      console.log(`[Passport] Getting score for ${address}`);

      const url = `${this.baseUrl}/v2/stamps/${this.config.scorerId}/score/${address}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Passport] Score API error ${response.status}:`, errorText);
        throw new Error(
          `Passport API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: PassportScoreResponse = await response.json();
      console.log(`[Passport] Score retrieved: ${data.score} (passing: ${data.passing_score})`);

      // Convert API response to VerificationResult using helper
      return toVerificationResult(data, this.config.minScore);
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

      const url = new URL(`${this.baseUrl}/v2/stamps/${address}`);
      if (includeMetadata) {
        url.searchParams.set('include_metadata', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Passport] Stamps API error ${response.status}:`, errorText);
        throw new Error(
          `Passport API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: PassportStampsResponse = await response.json();
      console.log(`[Passport] Found ${data.stamps.length} stamps`);

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
      console.log(`[Passport] Getting verification details for ${address}`);

      // Get score (primary data)
      const scoreResult = await this.getPassportScore(address);

      // Try to get stamps, but don't fail if endpoint is unavailable
      let stamps: PassportStamp[] | undefined;
      try {
        const stampsResult = await this.getPassportStamps(address);
        stamps = stampsResult.stamps;
      } catch (stampsError) {
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
      console.error('[Passport] Failed to get verification details:', error);
      throw new Error(
        `Failed to get verification details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Factory function to create Passport client with environment config
 *
 * @param config - Optional configuration overrides
 * @returns Configured PassportClient instance
 */
export function createPassportClient(
  config?: Partial<PassportConfig>
): PassportClient {
  const defaultConfig: PassportConfig = {
    apiKey: process.env.NEXT_PUBLIC_PASSPORT_API_KEY || '',
    scorerId: process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID || '',
    minScore: 20, // Default recommended threshold
    ...config,
  };

  return new PassportClient(defaultConfig);
}
