/**
 * Study Types - Shared between Next.js, Browser Extension, and future Mobile App
 *
 * Centralized type definitions for clinical studies to prevent inconsistencies
 * like id vs studyId, escrowId vs registryId, etc.
 *
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for study types.
 * All packages should import from @veritas/types/study
 */

// ============================================================================
// Core Study Types
// ============================================================================

/**
 * Study status enum - MUST match Prisma schema exactly
 * Using lowercase for consistency with database and JSON serialization
 */
export enum StudyStatus {
  Created = 'created',
  Funding = 'funding',
  Recruiting = 'recruiting',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/**
 * Milestone type enum - MUST match smart contract IStudyTypes.sol
 * Using lowercase for consistency (enum keys are PascalCase, values are lowercase)
 */
export enum MilestoneType {
  Enrollment = 'enrollment',           // 0 - Initial enrollment
  DataSubmission = 'data_submission',  // 1 - Data submission milestone
  FollowUpVisit = 'followup_visit',    // 2 - Follow-up visit
  StudyCompletion = 'study_completion', // 3 - Final completion
  Custom = 'custom',                   // 4 - Custom milestone
}

/**
 * Milestone status enum - tracks milestone workflow state
 * MUST match smart contract IStudyTypes.sol
 */
export enum MilestoneStatus {
  Pending = 'pending',         // 0 - Not yet started
  InProgress = 'in_progress',  // 1 - Currently active
  Completed = 'completed',     // 2 - Completed by participant
  Verified = 'verified',       // 3 - Verified by provider/researcher
  Paid = 'paid',              // 4 - Payment released
}

/**
 * Application status enum
 */
export enum ApplicationStatus {
  Pending = 'pending',
  Verified = 'verified',
  Approved = 'approved',
  Rejected = 'rejected',
  Enrolled = 'enrolled',
}

// ============================================================================
// Medical Criteria Types
// ============================================================================

/**
 * Medical eligibility criteria for a study
 * Used for ZK proof generation and human-readable display
 */
export interface StudyCriteria {
  // Age requirements
  minAge: number;
  maxAge: number;

  // Biomarkers
  hba1cMin?: number | null;
  hba1cMax?: number | null;
  ldlMin?: number | null;
  ldlMax?: number | null;
  cholesterolMin?: number | null;
  cholesterolMax?: number | null;
  hdlMin?: number | null;
  hdlMax?: number | null;
  triglyceridesMin?: number | null;
  triglyceridesMax?: number | null;

  // Vital Signs
  systolicBPMin?: number | null;
  systolicBPMax?: number | null;
  diastolicBPMin?: number | null;
  diastolicBPMax?: number | null;
  bmiMin?: number | null;
  bmiMax?: number | null;
  heartRateMin?: number | null;
  heartRateMax?: number | null;

  // Medications & Allergies
  requiredMedications?: string[];
  excludedMedications?: string[];
  excludedAllergies?: string[];

  // Diagnoses (ICD-10 codes)
  requiredDiagnoses?: string[];
  excludedDiagnoses?: string[];

  // ZK proof hash
  eligibilityCodeHash?: string;
}

/**
 * Study milestone for payment tracking (API/Frontend type)
 */
export interface StudyMilestone {
  id: string;
  studyId: string;
  escrowId: number;
  milestoneId: number;
  milestoneType: MilestoneType;
  description: string;
  rewardAmount: string; // Decimal as string (USDC display format, e.g., "100.00")
  status: MilestoneStatus;
  verificationDataHash?: string | null; // bytes32 as hex string

  // Blockchain tracking
  chainId: number;
  transactionHash: string;
  blockNumber: string; // BigInt as string

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string | null;
  verifiedAt?: Date | string | null;
}

/**
 * Study milestone (Database type)
 * Uses native DB types for Prisma operations
 */
export interface StudyMilestoneDB {
  id: string;
  studyId: string;
  escrowId: number;
  milestoneId: number;
  milestoneType: MilestoneType;
  description: string;
  rewardAmount: string | number; // Decimal from Prisma
  status: MilestoneStatus;
  verificationDataHash: string | null;

