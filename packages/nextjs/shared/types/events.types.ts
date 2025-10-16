/**
 * Cross-System Event Types
 *
 * Type definitions for events that occur across the Veritas Zero Health system,
 * including blockchain events, Nillion storage events, and application events.
 */

import type { Address } from 'viem';
import type { HealthRecordType } from '@veritas/types/health';
import type { EnrollmentStatus } from './enrollment.types';

// ==================== EVENT CATEGORIES ====================

/**
 * Event category for filtering and routing
 */
export type EventCategory =
  | 'blockchain' // On-chain contract events
  | 'nillion' // Nillion storage events
  | 'zk-proof' // ZK proof generation/verification events
  | 'enrollment' // Study enrollment events
  | 'health-data' // Health data events
  | 'identity' // Identity/DID events
  | 'permission' // Permission/access control events
  | 'system'; // System-level events

/**
 * Event severity level
 */
export type EventSeverity = 'info' | 'warning' | 'error' | 'critical';

// ==================== BASE EVENT STRUCTURE ====================

/**
 * Base event interface
 * All system events extend this
 */
export interface BaseEvent {
  /** Unique event ID */
  id: string;

  /** Event category */
  category: EventCategory;

  /** Event type (specific to category) */
  type: string;

  /** Event severity */
  severity: EventSeverity;

  /** Event timestamp */
  timestamp: number;

  /** Event source (which component generated it) */
  source: string;

  /** Event payload (category-specific data) */
  payload: Record<string, any>;

  /** Related user address (if applicable) */
  userAddress?: Address;

  /** Related transaction hash (if applicable) */
  txHash?: `0x${string}`;

  /** Event metadata */
  metadata?: Record<string, any>;
}

// ==================== BLOCKCHAIN EVENTS ====================

/**
 * Blockchain event types
 */
export type BlockchainEventType =
  | 'study-published'
  | 'study-criteria-set'
  | 'anonymous-application'
  | 'health-identity-created'
  | 'health-identity-attested'
  | 'participation-sbt-minted'
  | 'compensation-paid';

/**
 * Blockchain event
 */
export interface BlockchainEvent extends BaseEvent {
  category: 'blockchain';
  type: BlockchainEventType;

  /** Block number where event occurred */
  blockNumber: bigint;

  /** Transaction hash */
  txHash: `0x${string}`;

  /** Contract address that emitted event */
  contractAddress: Address;

  /** Chain ID */
  chainId: number;
}

/**
 * Study published event
 */
export interface StudyPublishedEvent extends BlockchainEvent {
  type: 'study-published';
  payload: {
    studyId: bigint;
    researcher: Address;
    region: string;
  };
}

/**
 * Anonymous application event
 */
export interface AnonymousApplicationEvent extends BlockchainEvent {
  type: 'anonymous-application';
  payload: {
    studyId: bigint;
    applicantCount: number;
    proofVerified: boolean;
  };
}

/**
 * Health Identity created event
 */
export interface HealthIdentityCreatedEvent extends BlockchainEvent {
  type: 'health-identity-created';
  payload: {
    owner: Address;
    nillionDID: string;
    humanPassportId: bigint;
  };
}

// ==================== NILLION EVENTS ====================

/**
 * Nillion event types
 */
export type NillionEventType =
  | 'record-stored'
  | 'record-retrieved'
  | 'record-deleted'
  | 'permission-granted'
  | 'permission-revoked'
  | 'did-created'
  | 'collection-created';

/**
 * Nillion storage event
 */
export interface NillionEvent extends BaseEvent {
  category: 'nillion';
  type: NillionEventType;

  /** User's Nillion DID */
  nillionDID: string;
}

/**
 * Record stored event
 */
export interface RecordStoredEvent extends NillionEvent {
  type: 'record-stored';
  payload: {
    recordId: string;
    storeId: string;
    dataType: HealthRecordType;
    dataSize: number;
  };
}

/**
 * Permission granted event
 */
export interface PermissionGrantedEvent extends NillionEvent {
  type: 'permission-granted';
  payload: {
    granteeAddress: Address;
    permissions: string[];
    expiresAt?: number;
  };
}

// ==================== ZK PROOF EVENTS ====================

/**
 * ZK proof event types
 */
export type ZKProofEventType =
  | 'proof-requested'
  | 'proof-generating'
  | 'proof-generated'
  | 'proof-verified'
  | 'proof-failed'
  | 'keys-loaded'
  | 'wasm-initialized';

/**
 * ZK proof event
 */
export interface ZKProofEvent extends BaseEvent {
  category: 'zk-proof';
  type: ZKProofEventType;

  /** Circuit name */
  circuit: string;

