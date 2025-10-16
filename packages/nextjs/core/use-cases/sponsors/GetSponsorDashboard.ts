/**
 * Use Case: Get Sponsor Dashboard Data
 *
 * Retrieves all necessary data for the sponsor dashboard:
 * - Sponsor deposit history (from database)
 * - Total funded amount
 * - Active studies count
 * - Funding statistics
 */

import type { Address } from 'viem';
import type { ISponsorDepositRepository } from '@/core/domain/ISponsorDepositRepository';
import type { SponsorDeposit } from '@/core/domain/SponsorDeposit';

/**
 * Request to get sponsor dashboard
 */
export interface GetSponsorDashboardRequest {
  sponsorAddress: Address;
  chainId: number;
}

/**
 * Response with sponsor dashboard data
 */
export interface GetSponsorDashboardResponse {
  success: boolean;
  data?: {
    deposits: SponsorDeposit[];
    totalFunded: bigint;
    activeStudiesCount: number;
    totalDeposits: number;
  };
  error?: string;
}

/**
 * GetSponsorDashboard Use Case
 *
 * @example
 * ```typescript
 * const depositRepository = createSponsorDepositRepository(prisma);
 * const useCase = new GetSponsorDashboardUseCase(depositRepository);
 *
 * const result = await useCase.execute({
 *   sponsorAddress: "0x...",
 *   chainId: 11155420
 * });
 *
 * if (result.success) {
 *   console.log('Total funded:', result.data.totalFunded);
 * }
 * ```
 */
export class GetSponsorDashboardUseCase {
  constructor(private depositRepository: ISponsorDepositRepository) {}

  /**
   * Execute dashboard data retrieval
   */
  async execute(
    request: GetSponsorDashboardRequest
  ): Promise<GetSponsorDashboardResponse> {
    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Get all deposits by this sponsor
      const deposits = await this.depositRepository.findBySponsor(
        request.sponsorAddress
      );

      // Get total funded amount
      const totalFunded = await this.depositRepository.getTotalBySponsor(
        request.sponsorAddress
      );

      // Get count of deposits
      const totalDeposits = await this.depositRepository.countBySponsor(
        request.sponsorAddress
      );

      // Get unique study IDs (active studies count)
      const studyIds = await this.depositRepository.getStudyIdsBySponsor(
        request.sponsorAddress
      );
      const activeStudiesCount = studyIds.length;

      return {
        success: true,
        data: {
          deposits,
          totalFunded,
          activeStudiesCount,
          totalDeposits,
        },
      };
    } catch (error) {
      console.error('[GetSponsorDashboardUseCase] Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get sponsor dashboard',
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: GetSponsorDashboardRequest): string | null {
    if (!request.sponsorAddress || !request.sponsorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return 'Invalid sponsor address';
    }

    if (!request.chainId) {
      return 'Chain ID is required';
    }

    return null;
  }
}

/**
 * Factory function
 */
export function createGetSponsorDashboardUseCase(
  depositRepository: ISponsorDepositRepository
): GetSponsorDashboardUseCase {
  return new GetSponsorDashboardUseCase(depositRepository);
}