  // Blockchain tracking
  chainId: number;
  transactionHash: string;
  blockNumber: bigint;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  verifiedAt: Date | null;
}

/**
 * Study application with ZK proof verification status
 */
export interface StudyApplication {
  id: string;
  registryId: number;
  applicantNumber: number;
  proofVerified: boolean;
  proofTransactionHash?: string | null;
  proofBlockNumber?: string | null; // BigInt as string
  status: ApplicationStatus;
  approvedBy?: string | null;
  approvedAt?: Date | string | null; // Allow both for serialization
  enrolled: boolean;
  enrollmentTokenId?: number | null;
  patientAddress?: string | null;
  patientSBTTokenId?: number | null;
  appliedAt: Date | string; // Allow both for serialization
}

/**
 * Sponsor deposit record
 */
export interface SponsorDeposit {
  id: string;
  sponsorAddress: string;
  studyId: string;
  escrowId: number;
  amount: string; // BigInt as string (USDC with 6 decimals)
  chainId: number;
  transactionHash: string;
  blockNumber: string; // BigInt as string
  depositedAt: Date | string; // Allow both for serialization
  createdAt: Date | string; // Allow both for serialization
}

// ============================================================================
// Core Study Entity
// ============================================================================

/**
 * Study type for database operations (Prisma)
 *
 * Uses native database types:
 * - BigInt for blockchain block numbers
 * - Decimal for precise financial calculations
 *
 * This type is used ONLY in:
 * - Repository implementations
 * - Database queries/mutations
 * - Prisma operations
 *
 * DO NOT use in API responses, React components, or serialization contexts.
 * Use `Study` type instead for those cases.
 */
export interface StudyDB {
  // Database identifiers
  id: string; // UUID from Prisma
  registryId: number | null; // Study ID from StudyRegistry contract (null until registry TX completes)
  escrowId: number | null; // Study ID from ResearchFundingEscrow contract (null until escrow TX completes)

  // Basic information
  title: string;
  description: string;
  researcherAddress: string;
  status: StudyStatus;

  // Funding & Participants (native DB types)
  totalFunding: string | number; // Decimal in DB, but Prisma returns as string
  remainingFunding: string | number; // Decimal - funds not yet paid out
  sponsor: string; // Primary sponsor address
  certifiedProviders: string[]; // Array of certified provider addresses
  participantCount: number; // Current enrolled participants
  maxParticipants: number; // Maximum participants allowed

  // Blockchain tracking
  chainId: number;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: bigint; // Native BigInt from DB
  registryBlockNumber: bigint; // Native BigInt from DB

  // Wizard completion tracking
  wizardCompleted: boolean; // All wizard steps completed
  wizardStepsCompleted: string[]; // Array of completed step names: ["escrow", "registry", "criteria", "milestones"]
  wizardCompletedAt: Date | null; // When all wizard steps finished

  // Milestones transaction tracking
  milestonesTxHash: string | null; // Transaction hash for batch milestone creation
  milestonesBlockNumber: bigint | null; // Block number for milestones transaction
  milestonesIndexedAt: Date | null; // When milestones were indexed to DB

  // Timestamps (native Date from DB)
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null; // When study actually started recruiting
  completedAt: Date | null; // When study completed
  deletedAt: Date | null;
}

/**
 * Study type for API/Frontend (JSON-serializable)
 *
 * IMPORTANT: This is the canonical Study type for the application layer.
 * Use this type in:
 * - API responses (Next.js routes)
 * - React components
 * - Hooks
 * - Services
 * - Browser extension
 * - Mobile app (future)
 *
 * Field naming conventions:
 * - `id`: Database UUID (primary key in Prisma)
 * - `registryId`: Study ID from StudyRegistry contract (uint256)
 * - `escrowId`: Study ID from ResearchFundingEscrow contract (uint256)
 * - All blockchain data uses `escrowId` as the canonical study identifier
 *
 * NEVER use `studyId` - it's ambiguous. Always use one of:
 * - `id` for database operations
 * - `registryId` for StudyRegistry contract calls
 * - `escrowId` for ResearchFundingEscrow contract calls
 *
 * Type Conversions:
 * - BigInt → string (for JSON serialization)
 * - Decimal → string (human-readable USDC amounts)
 * - Date → string | Date (flexible for serialization)
 */
export interface Study {
  // Database identifiers
  id: string; // UUID from Prisma
  registryId: number | null; // Study ID from StudyRegistry contract (null until registry TX completes)
  escrowId: number | null; // Study ID from ResearchFundingEscrow contract (null until escrow TX completes)

  // Basic information
  title: string;
  description: string;
  researcherAddress: string;
  status: StudyStatus;

  // Funding & Participants (serialized as strings)
  totalFunding: string; // Decimal as string (e.g., "1000.50" USDC)
  remainingFunding: string; // Decimal as string - funds not yet paid out
  sponsor: string; // Primary sponsor address
  certifiedProviders: string[]; // Array of certified provider addresses
  participantCount: number; // Current enrolled participants
  maxParticipants: number; // Maximum participants allowed

