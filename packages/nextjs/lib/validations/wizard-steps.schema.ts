/**
 * Wizard Step Validation Schemas
 *
 * Step-specific schemas for the create study wizard with TX execution between steps
 * Each step validates only the data needed for that specific blockchain transaction
 */

import { z } from 'zod';

// ============================================
// Step 1: Escrow Configuration
// ============================================

/**
 * Step 1: Data needed to create escrow contract
 * - Study basics (title, description, region)
 * - Provider & compensation splits
 * - Funding parameters
 */
export const escrowStepSchema = z.object({
  // Basic Info
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  region: z.string().min(2, 'Region must be specified'),

  // Provider & Compensation
  // NOTE: Clinic addresses are NOT pre-assigned in decentralized model
  // Clinics will apply to studies based on eligibility criteria
  // Future: Add maxClinics field to limit how many can verify (requires smart contract update)
  patientPercentage: z
    .number()
    .int()
    .min(0, 'Patient percentage must be at least 0')
    .max(10000, 'Patient percentage cannot exceed 100%'),
  clinicPercentage: z
    .number()
    .int()
    .min(0, 'Clinic percentage must be at least 0')
    .max(10000, 'Clinic percentage cannot exceed 100%'),

  // Funding
  totalFunding: z
    .number()
    .positive('Total funding must be positive')
    .max(10000000, 'Maximum funding is 10M USDC'),
  maxParticipants: z
    .number()
    .int()
    .positive('Must allow at least 1 participant')
    .max(10000, 'Maximum 10,000 participants'),
  paymentPerParticipant: z
    .number()
    .positive('Payment per participant must be positive')
    .max(1000000, 'Maximum payment is 1M USDC per participant'),
})
  .refine(
    (data) => data.patientPercentage + data.clinicPercentage === 10000,
    {
      message: 'Patient and clinic percentages must sum to 100%',
      path: ['clinicPercentage'],
    }
  )
  .refine(
    (data) => data.paymentPerParticipant * data.maxParticipants <= data.totalFunding,
    {
      message: 'Total funding must cover all participants',
      path: ['totalFunding'],
    }
  );

// ============================================
// Step 2: Registry Publication
// ============================================

/**
 * Step 2: Data needed to publish study to registry
 * - Public-facing information
 * - Metadata URI
 */
export const registryStepSchema = z.object({
  // Inherited from Step 1 (read-only)
  escrowId: z.bigint(),

  // Additional registry fields
  compensationDescription: z
    .string()
    .min(10, 'Compensation description required')
    .max(500, 'Compensation description too long'),
  criteriaURI: z.string().url('Must be a valid URI').optional(),
});

// ============================================
// Step 3: Eligibility Criteria
// ============================================

/**
 * Step 3: Data needed to set study criteria
 * - Age requirements (off-chain ZK verification)
 * - Medical eligibility toggle
 */
export const criteriaStepSchema = z.object({
  // Inherited from Steps 1-2 (read-only)
  escrowId: z.bigint(),
  registryId: z.bigint(),

  // Age Criteria (off-chain ZK proof)
  minAge: z
    .number()
    .int()
    .min(0, 'Minimum age must be 0 or greater')
    .max(120, 'Minimum age must be less than 120'),
  maxAge: z
    .number()
    .int()
    .min(0, 'Maximum age must be 0 or greater')
    .max(120, 'Maximum age must be less than 120'),

  // Medical Eligibility (on-chain ZK proof)
  requiresEligibilityProof: z.boolean(),
  eligibilityCodeHash: z.string(), // '0' if disabled, actual hash if enabled
}).refine(
  (data) => data.minAge <= data.maxAge,
  {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['maxAge'],
  }
);

// ============================================
// Step 4: Milestones Setup
// ============================================

/**
 * Milestone Type Enum (matches smart contract)
 */
export const milestoneTypeEnum = z.enum([
  'Enrollment',
  'DataSubmission',
  'FollowUpVisit',
  'StudyCompletion',
  'Custom',
]);

export type MilestoneType = z.infer<typeof milestoneTypeEnum>;

/**
 * Single milestone input
 */
export const milestoneInputSchema = z.object({
  type: milestoneTypeEnum,
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(200, 'Description too long'),
  rewardAmount: z
    .number()
    .positive('Reward amount must be positive')
    .max(1000000, 'Maximum reward is 1M USDC'),
});

/**
 * Step 4: Milestones configuration
 */
export const milestonesStepSchema = z.object({
  // Inherited from Steps 1-3 (read-only)
  escrowId: z.bigint(),
  registryId: z.bigint(),
  totalFunding: z.number().positive(), // For validation

  // Milestones array
  milestones: z
    .array(milestoneInputSchema)
    .min(1, 'At least one milestone required')
    .max(20, 'Maximum 20 milestones per batch'),
})
  .refine(
    (data) => {
      const totalRewards = data.milestones.reduce(
        (sum, m) => sum + m.rewardAmount,
        0
      );
      return totalRewards <= data.totalFunding;
    },
    {
      message: 'Total milestone rewards cannot exceed total funding',
      path: ['milestones'],
    }
  );

// ============================================
// TypeScript Types
// ============================================

export type EscrowStepFormData = z.infer<typeof escrowStepSchema>;
export type RegistryStepFormData = z.infer<typeof registryStepSchema>;
export type CriteriaStepFormData = z.infer<typeof criteriaStepSchema>;
export type MilestoneInputFormData = z.infer<typeof milestoneInputSchema>;
export type MilestonesStepFormData = z.infer<typeof milestonesStepSchema>;

// Combined type for complete study creation
export type StudyCreationData = {
  step1: EscrowStepFormData;
  step2: Omit<RegistryStepFormData, 'escrowId'>; // escrowId comes from TX
  step3: Omit<CriteriaStepFormData, 'escrowId' | 'registryId'>; // IDs come from TXs
  step4: Omit<MilestonesStepFormData, 'escrowId' | 'registryId' | 'totalFunding'>; // IDs come from TXs, funding from step1
};
