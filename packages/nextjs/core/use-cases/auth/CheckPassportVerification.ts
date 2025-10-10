/**
 * Use Case: Check if User is Verified
 *
 * Simple use case to check verification status
 * Used for quick checks (e.g., before allowing trial application)
 */

import type { HumanProtocolClient } from '@/infrastructure/human/HumanProtocolClient';

export interface CheckPassportVerificationRequest {
  address: string;
}

export interface CheckPassportVerificationResponse {
  success: boolean;
  data?: {
    isVerified: boolean;
    reason?: string; // Why verification failed/passed
  };
  error?: string;
}

export class CheckPassportVerificationUseCase {
  constructor(private humanClient: HumanProtocolClient) {}

  async execute(
    request: CheckPassportVerificationRequest
  ): Promise<CheckPassportVerificationResponse> {
    try {
      // Validate
      if (!this.isValidEthereumAddress(request.address)) {
        return {
          success: true, // Not an error, just invalid input
          data: {
            isVerified: false,
            reason: 'Invalid Ethereum address format',
          },
        };
      }

      // Check verification
      const isVerified = await this.humanClient.isVerified(request.address);

      // Business rule: Provide reason for status
      const reason = isVerified
        ? 'User meets minimum Passport score threshold'
        : 'User does not meet minimum Passport score threshold';

      return {
        success: true,
        data: {
          isVerified,
          reason,
        },
      };
    } catch (error) {
      console.error('[CheckPassportVerificationUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check verification',
      };
    }
  }

  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
