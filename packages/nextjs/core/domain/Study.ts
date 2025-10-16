/**
 * Study Entity (Domain Model)
 *
 * Represents a clinical study indexed from blockchain contracts.
 * This entity maps the relationship between StudyRegistry and ResearchFundingEscrow.
 */

export interface Study {
  id?: string; // Database ID (optional for new entities)

  // Contract IDs
  registryId: number; // ID from StudyRegistry contract
  escrowId: number; // ID from ResearchFundingEscrow contract

  // Basic info
  title: string;
  description: string;
  researcherAddress: string; // Creator's wallet address

  // Status
  status: StudyStatus;

  // Blockchain tracking
  chainId: number; // 11155420 for Optimism Sepolia

  // Transaction hashes for verification
  escrowTxHash: string; // TX that created study in escrow
  registryTxHash: string; // TX that published to registry
  criteriaTxHash: string; // TX that set criteria

  // Block numbers for event indexing
  escrowBlockNumber: bigint;
  registryBlockNumber: bigint;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export enum StudyStatus {
  CREATED = 'Created',
  FUNDING = 'Funding',
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

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