  /** Proof system used */
  proofSystem: 'groth16' | 'halo2-plonk';
}

/**
 * Proof generated event
 */
export interface ProofGeneratedEvent extends ZKProofEvent {
  type: 'proof-generated';
  payload: {
    circuit: string;
    studyId: bigint;
    generationTimeMs: number;
    proofSize: number;
  };
}

/**
 * Proof verified event
 */
export interface ProofVerifiedEvent extends ZKProofEvent {
  type: 'proof-verified';
  payload: {
    circuit: string;
    valid: boolean;
    verificationTimeMs: number;
    onChain: boolean;
  };
}

// ==================== ENROLLMENT EVENTS ====================

/**
 * Enrollment event types
 */
export type EnrollmentEventType =
  | 'application-submitted'
  | 'patient-contacted'
  | 'appointment-scheduled'
  | 'appointment-confirmed'
  | 'appointment-cancelled'
  | 'enrollment-confirmed'
  | 'milestone-completed'
  | 'adverse-event-reported'
  | 'study-completed'
  | 'participant-withdrawn';

/**
 * Enrollment event
 */
export interface EnrollmentEvent extends BaseEvent {
  category: 'enrollment';
  type: EnrollmentEventType;

  /** Study ID */
  studyId: bigint;

  /** Enrollment ID */
  enrollmentId?: string;
}

/**
 * Application submitted event
 */
export interface ApplicationSubmittedEvent extends EnrollmentEvent {
  type: 'application-submitted';
  payload: {
    studyId: bigint;
    patientAddress: Address;
    proofTxHash: `0x${string}`;
  };
}

/**
 * Appointment scheduled event
 */
export interface AppointmentScheduledEvent extends EnrollmentEvent {
  type: 'appointment-scheduled';
  payload: {
    appointmentId: string;
    appointmentType: string;
    scheduledAt: string;
    clinicAddress: Address;
  };
}

/**
 * Milestone completed event
 */
export interface MilestoneCompletedEvent extends EnrollmentEvent {
  type: 'milestone-completed';
  payload: {
    milestoneId: string;
    milestoneName: string;
    completedAt: number;
    verifiedBy: Address;
  };
}

// ==================== HEALTH DATA EVENTS ====================

/**
 * Health data event types
 */
export type HealthDataEventType =
  | 'data-uploaded'
  | 'data-updated'
  | 'data-deleted'
  | 'data-shared'
  | 'data-accessed'
  | 'attestation-created'
  | 'attestation-revoked';

/**
 * Health data event
 */
export interface HealthDataEvent extends BaseEvent {
  category: 'health-data';
  type: HealthDataEventType;

  /** Data type */
  dataType: HealthRecordType;
}

/**
 * Data uploaded event
 */
export interface DataUploadedEvent extends HealthDataEvent {
  type: 'data-uploaded';
  payload: {
    recordId: string;
    dataType: HealthRecordType;
    storedInNillion: boolean;
    attestationHash?: `0x${string}`;
  };
}

/**
 * Data shared event
 */
export interface DataSharedEvent extends HealthDataEvent {
  type: 'data-shared';
  payload: {
    sharedWith: Address;
    permissions: string[];
    expiresAt?: number;
  };
}

// ==================== IDENTITY EVENTS ====================

/**
 * Identity event types
 */
export type IdentityEventType =
  | 'did-created'
  | 'identity-verified'
  | 'identity-updated'
  | 'passport-verified'
  | 'identity-mapping-created';

/**
 * Identity event
 */
export interface IdentityEvent extends BaseEvent {
  category: 'identity';
  type: IdentityEventType;
}

/**
 * DID created event
 */
export interface DIDCreatedEvent extends IdentityEvent {
  type: 'did-created';
  payload: {
    did: string;
    address: Address;
    provider: 'nillion' | 'other';
  };
}

/**
 * Identity verified event
 */
export interface IdentityVerifiedEvent extends IdentityEvent {
  type: 'identity-verified';
  payload: {
    address: Address;
    verificationMethod: 'gitcoin-passport' | 'worldcoin' | 'other';
    verificationScore?: number;
  };
}

// ==================== PERMISSION EVENTS ====================

/**
 * Permission event types
 */
export type PermissionEventType =
  | 'permission-requested'
  | 'permission-granted'
  | 'permission-denied'
  | 'permission-revoked'
  | 'access-granted'
  | 'access-denied';

/**
 * Permission event
 */
export interface PermissionEvent extends BaseEvent {
  category: 'permission';
  type: PermissionEventType;
}

/**
 * Permission granted event
 */
export interface PermissionGrantedEventData extends PermissionEvent {
  type: 'permission-granted';
  payload: {
    grantor: Address;
    grantee: Address;
    permissions: string[];
    scope?: string;
  };
}