  // Blockchain tracking (BigInt as strings for JSON)
  chainId: number;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: string; // BigInt as string
  registryBlockNumber: string; // BigInt as string

  // Wizard completion tracking
  wizardCompleted: boolean; // All wizard steps completed
  wizardStepsCompleted: string[]; // Array of completed step names: ["escrow", "registry", "criteria", "milestones"]
  wizardCompletedAt?: Date | string | null; // When all wizard steps finished

  // Milestones transaction tracking
  milestonesTxHash?: string | null; // Transaction hash for batch milestone creation
  milestonesBlockNumber?: string | null; // Block number for milestones transaction (BigInt as string)
  milestonesIndexedAt?: Date | string | null; // When milestones were indexed to DB

  // Timestamps (allow both Date and string for serialization)
  createdAt: Date | string;
  updatedAt: Date | string;
  startedAt?: Date | string | null; // When study actually started recruiting
  completedAt?: Date | string | null; // When study completed

  // Relations (optional - loaded with include)
  criteria?: StudyCriteria | null;
  milestones?: StudyMilestone[];
  applications?: StudyApplication[];
  deposits?: SponsorDeposit[];
}

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Convert database Study (StudyDB) to API Study
 *
 * Use this at the boundary between repository and use case/API layer:
 * - After fetching from database
 * - Before returning from API routes
 * - Before sending to React components
 *
 * Conversions:
 * - BigInt → string (JSON-safe)
 * - Decimal → string (human-readable)
 * - Date → Date (kept as-is, Next.js will serialize)
 */
export function toAPIStudy(dbStudy: StudyDB): Study {
  return {
    id: dbStudy.id,
    registryId: dbStudy.registryId,
    escrowId: dbStudy.escrowId,
    title: dbStudy.title,
    description: dbStudy.description,
    researcherAddress: dbStudy.researcherAddress,
    status: dbStudy.status,
    totalFunding: dbStudy.totalFunding?.toString() || '0',
    remainingFunding: dbStudy.remainingFunding?.toString() || '0',
    sponsor: dbStudy.sponsor,
    certifiedProviders: dbStudy.certifiedProviders,
    participantCount: dbStudy.participantCount,
    maxParticipants: dbStudy.maxParticipants,
    chainId: dbStudy.chainId,
    escrowTxHash: dbStudy.escrowTxHash,
    registryTxHash: dbStudy.registryTxHash,
    criteriaTxHash: dbStudy.criteriaTxHash,
    escrowBlockNumber: dbStudy.escrowBlockNumber.toString(),
    registryBlockNumber: dbStudy.registryBlockNumber.toString(),
    wizardCompleted: dbStudy.wizardCompleted,
    wizardStepsCompleted: dbStudy.wizardStepsCompleted,
    wizardCompletedAt: dbStudy.wizardCompletedAt || undefined,
    milestonesTxHash: dbStudy.milestonesTxHash || undefined,
    milestonesBlockNumber: dbStudy.milestonesBlockNumber?.toString() || undefined,
    milestonesIndexedAt: dbStudy.milestonesIndexedAt || undefined,
    createdAt: dbStudy.createdAt,
    updatedAt: dbStudy.updatedAt,
    startedAt: dbStudy.startedAt || undefined,
    completedAt: dbStudy.completedAt || undefined,
  };
}

/**
 * Convert API Study to database input for calculations
 *
 * Use this when you need to perform calculations with Study data:
 * - Converting string amounts back to numbers
 * - Converting string block numbers back to BigInt
 *
 * Note: This doesn't return StudyDB because you typically don't convert
 * back to DB format. Instead, use specific helpers for each field.
 */
export const studyHelpers = {
  /**
   * Convert totalFunding string to number for calculations
   * Example: "1000.50" → 1000.50
   */
  fundingToNumber(funding?: string): number {
    return funding ? parseFloat(funding) : 0;
  },

  /**
   * Convert totalFunding string to BigInt (wei/smallest unit)
   * Example: "1000.50" USDC → 1000500000n (6 decimals)
   */
  fundingToBigInt(funding?: string, decimals = 6): bigint {
    if (!funding) return 0n;
    const num = parseFloat(funding);
    return BigInt(Math.floor(num * Math.pow(10, decimals)));
  },

  /**
   * Convert block number string to BigInt
   * Example: "12345678" → 12345678n
   */
  blockNumberToBigInt(blockNumber: string): bigint {
    return BigInt(blockNumber);
  },

  /**
   * Format funding amount for display
   * Example: "1000.50" → "$1,000.50 USDC"
   */
  formatFunding(funding?: string): string {
    if (!funding) return '$0.00 USDC';
    const num = parseFloat(funding);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
  },
};

// ============================================================================
// Blockchain Contract Types (from smart contracts)
// ============================================================================

/**
 * Study details as returned by StudyRegistry.getStudyDetails()
 */
export interface StudyDetailsFromContract {
  studyId: bigint;
  researcher: string;
  status: number; // 0=Recruiting, 1=Closed, 2=Completed
  region: string;
  compensationDetails: string;
  criteriaURI: string;
}

/**
 * Eligibility criteria as returned by StudyRegistry.getStudyCriteria()
 */
export interface StudyCriteriaFromContract {
  minAge: number;
  maxAge: number;
  eligibilityCodeHash: bigint;
  requiresProof: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for POST /api/studies/index
 */
export interface IndexStudyRequest {
  registryId: number;
  escrowId: number;
  title: string;
  description: string;
  researcherAddress: string;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: string;
  registryBlockNumber: string;
  chainId?: number;
}

/**
 * Response from POST /api/studies/index
 */
export interface IndexStudyResponse {
  success: boolean;
  data?: {
    id: string; // Database UUID (PRIMARY - use this!)
    registryId: number;
    escrowId: number;
    message: string;
  };
  error?: string;
}

/**
 * Request body for POST /api/studies/[id]/criteria/index
 */
export interface IndexCriteriaRequest {
  escrowId: number;
  minAge: number;
  maxAge: number;
  eligibilityCodeHash: string;
  transactionHash: string;
  blockNumber: string;
  medicalCriteria?: Partial<StudyCriteria> | null;
}

/**
 * Request body for POST /api/studies/[id]/milestones/index
 */
export interface IndexMilestonesRequest {
  escrowId: number;
  milestones: Array<{
    milestoneId: number;
    milestoneType: number;
    description: string;
    rewardAmount: string;
    transactionHash: string;
    blockNumber: string;
  }>;
}

/**
 * Request body for POST /api/studies/[id]/apply
 */
export interface ApplyToStudyRequest {
  registryId: number;
  proof: string; // Hex encoded proof
  publicInputs: string[]; // Array of hex encoded public inputs
  eligibilityCode: number;
}

/**
 * Response from POST /api/studies/[id]/apply
 */
export interface ApplyToStudyResponse {
  success: boolean;
  data?: {
    applicationId: string;
    applicantNumber: number;
    transactionHash: string;
    message: string;
  };
  error?: string;
}

// ============================================================================
// Filter and Sort Types
// ============================================================================

/**
 * Filter options for study queries
 */
export interface StudyFilters {
  status?: StudyStatus | string;
  researcher?: string;
  chainId?: number;
}

/**
 * Sort options for study queries
 */
export interface StudySortOptions {
  field: 'registryId' | 'escrowId' | 'status' | 'createdAt';
  order: 'asc' | 'desc';
}

// ============================================================================
// Component Props Types (for UI frameworks)
// ============================================================================

/**
 * Props for medical criteria display component
 */
export interface MedicalCriteriaDisplayProps {
  criteria: StudyCriteria;
  compact?: boolean;
}

/**
 * Props for study card component
 */
export interface StudyCardProps {
  study: Study;
  applicantCount?: bigint | number;
  showApplyButton?: boolean;
  onApplyClick?: (registryId: number) => void;
  className?: string;
}

/**
 * Props for study list component
 */
export interface StudyListProps {
  statusFilter?: StudyStatus;
  showApplyButton?: boolean;
  onApplyClick?: (registryId: number) => void;
  className?: string;
  maxItems?: number;
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Form data for creating a new study
 */
export interface CreateStudyFormData {
  // Basic info
  title: string;
  description: string;
  region: string;
  compensation: string;

