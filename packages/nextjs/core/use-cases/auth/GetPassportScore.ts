/**
 * Use Case: Get Passport Score
 *
 * Business logic for retrieving and processing Passport verification scores
 * This is where the actual business rules live - NOT in API routes or components
 */

import type {
  HumanProtocolClient,
  VerificationResult,
} from '@/infrastructure/human/HumanProtocolClient';

export interface GetPassportScoreRequest {
  address: string;
}

export interface GetPassportScoreResponse {
  success: boolean;
  data?: {
    verified: boolean;
    score: number;
    threshold: number;
    passingScore: boolean;
    lastUpdated: string; // ISO string
    expiresAt: string; // ISO string
    stampScores?: Record<string, number>;
  };
  error?: string;
}

export class GetPassportScoreUseCase {
  constructor(private humanClient: HumanProtocolClient) {}

  async execute(
    request: GetPassportScoreRequest
  ): Promise<GetPassportScoreResponse> {
    try {
      // Business rule: Validate address format
      if (!this.isValidEthereumAddress(request.address)) {
        return {
          success: false,
          error: 'Invalid Ethereum address format',
        };
      }

      // Call infrastructure layer
      const result: VerificationResult =
        await this.humanClient.getPassportScore(request.address);

      // Business rule: Apply custom threshold if needed
      // For our use case, we might want stricter verification than default
      const customThreshold = 25; // Example: We require 25+ score
      const meetsOurThreshold = result.score >= customThreshold;

      // Transform to response format
      return {
        success: true,
        data: {
          verified: result.verified && meetsOurThreshold, // Combined verification
          score: result.score,
          threshold: Math.max(result.threshold, customThreshold),
          passingScore: result.passingScore && meetsOurThreshold,
          lastUpdated: result.lastUpdated.toISOString(),
          expiresAt: result.expiresAt.toISOString(),
          stampScores: result.stampScores,
        },
      };
    } catch (error) {
      // Business rule: How to handle errors
      console.error('[GetPassportScoreUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get Passport score',
      };
    }
  }

  // Business rule: Address validation
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
