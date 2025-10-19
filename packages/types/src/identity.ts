/**
 * Health Identity Types
 *
 * Type definitions for patient health identities and medical data attestations.
 * Based on HealthIdentitySBT.sol smart contract.
 *
 * Health identities are soulbound tokens (SBTs) that:
 * - Link patient wallet address to Nillion DID (decentralized identifier)
 * - Link to Human Passport for Sybil resistance
 * - Track medical data attestations from certified providers
 * - Enable privacy-preserving study applications
 *
 * @see /packages/foundry/contracts/core/HealthIdentitySBT.sol
 */

// ============================================================================
// Core Health Identity Types
// ============================================================================

/**
 * Health identity SBT (API/Frontend type)
 */
export interface HealthIdentity {
  id: string;
  address: string; // Patient wallet address
  tokenId: number; // SBT token ID
  nillionDID: string; // Nillion decentralized identifier
  humanPassportId: number | null; // Human Passport token ID (optional)
  attestationCount: number; // Number of attestations
  active: boolean;

  // Blockchain tracking
  chainId: number;
  mintTxHash: string;
  mintBlockNumber: string; // BigInt as string

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations (optional)
  attestations?: HealthAttestation[];
}

/**
 * Health identity SBT (Database type)
 */
export interface HealthIdentityDB {
  id: string;
  address: string;
  tokenId: number;
  nillionDID: string;
  humanPassportId: number | null;
  attestationCount: number;
  active: boolean;

  // Blockchain tracking
  chainId: number;
  mintTxHash: string;
  mintBlockNumber: bigint;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert HealthIdentityDB to HealthIdentity (API type)
 */
export function toAPIHealthIdentity(dbIdentity: HealthIdentityDB): HealthIdentity {
  return {
    id: dbIdentity.id,
    address: dbIdentity.address,
    tokenId: dbIdentity.tokenId,
    nillionDID: dbIdentity.nillionDID,
    humanPassportId: dbIdentity.humanPassportId,
    attestationCount: dbIdentity.attestationCount,
    active: dbIdentity.active,
    chainId: dbIdentity.chainId,
    mintTxHash: dbIdentity.mintTxHash,
    mintBlockNumber: dbIdentity.mintBlockNumber.toString(),
    createdAt: dbIdentity.createdAt,
    updatedAt: dbIdentity.updatedAt,
  };
}

// ============================================================================
// Health Attestation Types
// ============================================================================

/**
 * Medical data attestation (API/Frontend type)
 * Tracks which provider attested to which patient data
 */
export interface HealthAttestation {
  id: string;
  dataHash: string; // bytes32 as hex - keccak256(nillionRecordId + dataType + vcSignature)
  providerAddress: string;
  patientAddress: string;
  patientId: string; // Foreign key to HealthIdentity
  revoked: boolean;

  // Blockchain tracking
  chainId: number;
  transactionHash: string;
  blockNumber: string; // BigInt as string
  timestamp: Date | string;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Medical data attestation (Database type)
 */
export interface HealthAttestationDB {
  id: string;
  dataHash: string;
  providerAddress: string;
  patientAddress: string;
  patientId: string;
  revoked: boolean;

  // Blockchain tracking
  chainId: number;
  transactionHash: string;
  blockNumber: bigint;
  timestamp: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert HealthAttestationDB to HealthAttestation (API type)
 */
export function toAPIHealthAttestation(dbAttestation: HealthAttestationDB): HealthAttestation {
  return {
    id: dbAttestation.id,
    dataHash: dbAttestation.dataHash,
    providerAddress: dbAttestation.providerAddress,
    patientAddress: dbAttestation.patientAddress,
    patientId: dbAttestation.patientId,
    revoked: dbAttestation.revoked,
    chainId: dbAttestation.chainId,
    transactionHash: dbAttestation.transactionHash,
    blockNumber: dbAttestation.blockNumber.toString(),
    timestamp: dbAttestation.timestamp,
    createdAt: dbAttestation.createdAt,
    updatedAt: dbAttestation.updatedAt,
  };
}

// ============================================================================
// Study Participation SBT Types
// ============================================================================

/**
 * Study participation token (API/Frontend type)
 * SBT minted when patient enrolls in a study
 */
export interface StudyParticipationToken {
  id: string;
  tokenId: number;
  enrollmentId: number;
  participantAddress: string; // Patient wallet
  institutionAddress: string; // Clinic/provider wallet
  locationHint: string | null; // Optional location identifier
  complianceLevel: number; // 1-5 scale
  interactionCount: number; // Number of interactions

  // Blockchain tracking
  chainId: number;
  mintTxHash: string;
  mintBlockNumber: string; // BigInt as string
  timestamp: Date | string;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Study participation token (Database type)
 */
export interface StudyParticipationTokenDB {
  id: string;
  tokenId: number;
  enrollmentId: number;
  participantAddress: string;
  institutionAddress: string;
  locationHint: string | null;
  complianceLevel: number;
  interactionCount: number;

  // Blockchain tracking
  chainId: number;
  mintTxHash: string;
  mintBlockNumber: bigint;
  timestamp: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert StudyParticipationTokenDB to StudyParticipationToken (API type)
 */
export function toAPIStudyParticipationToken(
  dbToken: StudyParticipationTokenDB
): StudyParticipationToken {
  return {
    id: dbToken.id,
    tokenId: dbToken.tokenId,
    enrollmentId: dbToken.enrollmentId,
    participantAddress: dbToken.participantAddress,
    institutionAddress: dbToken.institutionAddress,
    locationHint: dbToken.locationHint,
    complianceLevel: dbToken.complianceLevel,
    interactionCount: dbToken.interactionCount,
    chainId: dbToken.chainId,
    mintTxHash: dbToken.mintTxHash,
    mintBlockNumber: dbToken.mintBlockNumber.toString(),
    timestamp: dbToken.timestamp,
    createdAt: dbToken.createdAt,
    updatedAt: dbToken.updatedAt,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if health identity is active and verified
 */
export function isHealthIdentityValid(identity: HealthIdentity): boolean {
  return identity.active && identity.humanPassportId !== null;
}

/**
 * Check if attestation is still valid (not revoked)
 */
export function isAttestationValid(attestation: HealthAttestation): boolean {
  return !attestation.revoked;
}

/**
 * Get compliance level description
 */
export function getComplianceLevelDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: 'Initial enrollment',
    2: 'Regular participant',
    3: 'Consistent participant',
    4: 'Highly compliant',
    5: 'Exemplary participant',
  };
  return descriptions[level] || 'Unknown';
}