// ==================== SYSTEM EVENTS ====================

/**
 * System event types
 */
export type SystemEventType =
  | 'system-initialized'
  | 'connection-established'
  | 'connection-lost'
  | 'sync-started'
  | 'sync-completed'
  | 'sync-failed'
  | 'error-occurred'
  | 'maintenance-started'
  | 'maintenance-completed';

/**
 * System event
 */
export interface SystemEvent extends BaseEvent {
  category: 'system';
  type: SystemEventType;
}

/**
 * Error occurred event
 */
export interface ErrorOccurredEvent extends SystemEvent {
  type: 'error-occurred';
  severity: 'error' | 'critical';
  payload: {
    error: string;
    stack?: string;
    context?: Record<string, any>;
  };
}

// ==================== EVENT UNION TYPES ====================

/**
 * All possible event types
 */
export type VZHEvent =
  | BlockchainEvent
  | NillionEvent
  | ZKProofEvent
  | EnrollmentEvent
  | HealthDataEvent
  | IdentityEvent
  | PermissionEvent
  | SystemEvent;

/**
 * Specific event types union
 */
export type SpecificEvent =
  | StudyPublishedEvent
  | AnonymousApplicationEvent
  | HealthIdentityCreatedEvent
  | RecordStoredEvent
  | PermissionGrantedEvent
  | ProofGeneratedEvent
  | ProofVerifiedEvent
  | ApplicationSubmittedEvent
  | AppointmentScheduledEvent
  | MilestoneCompletedEvent
  | DataUploadedEvent
  | DataSharedEvent
  | DIDCreatedEvent
  | IdentityVerifiedEvent
  | PermissionGrantedEventData
  | ErrorOccurredEvent;

// ==================== EVENT HANDLERS ====================

/**
 * Event handler function type
 */
export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  /** Subscription ID */
  id: string;

  /** Event category to subscribe to */
  category?: EventCategory;

  /** Specific event type (if filtering by type) */
  type?: string;

  /** Event handler function */
  handler: EventHandler;

  /** Subscription active status */
  active: boolean;

  /** Subscription created timestamp */
  createdAt: number;
}

/**
 * Event filter for querying events
 */
export interface EventFilter {
  /** Filter by category */
  category?: EventCategory | EventCategory[];

  /** Filter by type */
  type?: string | string[];

  /** Filter by severity */
  severity?: EventSeverity | EventSeverity[];

  /** Filter by user address */
  userAddress?: Address;

  /** Filter by transaction hash */
  txHash?: `0x${string}`;

  /** Filter by time range */
  timestampFrom?: number;
  timestampTo?: number;

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Sort options */
  sortBy?: 'timestamp' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a base event
 */
export function createEvent<T extends BaseEvent>(
  category: EventCategory,
  type: string,
  payload: Record<string, any>,
  options: Partial<BaseEvent> = {}
): T {
  return {
    id: crypto.randomUUID(),
    category,
    type,
    severity: 'info',
    timestamp: Date.now(),
    source: 'unknown',
    payload,
    ...options,
  } as T;
}

/**
 * Check if event matches filter
 */
export function matchesFilter(event: BaseEvent, filter: EventFilter): boolean {
  // Category filter
  if (filter.category) {
    const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
    if (!categories.includes(event.category)) return false;
  }

  // Type filter
  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    if (!types.includes(event.type)) return false;
  }

  // Severity filter
  if (filter.severity) {
    const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
    if (!severities.includes(event.severity)) return false;
  }

  // User address filter
  if (filter.userAddress && event.userAddress !== filter.userAddress) {
    return false;
  }

  // Transaction hash filter
  if (filter.txHash && event.txHash !== filter.txHash) {
    return false;
  }

  // Time range filter
  if (filter.timestampFrom && event.timestamp < filter.timestampFrom) {
    return false;
  }
  if (filter.timestampTo && event.timestamp > filter.timestampTo) {
    return false;
  }

  return true;
}

/**
 * Type guard for blockchain events
 */
export function isBlockchainEvent(event: BaseEvent): event is BlockchainEvent {
  return event.category === 'blockchain';
}

/**
 * Type guard for Nillion events
 */
export function isNillionEvent(event: BaseEvent): event is NillionEvent {
  return event.category === 'nillion';
}

/**
 * Type guard for ZK proof events
 */
export function isZKProofEvent(event: BaseEvent): event is ZKProofEvent {
  return event.category === 'zk-proof';
}

/**
 * Type guard for enrollment events
 */
export function isEnrollmentEvent(event: BaseEvent): event is EnrollmentEvent {
  return event.category === 'enrollment';
}
