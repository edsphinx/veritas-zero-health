/**
 * Blockchain-Nillion Bridge Types
 *
 * Type definitions for bridging on-chain identity (blockchain) with
 * off-chain encrypted storage (Nillion Network).
 */

import type { Address } from 'viem';
import type { HealthRecordType } from '@veritas/types/health';

// ==================== IDENTITY MAPPING ====================

/**
 * Maps on-chain Ethereum address to off-chain Nillion DID
 * This is the core bridge between blockchain identity and private storage
 */
export interface IdentityMapping {
  /** Ethereum wallet address (on-chain) */
  ethereumAddress: Address;

  /** Nillion DID (off-chain private storage identifier) */
  nillionDID: string;

  /** Human Passport ID (Gitcoin Passport verification) */
  humanPassportId?: bigint;

  /** Timestamp of mapping creation */
  createdAt: number;

  /** Whether this mapping is verified on-chain (via Health Identity SBT) */
  onChainVerified: boolean;
}

/**
 * Request to create identity mapping
 */
export interface CreateIdentityMappingRequest {
  ethereumAddress: Address;
  nillionDID: string;
  signature?: `0x${string}`; // Signature proving ownership of ethereum address
}

/**
 * Response from creating identity mapping
 */
export interface CreateIdentityMappingResponse {
  success: boolean;
  mapping?: IdentityMapping;
  error?: string;
}

// ==================== NILLION STORAGE REFERENCES ====================

/**
 * Reference to encrypted data stored in Nillion
 * Used to link on-chain records with off-chain encrypted storage
 */
export interface NillionStorageReference {
  /** Nillion store ID (collection identifier) */
  storeId: string;

  /** Record ID within the store */
  recordId: string;

  /** Type of health data stored */
  dataType: HealthRecordType;

  /** Owner's Nillion DID */
  ownerDID: string;

  /** Timestamp of storage */
  storedAt: number;

  /** Size of encrypted data (bytes) */
  dataSize?: number;
}

/**
 * On-chain attestation pointing to Nillion storage
 * Stored in Health Identity SBT contract
 */
export interface NillionAttestation {
  /** Attestation hash (stored on-chain) */
  hash: `0x${string}`;

  /** Reference to Nillion storage (off-chain metadata) */
  storageRef: NillionStorageReference;

  /** Ethereum address of attester (medical provider) */
  attesterAddress: Address;

  /** Timestamp of attestation */
  attestedAt: number;

  /** Whether attestation is still valid */
  active: boolean;
}

// ==================== STUDY APPLICATION DATA ====================

/**
 * Study application that bridges blockchain (study registration) with
 * Nillion (encrypted health data) and ZK proofs
 */
export interface CrossSystemStudyApplication {
  /** On-chain study ID */
  studyId: bigint;

  /** Applicant's Ethereum address */
  applicantAddress: Address;

  /** Applicant's Nillion DID */
  applicantDID: string;

  /** Reference to encrypted health data in Nillion */
  healthDataRef: NillionStorageReference[];

  /** ZK proof of eligibility (submitted on-chain) */
  eligibilityProof: `0x${string}`;

  /** Application timestamp */
  appliedAt: number;

  /** Application status */
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';

  /** On-chain transaction hash */
  txHash?: `0x${string}`;
}

/**
 * Study eligibility criteria that references both on-chain and off-chain data
 */
export interface StudyEligibilityCriteria {
  /** Study ID */
  studyId: bigint;

  /** Age range requirements (verified via ZK proof) */
  ageRange?: {
    min: number;
    max: number;
  };

  /** Required biomarker ranges (stored off-chain in Nillion) */
  biomarkers?: {
    name: string;
    unit: string;
    min?: number;
    max?: number;
  }[];

  /** Required diagnosis codes (verified via ZK proof) */
  diagnosisCodes?: string[]; // ICD-10 codes

  /** Exclusion diagnosis codes */
  exclusionCodes?: string[]; // ICD-10 codes

  /** Medication requirements/exclusions */
  medications?: {
    required?: string[];
    excluded?: string[];
  };
}

// ==================== DATA ACCESS PERMISSIONS ====================

/**
 * Permission grant for cross-system data access
 * Combines blockchain-based access control with Nillion permissions
 */
export interface CrossSystemPermission {
  /** Permission ID (unique identifier) */
  id: string;

  /** Grantor's Ethereum address */
  grantorAddress: Address;

  /** Grantor's Nillion DID */
  grantorDID: string;

  /** Grantee's Ethereum address (e.g., researcher, clinic) */
  granteeAddress: Address;

  /** Granted permissions */
  permissions: {
    /** On-chain permissions (read study results, view enrollments) */
    blockchain: string[];

    /** Off-chain permissions (read:diagnoses, read:biomarkers, etc.) */
    nillion: string[];
  };

  /** Study ID this permission is scoped to (if applicable) */
  studyId?: bigint;

  /** Grant timestamp */
  grantedAt: number;

  /** Expiration timestamp (null = no expiration) */
  expiresAt: number | null;

