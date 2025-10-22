/**
 * Study Domain Entity
 *
 * Re-exports the Study type from @veritas/types (single source of truth)
 * Domain layer uses this import for type safety and consistency
 */

import type { Study, StudyStatus } from '@veritas/types';
import type { Prisma } from '@prisma/client';

// Re-export Study type
export type { Study, StudyStatus };

// Helper type for creating new studies
// Uses Prisma-compatible types for BigInt and Decimal fields
export type CreateStudyData = {
  registryId: number | null; // Null until registry TX completes
  escrowId: number | null; // Null until escrow TX completes
  title: string;
  description: string;
  researcherAddress: string;
  status: string;
  totalFunding?: Prisma.Decimal | string | number;
  sponsor: string; // Primary sponsor address (required)
  maxParticipants: number; // Maximum participants allowed (required)
  certifiedProviders?: string[]; // Optional: defaults to empty array
  remainingFunding?: Prisma.Decimal | string | number; // Optional: defaults to totalFunding
  participantCount?: number; // Optional: defaults to 0
  chainId?: number;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: bigint | number | string;
  registryBlockNumber: bigint | number | string;
};

// Helper type for updating studies (partial, omit immutable fields)
export type UpdateStudyData = Partial<
  Omit<Study, 'id' | 'createdAt' | 'updatedAt' | 'registryId' | 'escrowId'>
>;
