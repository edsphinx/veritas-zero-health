/**
 * Human Passport Types
 *
 * Type definitions for Gitcoin Passport (Human Protocol) integration.
 * Passport provides Sybil-resistant identity verification using stamps.
 *
 * API Documentation: https://docs.passport.xyz/building-with-passport/passport-api
 * Base URL: https://api.passport.xyz
 *
 * @see https://docs.passport.xyz/
 * @see https://passport.xyz/
 */

// ============================================
// Configuration Types
// ============================================

export interface PassportConfig {
  apiKey: string; // Required: API key from Passport developer portal
  scorerId: string; // Required: Scorer ID from developer portal
  apiUrl?: string; // Optional: Custom API endpoint (default: https://api.passport.xyz)
  minScore?: number; // Optional: Minimum passing score (default: 20)
}

// ============================================
// Passport API v2 Response Types
// ============================================

export interface PassportStampScore {
  score: string; // Individual stamp score (API returns as string)
}

export interface PassportScoreResponse {
  address: string; // Ethereum address
  score: string; // Total Passport score (string format)
  passing_score: boolean; // Whether score meets threshold
  threshold: string; // Recommended threshold (default: "20")
  last_score_timestamp: string; // ISO timestamp
  expiration_timestamp: string; // ISO timestamp
  stamp_scores: Record<string, PassportStampScore>; // Individual stamp scores
}

export interface PassportStamp {
  version: string;
  credential: unknown; // Verifiable credential data (varies by stamp)
}

export interface PassportStampsResponse {
  address: string;
  stamps: PassportStamp[];
}

// ============================================
// Application Types (JSON-serializable)
// ============================================

/**
 * Verification result from Passport API
 * All numeric values converted to numbers for application use
 */
export interface VerificationResult {
  success: boolean;
  verified: boolean; // Whether user meets minimum score
  score: number; // Numerical score
  passingScore: boolean; // From API response
  threshold: number; // Score threshold
  lastUpdated: Date | string; // ISO string for JSON
  expiresAt: Date | string; // ISO string for JSON
  stampScores?: Record<string, number>; // Individual stamp contributions
}

/**
 * Detailed verification information
 * Used for displaying verification status to users
 */
export interface VerificationDetails {
  verified: boolean;
  score: number;
  threshold: number;
  verifiedAt?: Date | string;
  expiresAt?: Date | string;
  stamps?: PassportStamp[];
}

/**
 * Simplified passport status
 * Used for quick checks and UI state
 */
export interface PassportStatus {
  isVerified: boolean;
  score: number;
  verifiedAt?: Date | string;
  expiresAt?: Date | string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface VerifyPassportRequest {
  address: string; // Ethereum address to verify
}

export interface VerifyPassportResponse {
  success: boolean;
  data?: VerificationResult;
  error?: string;
}

export interface GetPassportStatusRequest {
  address: string;
}

export interface GetPassportStatusResponse {
  success: boolean;
  data?: PassportStatus;
  error?: string;
}

// ============================================
// UI State Types
// ============================================

export interface PassportVerificationState {
  isLoading: boolean;
  isVerified: boolean;
  verificationDetails?: VerificationDetails;
  error?: string;
}

// ============================================
// Database Types (Prisma PassportVerification model)
// ============================================

/**
 * PassportVerificationDB - Database representation
 * Uses Prisma native types (directly from database)
 */
export interface PassportVerificationDB {
  id: string;
  userId: string;
  address: string;

  // Verification scores
  score: number; // Prisma stores Float as number
  threshold: number;
  passingScore: boolean;
  verified: boolean;

  // Stamps and metadata
  stampScores: Record<string, number> | null; // Prisma Json type
  lastScoreTimestamp: Date;
  expirationTimestamp: Date;
  apiResponseRaw: unknown | null; // Prisma Json type

  // Metadata
  minScoreRequired: number;
  verifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PassportVerificationAPI - API/Frontend representation
 * JSON-serializable version with Date converted to string
 */
export interface PassportVerificationAPI {
  id: string;
  userId: string;
  address: string;

  // Verification scores
  score: number;
  threshold: number;
  passingScore: boolean;
  verified: boolean;

