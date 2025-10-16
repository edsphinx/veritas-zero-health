/**
 * Study Enrollment and Participation Types
 *
 * Type definitions for patient enrollment in clinical trials,
 * participation tracking, and compliance monitoring.
 */

import type { Address } from 'viem';

// ==================== ENROLLMENT STATUS ====================

/**
 * Enrollment status lifecycle
 */
export type EnrollmentStatus =
  | 'applied' // Anonymous application submitted with ZK proof
  | 'verified' // Eligibility verified (ZK proof passed)
  | 'contacted' // Patient contacted by clinic
  | 'scheduled' // Appointment scheduled
  | 'enrolled' // Officially enrolled in study
  | 'active' // Actively participating
  | 'completed' // Successfully completed study
  | 'withdrawn' // Participant withdrew
  | 'disqualified' // Disqualified during study
  | 'dropped'; // Dropped due to non-compliance

/**
 * Study recruitment status
 */
export type RecruitmentStatus =
  | 'recruiting' // 0 in contract
  | 'closed' // 1 in contract
  | 'paused' // Study temporarily not recruiting
  | 'completed'; // Study completed

// ==================== ENROLLMENT RECORDS ====================

/**
 * Anonymous application record (on-chain)
 * Only wallet address and proof verification status are stored
 */
export interface AnonymousApplication {
  /** Study ID */
  studyId: bigint;

  /** Applicant's wallet address */
  applicantAddress: Address;

  /** Whether ZK proof was verified on-chain */
  proofVerified: boolean;

  /** Application timestamp */
  appliedAt: number;

  /** Transaction hash */
  txHash: `0x${string}`;

  /** Current status */
  status: EnrollmentStatus;
}

/**
 * Full enrollment record (off-chain + on-chain)
 * Links anonymous application with patient identity
 */
export interface EnrollmentRecord {
  /** Unique enrollment ID */
  id: string;

  /** Study ID */
  studyId: bigint;

  /** Patient's Ethereum address */
  patientAddress: Address;

  /** Patient's Nillion DID */
  patientDID: string;

  /** Patient's Health Identity SBT token ID (if applicable) */
  healthIdentityTokenId?: bigint;

  /** Enrollment status */
  status: EnrollmentStatus;

  /** Application details */
  application: {
    /** When application was submitted */
    appliedAt: number;

    /** ZK proof verification result */
    proofVerified: boolean;

    /** Proof transaction hash */
    proofTxHash: `0x${string}`;
  };

  /** Clinic contact information (if contacted) */
  clinicContact?: {
    /** Clinic's Ethereum address */
    clinicAddress: Address;

    /** Contact timestamp */
    contactedAt: number;

    /** Contact method */
    method: 'email' | 'phone' | 'portal';

    /** Contact notes */
    notes?: string;
  };

  /** Scheduled appointment (if scheduled) */
  appointment?: AppointmentRecord;

  /** Enrollment confirmation (if enrolled) */
  enrollment?: {
    /** Enrollment confirmation timestamp */
    enrolledAt: number;

    /** Enrollment confirmation transaction hash */
    txHash: `0x${string}`;

    /** Participant ID (study-specific) */
    participantId: string;

    /** Consent form hash */
    consentHash?: `0x${string}`;
  };

  /** Participation tracking */
  participation?: ParticipationTracking;

  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

/**
 * Appointment scheduling record
 */
export interface AppointmentRecord {
  /** Appointment ID */
  id: string;

  /** Study ID */
  studyId: bigint;

  /** Patient address */
  patientAddress: Address;

  /** Clinic address */
  clinicAddress: Address;

  /** Appointment type */
  type: 'screening' | 'baseline' | 'followup' | 'final';

  /** Scheduled date/time (ISO 8601) */
  scheduledAt: string;

  /** Appointment duration (minutes) */
  duration: number;

  /** Location details */
  location: {
    /** Clinic name */
    name: string;

    /** Street address */
    address: string;

    /** Room/suite number */
    room?: string;

    /** Additional instructions */
    instructions?: string;
  };

  /** Appointment status */
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

  /** Cancellation reason (if cancelled) */
  cancellationReason?: string;

