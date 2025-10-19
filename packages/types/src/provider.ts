/**
 * Medical Provider Types
 *
 * Type definitions for certified medical providers (clinics, hospitals, individual practitioners).
 * Based on MedicalProviderRegistry.sol and IProviderTypes.sol smart contracts.
 *
 * Providers can:
 * - Issue health credentials to patients
 * - Attest to medical data
 * - Enroll patients in studies
 * - Verify study milestone completion
 *
 * @see /packages/foundry/contracts/core/MedicalProviderRegistry.sol
 * @see /packages/foundry/contracts/types/IProviderTypes.sol
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Certification level - MUST match IProviderTypes.sol
 */
export enum CertificationLevel {
  None = 0,                   // Not certified
  Individual = 1,             // Individual practitioner
  Clinic = 2,                 // Medical clinic
  Hospital = 3,               // Hospital institution
  GovernmentAuthority = 4,    // Government health authority
}

// ============================================================================
// Core Provider Types
// ============================================================================

/**
 * Medical provider (API/Frontend type)
 */
export interface MedicalProvider {
  id: string;
  address: string; // Provider wallet address
  name: string;
  licenseNumber: string;
  licenseHash: string; // bytes32 as hex string
  certificationLevel: CertificationLevel;
  certifiedAt: Date | string;
  expiresAt?: Date | string | null;
  certifiedBy: string; // Address of certifier
  isActive: boolean;
  country: string; // ISO country code
  specializations: string[]; // Array of specialization codes

  // Revocation (if applicable)
  revokedAt?: Date | string | null;
  revokedBy?: string | null;
  revocationReason?: string | null;

  // Blockchain tracking
  chainId: number;
  certificationTxHash: string;
  certificationBlockNumber: string; // BigInt as string

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Medical provider (Database type)
 */
export interface MedicalProviderDB {
  id: string;
  address: string;
  name: string;
  licenseNumber: string;
  licenseHash: string;
  certificationLevel: CertificationLevel;
  certifiedAt: Date;
  expiresAt: Date | null;
  certifiedBy: string;
  isActive: boolean;
  country: string;
  specializations: string[];

  // Revocation
  revokedAt: Date | null;
  revokedBy: string | null;
  revocationReason: string | null;

  // Blockchain tracking
  chainId: number;
  certificationTxHash: string;
  certificationBlockNumber: bigint;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert MedicalProviderDB to MedicalProvider (API type)
 */
export function toAPIMedicalProvider(dbProvider: MedicalProviderDB): MedicalProvider {
  return {
    id: dbProvider.id,
    address: dbProvider.address,
    name: dbProvider.name,
    licenseNumber: dbProvider.licenseNumber,
    licenseHash: dbProvider.licenseHash,
    certificationLevel: dbProvider.certificationLevel,
    certifiedAt: dbProvider.certifiedAt,
    expiresAt: dbProvider.expiresAt ?? undefined,
    certifiedBy: dbProvider.certifiedBy,
    isActive: dbProvider.isActive,
    country: dbProvider.country,
    specializations: dbProvider.specializations,
    revokedAt: dbProvider.revokedAt ?? undefined,
    revokedBy: dbProvider.revokedBy ?? undefined,
    revocationReason: dbProvider.revocationReason ?? undefined,
    chainId: dbProvider.chainId,
    certificationTxHash: dbProvider.certificationTxHash,
    certificationBlockNumber: dbProvider.certificationBlockNumber.toString(),
    createdAt: dbProvider.createdAt,
    updatedAt: dbProvider.updatedAt,
  };
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Provider certification request
 */
export interface CertifyProviderRequest {
  address: string;
  name: string;
  licenseNumber: string;
  licenseHash: string;
  certificationLevel: CertificationLevel;
  country: string;
  specializations: string[];
  expirationDays?: number; // Optional: defaults to 365 days
}

/**
 * Provider revocation request
 */
export interface RevokeProviderRequest {
  address: string;
  reason: string;
}

/**
 * Check if provider certification is expired
 */
export function isProviderExpired(provider: MedicalProvider): boolean {
  if (!provider.expiresAt) return false;
  const expirationDate = typeof provider.expiresAt === 'string'
    ? new Date(provider.expiresAt)
    : provider.expiresAt;
  return expirationDate < new Date();
}

/**
 * Check if provider is revoked
 */
export function isProviderRevoked(provider: MedicalProvider): boolean {
  return provider.revokedAt !== null && provider.revokedAt !== undefined;
}

/**
 * Check if provider is currently valid (active, not expired, not revoked)
 */
export function isProviderValid(provider: MedicalProvider): boolean {
  return (
    provider.isActive &&
    !isProviderExpired(provider) &&
    !isProviderRevoked(provider)
  );
}
