/**
 * Study Entity (Domain Model)
 *
 * Represents a clinical study indexed from blockchain contracts.
 * This entity maps the relationship between StudyRegistry and ResearchFundingEscrow.
 *
 * @deprecated This domain model is being phased out in favor of the centralized
 * Study type from @veritas/types. Use that for all new code.
 */

import type { Study as StudyFromTypes } from '@veritas/types';
import { StudyStatus as StudyStatusFromTypes } from '@veritas/types';

/**
 * @deprecated Use Study from @veritas/types instead
 */
export type Study = StudyFromTypes;

/**
 * @deprecated Use StudyStatus from @veritas/types instead
 */
export const StudyStatus = StudyStatusFromTypes;

/**
 * Study creation data (from blockchain)
 */
export interface CreateStudyData {
  registryId: number;
  escrowId: number;
  title: string;
  description: string;
  researcherAddress: string;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: bigint;
  registryBlockNumber: bigint;
  chainId?: number;
}
