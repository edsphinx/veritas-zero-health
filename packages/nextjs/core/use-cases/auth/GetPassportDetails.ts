/**
 * Use Case: Get Passport Verification Details
 *
 * Business logic for retrieving complete verification details including stamps
 */

import type {
  HumanProtocolClient,
  VerificationDetails,
  PassportStamp,
} from '@/infrastructure/human/HumanProtocolClient';

export interface GetPassportDetailsRequest {
  address: string;
}

export interface GetPassportDetailsResponse {
  success: boolean;
  data?: {
    verified: boolean;
    score: number;
    threshold: number;
    verifiedAt?: string; // ISO string
    expiresAt?: string; // ISO string
    stamps?: PassportStamp[];
    stampCount?: number;
  };
  error?: string;
}

export class GetPassportDetailsUseCase {
  constructor(private humanClient: HumanProtocolClient) {}

  async execute(
    request: GetPassportDetailsRequest
  ): Promise<GetPassportDetailsResponse> {
    try {
      // Business rule: Validate address
      if (!this.isValidEthereumAddress(request.address)) {
        return {
          success: false,
          error: 'Invalid Ethereum address format',
        };
      }

      // Call infrastructure layer
      const details: VerificationDetails =
        await this.humanClient.getVerificationDetails(request.address);

      // Business rule: Calculate stamp statistics
      const stampCount = details.stamps?.length || 0;

      // Business rule: Determine if user is verified based on our criteria
      const isVerified = this.determineVerificationStatus(details);

      return {
        success: true,
        data: {
          verified: isVerified,
          score: details.score,
          threshold: details.threshold,
          verifiedAt: details.verifiedAt?.toISOString(),
          expiresAt: details.expiresAt?.toISOString(),
          stamps: details.stamps,
          stampCount,
        },
      };
    } catch (error) {
      console.error('[GetPassportDetailsUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get Passport details',
      };
    }
  }

  // Business rule: Validation
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Business rule: Verification status logic
  private determineVerificationStatus(details: VerificationDetails): boolean {
    // Business rules:
    // 1. Must have minimum score (score already reflects stamps)
    // 2. Must not be expired

    const hasMinScore = details.score >= 20; // Configurable threshold
    const notExpired = details.expiresAt
      ? new Date(details.expiresAt) > new Date()
      : true;

    // If score >= threshold, user is verified regardless of stamp count
    // The score already includes stamp contributions
    return details.verified && hasMinScore && notExpired;
  }
}