  // Funding
  totalFunding: string;
  paymentPerParticipant: string;
  requiredAppointments: number;

  // Age criteria
  minAge: number;
  maxAge: number;
  requiresAgeProof: boolean;

  // Medical criteria
  eligibilityCodeHash: string;
  requiresEligibilityProof: boolean;

  // Biomarkers
  hba1c: { enabled: boolean; min: string; max: string };
  cholesterol: { enabled: boolean; min: string; max: string };
  ldl: { enabled: boolean; min: string; max: string };
  hdl: { enabled: boolean; min: string; max: string };
  triglycerides: { enabled: boolean; min: string; max: string };

  // Vital signs
  systolicBP: { enabled: boolean; min: string; max: string };
  diastolicBP: { enabled: boolean; min: string; max: string };
  bmi: { enabled: boolean; min: string; max: string };
  heartRate: { enabled: boolean; min: string; max: string };

  // Medications & allergies
  requiredMedications: string[];
  excludedMedications: string[];
  excludedAllergies: string[];

  // Diagnoses
  requiredDiagnoses: string[];
  excludedDiagnoses: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Study with all relations loaded
 */
export type StudyWithRelations = Study & {
  criteria: StudyCriteria;
  milestones: StudyMilestone[];
  applications: StudyApplication[];
  deposits: SponsorDeposit[];
};

/**
 * Partial study for list views (minimal fields)
 */
export type StudyListItem = Pick<
  Study,
  'id' | 'escrowId' | 'registryId' | 'title' | 'description' | 'status' | 'createdAt'
> & {
  criteria?: Pick<StudyCriteria, 'minAge' | 'maxAge'> | null;
};

/**
 * Study ID types - use these for type-safe ID handling
 */
export interface StudyIds {
  /** Database UUID - use for API routes and database queries */
  id: string;
  /** StudyRegistry contract ID - use for registry contract calls */
  registryId: number;
  /** ResearchFundingEscrow contract ID - use for escrow contract calls */
  escrowId: number;
}

// ============================================================================
// Participation Types (from ResearchFundingEscrow.sol)
// ============================================================================

/**
 * Study participation record (API/Frontend type)
 * Tracks participant enrollment and progress in a study
 */
export interface Participation {
  id: string;
  studyId: string;
  escrowId: number;
  participant: string; // DASHI Smart Account address
  enrolledAt: Date | string;
  completedMilestones: number[]; // Array of milestone IDs
  totalEarned: string; // BigInt as string (wei/smallest unit)
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Participation record (Database type)
 */
export interface ParticipationDB {
  id: string;
  studyId: string;
  escrowId: number;
  participant: string;
  enrolledAt: Date;
  completedMilestones: number[];
  totalEarned: bigint; // Native BigInt
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert ParticipationDB to Participation (API type)
 */
export function toAPIParticipation(dbParticipation: ParticipationDB): Participation {
  return {
    id: dbParticipation.id,
    studyId: dbParticipation.studyId,
    escrowId: dbParticipation.escrowId,
    participant: dbParticipation.participant,
    enrolledAt: dbParticipation.enrolledAt,
    completedMilestones: dbParticipation.completedMilestones,
    totalEarned: dbParticipation.totalEarned.toString(),
    active: dbParticipation.active,
    createdAt: dbParticipation.createdAt,
    updatedAt: dbParticipation.updatedAt,
  };
}

// ============================================================================
// Payment Types (from ResearchFundingEscrow.sol)
// ============================================================================

/**
 * Payment record (API/Frontend type)
 * Tracks milestone payments to participants
 */
export interface Payment {
  id: string;
  paymentId: number; // ID from contract
  studyId: string;
  escrowId: number;
  milestoneId: string;
  participant: string;
  amount: string; // BigInt as string
  token: string; // Token address (0x0 for ETH, USDC address for USDC)
  paidAt: Date | string;
  transactionHash: string;
  blockNumber: string; // BigInt as string
  chainId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Payment record (Database type)
 */
export interface PaymentDB {
  id: string;
  paymentId: number;
  studyId: string;
  escrowId: number;
  milestoneId: string;
  participant: string;
  amount: bigint; // Native BigInt
  token: string;
  paidAt: Date;
  transactionHash: string;
  blockNumber: bigint; // Native BigInt
  chainId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert PaymentDB to Payment (API type)
 */
export function toAPIPayment(dbPayment: PaymentDB): Payment {
  return {
    id: dbPayment.id,
    paymentId: dbPayment.paymentId,
    studyId: dbPayment.studyId,
    escrowId: dbPayment.escrowId,
    milestoneId: dbPayment.milestoneId,
    participant: dbPayment.participant,
    amount: dbPayment.amount.toString(),
    token: dbPayment.token,
    paidAt: dbPayment.paidAt,
    transactionHash: dbPayment.transactionHash,
    blockNumber: dbPayment.blockNumber.toString(),
    chainId: dbPayment.chainId,
    createdAt: dbPayment.createdAt,
    updatedAt: dbPayment.updatedAt,
  };
}
