/**
 * Test Address Provider
 *
 * Centralized configuration for test addresses that should bypass Human Passport verification.
 * Provides utilities to check if an address is a test address and generate mock verification data.
 *
 * Usage:
 * ```typescript
 * import { testAddressProvider } from '@/infrastructure/human/TestAddressProvider';
 *
 * if (testAddressProvider.isTestAddress(address)) {
 *   return testAddressProvider.getMockVerification();
 * }
 * ```
 */

import type { VerificationResult, VerificationDetails } from './HumanProtocolClient';

/**
 * Test Address Configuration
 */
export interface TestAddressConfig {
  /** The real address that should always use real verification */
  realVerificationAddress: string;
  /** Test addresses from .env that should use mock verification */
  testAddresses: string[];
}

/**
 * Test Address Provider Class
 */
export class TestAddressProvider {
  private realVerificationAddress: string;
  private testAddresses: Set<string>;
  private mockScore: number;

  constructor(config?: Partial<TestAddressConfig>) {
    // Real verification address (your personal address)
    this.realVerificationAddress = (
      config?.realVerificationAddress ||
      '0xf5Ac0b87325Bf1B3Eee525EB9646faFD69D2FedC'
    ).toLowerCase();

    // Load test addresses from .env
    // These addresses will bypass Human Passport verification with mock score of 20
    const envTestAddresses = [
      // Researchers
      process.env.RESEARCHER_1_ADDRESS,
      process.env.RESEARCHER_2_ADDRESS,
      // Sponsors
      process.env.SPONSOR_1_ADDRESS,
      process.env.SPONSOR_2_ADDRESS,
      // Clinics
      process.env.CLINIC_1_ADDRESS,
      process.env.CLINIC_2_ADDRESS,
      // Patients
      process.env.PATIENT_1_ADDRESS,
      process.env.PATIENT_2_ADDRESS,
      // Additional custom addresses
      ...(config?.testAddresses || []),
    ]
      .filter(Boolean)
      .map(addr => addr!.toLowerCase());

    this.testAddresses = new Set(envTestAddresses);

    // Default mock score (minimum passing score)
    this.mockScore = 20;

    console.log('[TestAddressProvider] Initialized');
    console.log('[TestAddressProvider] Real verification required for:', this.realVerificationAddress);
    console.log('[TestAddressProvider] Bypass enabled for test addresses:', Array.from(this.testAddresses));
  }

  /**
   * Check if an address should use mock verification
   * @param address - Address to check
   * @returns True if address should bypass real verification
   */
  isTestAddress(address: string): boolean {
    const normalized = address.toLowerCase();

    // Never bypass the real verification address
    if (normalized === this.realVerificationAddress) {
      return false;
    }

    return this.testAddresses.has(normalized);
  }

  /**
   * Check if an address requires real verification
   * @param address - Address to check
   * @returns True if address requires real verification
   */
  requiresRealVerification(address: string): boolean {
    return !this.isTestAddress(address);
  }

  /**
   * Get mock verification result for test addresses
   * @returns Mock VerificationResult with passing score
   */
  getMockVerificationResult(): VerificationResult {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    return {
      success: true,
      verified: true,
      score: this.mockScore,
      passingScore: true,
      threshold: this.mockScore,
      lastUpdated: now,
      expiresAt,
      stampScores: {
        'test-address-bypass': this.mockScore,
      },
    };
  }

  /**
   * Get mock verification details for test addresses
   * @param address - Address to generate mock for
   * @returns Mock VerificationDetails with passing score
   */
  getMockVerificationDetails(address: string): VerificationDetails {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    return {
      verified: true,
      score: this.mockScore,
      threshold: this.mockScore,
      verifiedAt: now,
      expiresAt,
      stamps: [
        {
          version: '1.0.0',
          credential: {
            type: ['VerifiableCredential'],
            credentialSubject: {
              id: `did:pkh:eip155:1:${address}`,
              provider: 'TestAddressBypass',
            },
          },
        },
      ],
    };
  }

  /**
   * Set custom mock score for testing
   * @param score - Score to use for mock verification
   */
  setMockScore(score: number): void {
    this.mockScore = score;
  }

  /**
   * Get the list of test addresses
   * @returns Array of test addresses
   */
  getTestAddresses(): string[] {
    return Array.from(this.testAddresses);
  }

  /**
   * Get the real verification address
   * @returns Real verification address
   */
  getRealVerificationAddress(): string {
    return this.realVerificationAddress;
  }

  /**
   * Add a test address dynamically
   * @param address - Address to add to test list
   */
  addTestAddress(address: string): void {
    this.testAddresses.add(address.toLowerCase());
    console.log('[TestAddressProvider] Added test address:', address);
  }

  /**
   * Remove a test address dynamically
   * @param address - Address to remove from test list
   */
  removeTestAddress(address: string): void {
    this.testAddresses.delete(address.toLowerCase());
    console.log('[TestAddressProvider] Removed test address:', address);
  }
}

/**
 * Singleton instance of TestAddressProvider
 * Use this for consistent behavior across the application
 */
export const testAddressProvider = new TestAddressProvider();

/**
 * Factory function to create a custom instance
 * Useful for testing or special configurations
 */
export function createTestAddressProvider(
  config?: Partial<TestAddressConfig>
): TestAddressProvider {
  return new TestAddressProvider(config);
}