  /** Whether permission is currently active */
  active: boolean;

  /** On-chain signature proving permission grant */
  signature?: `0x${string}`;
}

/**
 * Request to grant cross-system permission
 */
export interface GrantPermissionRequest {
  granteeAddress: Address;
  permissions: {
    blockchain: string[];
    nillion: string[];
  };
  studyId?: bigint;
  expiresAt?: number;
}

/**
 * Response from granting permission
 */
export interface GrantPermissionResponse {
  success: boolean;
  permission?: CrossSystemPermission;
  error?: string;
}

// ==================== HEALTH DATA SYNCHRONIZATION ====================

/**
 * Synchronization status between blockchain attestations and Nillion storage
 */
export interface DataSyncStatus {
  /** Ethereum address being synced */
  address: Address;

  /** Nillion DID being synced */
  nillionDID: string;

  /** Last sync timestamp */
  lastSyncedAt: number;

  /** Sync statistics */
  stats: {
    /** Number of on-chain attestations */
    onChainAttestations: number;

    /** Number of Nillion records */
    nillionRecords: number;

    /** Number of synced pairs */
    syncedPairs: number;

    /** Number of orphaned attestations (no Nillion record) */
    orphanedAttestations: number;

    /** Number of orphaned records (no attestation) */
    orphanedRecords: number;
  };

  /** Sync errors (if any) */
  errors?: string[];
}

/**
 * Request to sync data between systems
 */
export interface SyncDataRequest {
  address: Address;
  nillionDID: string;
  /** Whether to create missing attestations */
  createMissingAttestations?: boolean;
  /** Whether to remove orphaned data */
  cleanupOrphaned?: boolean;
}

/**
 * Response from sync operation
 */
export interface SyncDataResponse {
  success: boolean;
  status?: DataSyncStatus;
  actions?: {
    attestationsCreated: number;
    recordsLinked: number;
    orphansRemoved: number;
  };
  error?: string;
}

// ==================== CLINIC OPERATIONS ====================

/**
 * Clinic issuing health data that bridges blockchain and Nillion
 */
export interface ClinicIssuance {
  /** Clinic's Ethereum address */
  clinicAddress: Address;

  /** Patient's Ethereum address */
  patientAddress: Address;

  /** Patient's Nillion DID */
  patientDID: string;

  /** Health data type being issued */
  dataType: HealthRecordType;

  /** Reference to data stored in Nillion */
  storageRef: NillionStorageReference;

  /** On-chain attestation hash */
  attestationHash: `0x${string}`;

  /** Issuance timestamp */
  issuedAt: number;

  /** Transaction hash */
  txHash: `0x${string}`;
}

/**
 * Request to issue health data
 */
export interface IssueHealthDataRequest {
  patientAddress: Address;
  patientDID: string;
  dataType: HealthRecordType;
  data: any; // Encrypted health record data
  clinicSignature: `0x${string}`;
}

/**
 * Response from issuing health data
 */
export interface IssueHealthDataResponse {
  success: boolean;
  issuance?: ClinicIssuance;
  error?: string;
}

// ==================== QUERY HELPERS ====================

/**
 * Query parameters for finding identity mappings
 */
export interface IdentityMappingQuery {
  ethereumAddress?: Address;
  nillionDID?: string;
  onChainVerified?: boolean;
  createdAfter?: number;
  createdBefore?: number;
}

/**
 * Query parameters for finding storage references
 */
export interface StorageReferenceQuery {
  ownerDID?: string;
  dataType?: HealthRecordType;
  storeId?: string;
  storedAfter?: number;
  storedBefore?: number;
}

/**
 * Query parameters for finding study applications
 */
export interface StudyApplicationQuery {
  studyId?: bigint;
  applicantAddress?: Address;
  applicantDID?: string;
  status?: CrossSystemStudyApplication['status'];
  appliedAfter?: number;
  appliedBefore?: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a storage reference from Nillion storage operation
 */
export function createStorageReference(
  storeId: string,
  recordId: string,
  dataType: HealthRecordType,
  ownerDID: string
): NillionStorageReference {
  return {
    storeId,
    recordId,
    dataType,
    ownerDID,
    storedAt: Date.now(),
  };
}

/**
 * Create an attestation from on-chain event and Nillion reference
 */
export function createAttestation(
  hash: `0x${string}`,
  storageRef: NillionStorageReference,
  attesterAddress: Address,
  attestedAt: number
): NillionAttestation {
  return {
    hash,
    storageRef,
    attesterAddress,
    attestedAt,
    active: true,
  };
}

/**
 * Check if storage reference is expired (optional TTL)
 */
export function isStorageRefExpired(
  ref: NillionStorageReference,
  ttlMs?: number
): boolean {
  if (!ttlMs) return false;
  return Date.now() - ref.storedAt > ttlMs;
}

/**
 * Check if permission is currently valid
 */
export function isPermissionValid(permission: CrossSystemPermission): boolean {
  if (!permission.active) return false;
  if (permission.expiresAt && Date.now() > permission.expiresAt) return false;
  return true;
}
