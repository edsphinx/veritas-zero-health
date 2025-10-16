/**
 * Zero-Knowledge Proof Types
 *
 * Type definitions for ZK proof generation and verification across the system.
 * Supports both Groth16 (Circom/snarkjs) and Halo2 (Mopro) proof systems.
 */

// ==================== PROOF SYSTEM TYPES ====================

/**
 * Supported ZK proof systems
 */
export type ProofSystem = 'groth16' | 'halo2-plonk';

/**
 * Groth16 proof structure for Circom circuits
 * Compatible with Solidity verifier contracts
 */
export interface Groth16Proof {
  /** Point A of the proof (2 field elements) */
  pA: [string, string];

  /** Point B of the proof (2x2 field elements for bn128 pairing) */
  pB: [[string, string], [string, string]];

  /** Point C of the proof (2 field elements) */
  pC: [string, string];

  /** Public signals/inputs */
  publicSignals: string[];
}

/**
 * Halo2 proof structure for Mopro/Plonkish circuits
 * Used for age range and complex eligibility checks
 */
export interface Halo2Proof {
  /** Proof bytes (serialized) */
  proof: Uint8Array | string;

  /** Public inputs to the circuit */
  publicInputs: string[] | Record<string, string>;

  /** Proof generation timestamp */
  generatedAt: number;

  /** Time taken to generate proof (ms) */
  timeMs?: number;
}

/**
 * Generic proof container
 * Can hold either Groth16 or Halo2 proofs
 */
export interface ZKProof {
  /** Proof system used */
  system: ProofSystem;

  /** Circuit name/identifier */
  circuit: string;

  /** Proof data (format depends on system) */
  proof: Groth16Proof | Halo2Proof;

  /** Proof generation metadata */
  metadata: {
    generatedAt: number;
    timeMs: number;
    version?: string;
  };
}

// ==================== CIRCUIT INPUT TYPES ====================

/**
 * Age range circuit inputs (Halo2/Plonkish)
 * Used for anonymous age verification in clinical trials
 */
export interface AgeRangeCircuitInput {
  /** Patient's actual age (private witness) */
  age: string;

  /** Minimum age requirement (public input) */
  min_age: string;

  /** Maximum age requirement (public input) */
  max_age: string;

  /** Study ID to bind proof to (public input) */
  study_id: string;
}

/**
 * Eligibility code circuit inputs (Groth16/Circom)
 * Used for verifying medical eligibility on-chain
 */
export interface EligibilityCodeCircuitInput {
  /** 4-element eligibility code [biomarker, vital, medAllergy, diagnosis] */
  code: [bigint, bigint, bigint, bigint] | [string, string, string, string];

  /** Poseidon hash of required code (public input) */
  requiredCodeHash: bigint | string;
}

/**
 * Generic circuit input container
 */
export interface CircuitInput {
  /** Circuit identifier */
  circuit: string;

  /** Input data (format depends on circuit) */
  inputs: AgeRangeCircuitInput | EligibilityCodeCircuitInput | Record<string, any>;
}

// ==================== PROOF GENERATION/VERIFICATION ====================

/**
 * Proof generation request
 * Sent from Next.js app to browser extension
 */
export interface ProofGenerationRequest {
  /** Circuit to use for proof */
  circuit: 'age-range' | 'eligibility-code' | string;

  /** Study ID (for binding proof to specific study) */
  studyId: string | bigint;

  /** Circuit inputs */
  inputs: CircuitInput['inputs'];

  /** Request ID for tracking */
  requestId?: string;

  /** Timestamp */
  timestamp: number;
}

/**
 * Proof generation response
 * Returned from browser extension to Next.js app
 */
export interface ProofGenerationResponse {
  /** Whether proof generation succeeded */
  success: boolean;

  /** Generated proof (if successful) */
  proof?: ZKProof;

  /** Error message (if failed) */
  error?: string;

  /** Request ID (for matching request) */
  requestId?: string;

  /** Generation time in milliseconds */
  timeMs?: number;
}

/**
 * Proof verification request
 * For local verification before on-chain submission
 */
export interface ProofVerificationRequest {
  /** Proof system */
  system: ProofSystem;

  /** Circuit identifier */
  circuit: string;

  /** Proof to verify */
  proof: Groth16Proof | Halo2Proof;

  /** Public inputs */
  publicInputs: string[];
}

/**
 * Proof verification response
 */
export interface ProofVerificationResponse {
  /** Whether proof is valid */
  valid: boolean;

