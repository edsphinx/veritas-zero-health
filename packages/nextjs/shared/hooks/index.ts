/**
 * Shared Hooks Index
 *
 * Centralized exports for all application hooks
 */

// Human Passport hooks
export * from './useHumanPassport';
export * from './useHumanWallet';

// Contract interaction hooks - Read operations
export * from './useStudy';
export * from './useStudies';

// Contract interaction hooks - Write operations
export * from './useApplyToStudy';

// Nillion / Extension hooks
export * from './useNillion';
export * from './useExtension';
