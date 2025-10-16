/**
 * Human Infrastructure - Barrel Export
 *
 * Centralized exports for Human Protocol infrastructure
 */

// Human Protocol Client
export {
  HumanProtocolClient,
  createPassportClient,
  createHumanProtocolClient,
  type HumanConfig,
  type PassportConfig,
  type VerificationResult,
  type VerificationDetails,
  type PassportScoreResponse,
  type PassportStampsResponse,
  type PassportStamp,
  type PassportStampScore,
} from './HumanProtocolClient';

// Test Address Provider
export {
  TestAddressProvider,
  testAddressProvider,
  createTestAddressProvider,
  type TestAddressConfig,
} from './TestAddressProvider';
