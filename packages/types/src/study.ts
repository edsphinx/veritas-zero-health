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
 * Study status enum - matches Prisma schema
 */
export enum StudyStatus {
  Created = 'Created',
  Funding = 'Funding',
  Active = 'Active',
  Paused = 'Paused',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

/**
 * Milestone type enum - matches smart contract
 */
export enum MilestoneType {
  Initial = 0,
  Intermediate = 1,
  FollowUp = 2,
  Completion = 3,
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
 * Study milestone for payment tracking
 */
export interface StudyMilestone {
  id: string;
  milestoneId: number;
  milestoneType: MilestoneType;
  description: string;
  rewardAmount: string; // BigInt as string (USDC with 6 decimals)
  transactionHash: string;
  blockNumber: string; // BigInt as string
  createdAt: Date | string; // Allow both for serialization
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

// ============================================================================
// Core Study Entity
// ============================================================================

/**
 * Complete study entity from indexed database
 *
 * IMPORTANT: This is the canonical Study type for the entire application.
 * Use this type in:
 * - API responses
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
 */
export interface Study {
  // Database identifiers
  id: string; // UUID from Prisma
  registryId: number; // Study ID from StudyRegistry contract
  escrowId: number; // Study ID from ResearchFundingEscrow contract (canonical)

  // Basic information
  title: string;
  description: string;
  researcherAddress: string;
  status: StudyStatus;

  // Funding & Participants
  totalFunding?: string; // Total funding required (sum of milestone rewards) in USDC display format
  maxParticipants?: number; // Maximum number of participants allowed

  // Blockchain tracking
  chainId: number;
  escrowTxHash: string;
  registryTxHash: string;
  criteriaTxHash: string;
  escrowBlockNumber: string; // BigInt as string
  registryBlockNumber: string; // BigInt as string

  // Timestamps (allow both Date and string for serialization)
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations (optional - loaded with include)
  criteria?: StudyCriteria | null;
  milestones?: StudyMilestone[];
  applications?: StudyApplication[];
}

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