  /** Reminder notifications */
  reminders?: {
    /** Reminder timestamp */
    sentAt: number;

    /** Reminder method */
    method: 'email' | 'sms' | 'push';

    /** Whether reminder was acknowledged */
    acknowledged: boolean;
  }[];

  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

// ==================== PARTICIPATION TRACKING ====================

/**
 * Participation tracking and compliance monitoring
 */
export interface ParticipationTracking {
  /** Participant's study-specific ID */
  participantId: string;

  /** Study start date */
  startedAt: number;

  /** Expected completion date */
  expectedCompletionAt: number;

  /** Actual completion date (if completed) */
  completedAt?: number;

  /** Milestone tracking */
  milestones: ParticipationMilestone[];

  /** Compliance metrics */
  compliance: {
    /** Percentage of milestones completed on time */
    onTimeRate: number;

    /** Number of missed appointments */
    missedAppointments: number;

    /** Number of protocol violations */
    protocolViolations: number;

    /** Overall compliance score (0-100) */
    score: number;
  };

  /** Data collection tracking */
  dataCollection: {
    /** Last data submission timestamp */
    lastSubmittedAt: number;

    /** Number of data points submitted */
    submissionCount: number;

    /** Expected vs actual submissions */
    expectedSubmissions: number;
    actualSubmissions: number;
  };

  /** Adverse events (if any) */
  adverseEvents: AdverseEvent[];

  /** Study completion status */
  completionStatus?: 'completed' | 'early-termination' | 'withdrawn' | 'lost-to-followup';

  /** Study completion reason (if not completed normally) */
  completionReason?: string;
}

/**
 * Study milestone tracking
 */
export interface ParticipationMilestone {
  /** Milestone ID */
  id: string;

  /** Milestone name */
  name: string;

  /** Milestone description */
  description: string;

  /** Milestone type */
  type: 'visit' | 'data-submission' | 'procedure' | 'assessment';

  /** Due date */
  dueAt: number;

  /** Completion date */
  completedAt?: number;

  /** Status */
  status: 'pending' | 'completed' | 'missed' | 'waived';

  /** Completion verification */
  verification?: {
    /** Verified by (clinic address) */
    verifiedBy: Address;

    /** Verification timestamp */
    verifiedAt: number;

    /** Verification transaction hash */
    txHash?: `0x${string}`;
  };

  /** Notes */
  notes?: string;
}

/**
 * Adverse event tracking
 */
export interface AdverseEvent {
  /** Event ID */
  id: string;

  /** Event timestamp */
  occurredAt: number;

  /** Severity level */
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';

  /** Event description */
  description: string;

  /** Related to study intervention? */
  relatedToStudy: boolean;

  /** Action taken */
  actionTaken?: string;

  /** Resolution status */
  resolved: boolean;

  /** Resolution timestamp */
  resolvedAt?: number;

  /** Reported by */
  reportedBy: Address;

  /** Reporting timestamp */
  reportedAt: number;
}

// ==================== PARTICIPANT SBT ====================

/**
 * Study Participation SBT (Soulbound Token)
 * Non-transferable NFT proving study participation
 */
export interface ParticipationSBT {
  /** Token ID */
  tokenId: bigint;

  /** Owner address */
  owner: Address;

  /** Study ID */
  studyId: bigint;

  /** Participant ID in study */
  participantId: string;

  /** Enrollment timestamp */
  enrolledAt: number;

  /** Study completion status */
  completed: boolean;

  /** Completion timestamp */
  completedAt?: number;

  /** Compliance score */
  complianceScore: number;

  /** Metadata URI */
  metadataURI?: string;

  /** Token minted timestamp */
  mintedAt: number;

  /** Minting transaction hash */
  mintTxHash: `0x${string}`;
}

// ==================== COMPENSATION TRACKING ====================

/**
 * Participant compensation record
 */
export interface CompensationRecord {
  /** Record ID */
  id: string;

  /** Study ID */
  studyId: bigint;

  /** Participant address */
  participantAddress: Address;

  /** Compensation type */
  type: 'milestone' | 'completion' | 'travel' | 'inconvenience';

  /** Amount in wei */
  amountWei: bigint;