  /** Verification time in milliseconds */
  timeMs: number;

  /** Error message (if verification failed) */
  error?: string;
}

// ==================== ZK SYSTEM STATUS ====================

/**
 * ZK proof system initialization status
 */
export interface ZKSystemStatus {
  /** Whether WASM module is initialized */
  initialized: boolean;

  /** Whether SRS key is loaded */
  srsLoaded: boolean;

  /** Whether proving key is loaded */
  pkLoaded: boolean;

  /** Whether verifying key is loaded */
  vkLoaded: boolean;

  /** Available circuits */
  circuits?: string[];

  /** System version */
  version?: string;
}

/**
 * Cryptographic keys status
 */
export interface CryptoKeysStatus {
  /** SRS key size in bytes */
  srsSize?: number;

  /** Proving key size in bytes */
  pkSize?: number;

  /** Verifying key size in bytes */
  vkSize?: number;

  /** Whether keys are loaded */
  loaded: boolean;
}

// ==================== EXTENSION COMMUNICATION ====================

/**
 * Message types for extension <-> webapp communication
 */
export type ZKMessageType =
  | 'GENERATE_PROOF'
  | 'PROOF_GENERATED'
  | 'VERIFY_PROOF'
  | 'PROOF_VERIFIED'
  | 'GET_ZK_STATUS'
  | 'ZK_STATUS'
  | 'ZK_ERROR';

/**
 * Extension message for ZK operations
 */
export interface ZKExtensionMessage {
  /** Message type */
  type: ZKMessageType;

  /** Message payload */
  payload:
    | ProofGenerationRequest
    | ProofGenerationResponse
    | ProofVerificationRequest
    | ProofVerificationResponse
    | ZKSystemStatus
    | { error: string };

  /** Message ID for tracking */
  messageId: string;

  /** Timestamp */
  timestamp: number;
}

// ==================== STUDY APPLICATION TYPES ====================

/**
 * ZK proof for study application
 * Contains both age and eligibility proofs
 */
export interface StudyApplicationProof {
  /** Age range proof (Halo2) */
  ageProof: Halo2Proof;

  /** Eligibility code proof (Groth16) - optional */
  eligibilityProof?: Groth16Proof;

  /** Study ID */
  studyId: bigint;

  /** Application timestamp */
  appliedAt: number;
}

/**
 * Formatted proof for contract submission
 * Converts proof to Solidity-compatible format
 */
export interface ContractProofData {
  /** Groth16 proof components */
  pA: [string, string];
  pB: [[string, string], [string, string]];
  pC: [string, string];

  /** Public inputs */
  publicSignals: string[];
}

// ==================== HELPER TYPES ====================

/**
 * Result of proof generation with metadata
 */
export interface ProofGenerationResult {
  /** Generated proof in hex format */
  proof: `0x${string}`;

  /** Public inputs */
  publicInputs: string[];

  /** Generation timestamp */
  generatedAt: number;

  /** Generation time */
  timeMs: number;

  /** Circuit used */
  circuit: string;
}

/**
 * Proof validation result
 */
export interface ProofValidationResult {
  /** Whether proof is valid */
  valid: boolean;

  /** Validation errors (if any) */
  errors?: string[];

  /** Validation warnings (if any) */
  warnings?: string[];
}

// ==================== EXPORT HELPERS ====================

/**
 * Type guard for Groth16 proof
 */
export function isGroth16Proof(proof: any): proof is Groth16Proof {
  return (
    typeof proof === 'object' &&
    'pA' in proof &&
    'pB' in proof &&
    'pC' in proof &&
    'publicSignals' in proof &&
    Array.isArray(proof.pA) &&
    proof.pA.length === 2 &&
    Array.isArray(proof.pB) &&
    proof.pB.length === 2
  );
}

/**
 * Type guard for Halo2 proof
 */
export function isHalo2Proof(proof: any): proof is Halo2Proof {
  return (
    typeof proof === 'object' &&
    'proof' in proof &&
    'publicInputs' in proof &&
    'generatedAt' in proof &&
    (proof.proof instanceof Uint8Array || typeof proof.proof === 'string')
  );
}

/**
 * Format Groth16 proof for contract submission
 * Extracts only the proof components without public signals
 */
export function formatGroth16ForContract(proof: Groth16Proof): ContractProofData {
  return {
    pA: proof.pA,
    pB: proof.pB,
    pC: proof.pC,
    publicSignals: proof.publicSignals,
  };
}
