/**
 * @veritas/types - Shared TypeScript types
 *
 * Central type definitions shared between Next.js app, browser extension, and future mobile app.
 *
 * This is the SINGLE SOURCE OF TRUTH for all type definitions.
 * All packages should import from @veritas/types instead of local type files.
 */

// ==================== CORE TYPES ====================

// Health record types
export * from './health';

// Study types
export * from './study';

// Medical Provider types
export * from './provider';

// Health Identity & Attestation types
export * from './identity';

// Authentication & Authorization types
export * from './auth';

// Enrollment & Trial participation types
export * from './enrollment';

// Event types (blockchain & system events)
export * from './events';

// Human Passport types (Gitcoin Passport)
export * from './passport';

// Zero-Knowledge Proof types
export * from './zk-proof';

// Blockchain & Nillion types
export * from './blockchain-nillion';