  // Stamps and metadata
  stampScores?: Record<string, number>;
  lastScoreTimestamp: Date | string;
  expirationTimestamp: Date | string;

  // Metadata
  minScoreRequired: number;
  verifiedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Create PassportVerification data
 * Used when saving a new verification
 */
export interface CreatePassportVerificationData {
  userId: string;
  address: string;
  score: number;
  threshold: number;
  passingScore: boolean;
  verified: boolean;
  stampScores?: Record<string, number>;
  lastScoreTimestamp: Date | string;
  expirationTimestamp: Date | string;
  minScoreRequired?: number;
  apiResponseRaw?: unknown;
}

/**
 * Update PassportVerification data
 * Used when updating an existing verification
 */
export interface UpdatePassportVerificationData {
  score?: number;
  threshold?: number;
  passingScore?: boolean;
  verified?: boolean;
  stampScores?: Record<string, number> | null;
  lastScoreTimestamp?: Date | string;
  expirationTimestamp?: Date | string;
  minScoreRequired?: number;
  apiResponseRaw?: unknown | null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert API response to VerificationResult
 * Handles string-to-number conversions and date parsing
 */
export function toVerificationResult(
  apiResponse: PassportScoreResponse,
  minScore = 20
): VerificationResult {
  const score = parseFloat(apiResponse.score);
  const threshold = parseFloat(apiResponse.threshold);

  return {
    success: true,
    verified: apiResponse.passing_score && score >= minScore,
    score,
    passingScore: apiResponse.passing_score,
    threshold,
    lastUpdated: apiResponse.last_score_timestamp,
    expiresAt: apiResponse.expiration_timestamp,
    stampScores: Object.entries(apiResponse.stamp_scores || {}).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: parseFloat(value.score),
      }),
      {}
    ),
  };
}

/**
 * Convert VerificationResult to simplified PassportStatus
 */
export function toPassportStatus(result: VerificationResult): PassportStatus {
  return {
    isVerified: result.verified,
    score: result.score,
    verifiedAt: result.lastUpdated,
    expiresAt: result.expiresAt,
  };
}

/**
 * Check if passport verification is expired
 */
export function isPassportExpired(expiresAt: Date | string): boolean {
  const expirationDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expirationDate < new Date();
}

/**
 * Format passport score for display
 */
export function formatPassportScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Get verification status message
 */
export function getVerificationMessage(
  verified: boolean,
  score: number,
  threshold: number
): string {
  if (verified) {
    return `Verified human (score: ${formatPassportScore(score)})`;
  }
  return `Not verified (score: ${formatPassportScore(score)}, required: ${formatPassportScore(threshold)})`;
}

/**
 * Convert PassportVerificationDB to PassportVerificationAPI
 * Handles Date to string conversion for JSON serialization
 */
export function toAPIPassportVerification(
  dbVerification: PassportVerificationDB
): PassportVerificationAPI {
  return {
    id: dbVerification.id,
    userId: dbVerification.userId,
    address: dbVerification.address,
    score: dbVerification.score,
    threshold: dbVerification.threshold,
    passingScore: dbVerification.passingScore,
    verified: dbVerification.verified,
    stampScores: dbVerification.stampScores || undefined,
    lastScoreTimestamp: dbVerification.lastScoreTimestamp,
    expirationTimestamp: dbVerification.expirationTimestamp,
    minScoreRequired: dbVerification.minScoreRequired,
    verifiedAt: dbVerification.verifiedAt,
    createdAt: dbVerification.createdAt,
    updatedAt: dbVerification.updatedAt,
  };
}

/**
 * Convert VerificationResult to CreatePassportVerificationData
 * Prepares API result for database storage
 */
export function toCreatePassportVerification(
  result: VerificationResult,
  userId: string,
  address: string
): CreatePassportVerificationData {
  return {
    userId,
    address: address.toLowerCase(),
    score: result.score,
    threshold: result.threshold,
    passingScore: result.passingScore,
    verified: result.verified,
    stampScores: result.stampScores,
    lastScoreTimestamp: result.lastUpdated,
    expirationTimestamp: result.expiresAt,
    minScoreRequired: result.threshold, // Use current threshold as minimum
  };
}