  /** Currency token address (0x0 for ETH) */
  tokenAddress: Address;

  /** Reason for compensation */
  reason: string;

  /** Payment status */
  status: 'pending' | 'approved' | 'paid' | 'rejected';

  /** Approval timestamp */
  approvedAt?: number;

  /** Approved by */
  approvedBy?: Address;

  /** Payment timestamp */
  paidAt?: number;

  /** Payment transaction hash */
  paymentTxHash?: `0x${string}`;

  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

// ==================== QUERY TYPES ====================

/**
 * Query parameters for finding enrollments
 */
export interface EnrollmentQuery {
  /** Filter by study ID */
  studyId?: bigint;

  /** Filter by patient address */
  patientAddress?: Address;

  /** Filter by status */
  status?: EnrollmentStatus | EnrollmentStatus[];

  /** Filter by proof verified */
  proofVerified?: boolean;

  /** Filter by date range */
  appliedAfter?: number;
  appliedBefore?: number;

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Sort options */
  sortBy?: 'appliedAt' | 'enrolledAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for finding appointments
 */
export interface AppointmentQuery {
  /** Filter by study ID */
  studyId?: bigint;

  /** Filter by patient address */
  patientAddress?: Address;

  /** Filter by clinic address */
  clinicAddress?: Address;

  /** Filter by type */
  type?: AppointmentRecord['type'];

  /** Filter by status */
  status?: AppointmentRecord['status'];

  /** Filter by scheduled date range */
  scheduledAfter?: string;
  scheduledBefore?: string;

  /** Pagination */
  limit?: number;
  offset?: number;
}

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Request to create enrollment from anonymous application
 */
export interface CreateEnrollmentRequest {
  /** Study ID */
  studyId: bigint;

  /** Patient address */
  patientAddress: Address;

  /** Patient DID */
  patientDID: string;

  /** Application transaction hash */
  applicationTxHash: `0x${string}`;
}

/**
 * Response from creating enrollment
 */
export interface CreateEnrollmentResponse {
  success: boolean;
  enrollment?: EnrollmentRecord;
  error?: string;
}

/**
 * Request to schedule appointment
 */
export interface ScheduleAppointmentRequest {
  enrollmentId: string;
  type: AppointmentRecord['type'];
  scheduledAt: string;
  duration: number;
  location: AppointmentRecord['location'];
}

/**
 * Response from scheduling appointment
 */
export interface ScheduleAppointmentResponse {
  success: boolean;
  appointment?: AppointmentRecord;
  error?: string;
}

/**
 * Request to update enrollment status
 */
export interface UpdateEnrollmentStatusRequest {
  enrollmentId: string;
  newStatus: EnrollmentStatus;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Response from updating enrollment status
 */
export interface UpdateEnrollmentStatusResponse {
  success: boolean;
  enrollment?: EnrollmentRecord;
  error?: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if enrollment is active
 */
export function isEnrollmentActive(enrollment: EnrollmentRecord): boolean {
  return ['enrolled', 'active'].includes(enrollment.status);
}

/**
 * Check if appointment is upcoming
 */
export function isAppointmentUpcoming(appointment: AppointmentRecord): boolean {
  const scheduledDate = new Date(appointment.scheduledAt);
  const now = new Date();
  return scheduledDate > now && appointment.status === 'scheduled';
}

/**
 * Calculate days until appointment
 */
export function daysUntilAppointment(appointment: AppointmentRecord): number {
  const scheduledDate = new Date(appointment.scheduledAt);
  const now = new Date();
  const diff = scheduledDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if participant is compliant
 */
export function isParticipantCompliant(
  tracking: ParticipationTracking,
  threshold: number = 80
): boolean {
  return tracking.compliance.score >= threshold;
}

/**
 * Calculate participation progress percentage
 */
export function calculateParticipationProgress(tracking: ParticipationTracking): number {
  const totalMilestones = tracking.milestones.length;
  if (totalMilestones === 0) return 0;

  const completedMilestones = tracking.milestones.filter(
    (m) => m.status === 'completed'
  ).length;

  return Math.round((completedMilestones / totalMilestones) * 100);
}
