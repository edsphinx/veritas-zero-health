/**
 * Test User Configuration
 *
 * Auto-assigns roles based on wallet addresses from .env
 * FOR DEVELOPMENT/TESTING ONLY - Remove in production
 */

import { UserRole } from '@veritas/types';

/**
 * Test wallet addresses and their assigned roles
 * These addresses are configured in .env file
 */
const TEST_USER_ROLES: Record<string, UserRole> = {
  // Researchers
  '0xF39ca026377a84DE1ee49cB62bAC4e3aba8c73f7': UserRole.RESEARCHER, // RESEARCHER_1
  '0x037115d0179D5259D39BDa543Ab817b1398EDecE': UserRole.RESEARCHER, // RESEARCHER_2

  // Sponsors
  '0x3886DAcbd70796443676FC99bC91d04cCcB61Ce4': UserRole.SPONSOR, // SPONSOR_1
  '0xFB92cD8d7F8ba6B3A56a31c3D690626e3431A0D3': UserRole.SPONSOR, // SPONSOR_2

  // Clinics
  '0x37bfCf97873D7b2f45A795B0943549Bef52e59c8': UserRole.CLINIC, // CLINIC_1
  '0xF6391DAF33b77cD5edAA2b8B41dAd54C1BFEB189': UserRole.CLINIC, // CLINIC_2

  // Patients
  '0x6048bDA3729f1DECce656A5cce787692b5e501eE': UserRole.PATIENT, // PATIENT_1
  '0x65BB3C31C356d7B9dc6871187ec5B908d9baa804': UserRole.PATIENT, // PATIENT_2
};

/**
 * Get role for a test user address
 *
 * @param address - Ethereum address (case-insensitive)
 * @returns UserRole if test user, null otherwise
 */
export function getTestUserRole(address: string): UserRole | null {
  // Normalize address to checksum format
  const normalizedAddress = address.toLowerCase();

  // Check if address exists in test users (case-insensitive)
  for (const [testAddress, role] of Object.entries(TEST_USER_ROLES)) {
    if (testAddress.toLowerCase() === normalizedAddress) {
      return role;
    }
  }

  return null;
}

/**
 * Check if an address is a test user
 *
 * @param address - Ethereum address
 * @returns true if test user, false otherwise
 */
export function isTestUser(address: string): boolean {
  return getTestUserRole(address) !== null;
}

/**
 * Get all test user addresses for a specific role
 *
 * @param role - UserRole to filter by
 * @returns Array of addresses with that role
 */
export function getTestUsersByRole(role: UserRole): string[] {
  return Object.entries(TEST_USER_ROLES)
    .filter(([, userRole]) => userRole === role)
    .map(([address]) => address);
}

/**
 * Get display name for a test user
 *
 * @param address - Ethereum address
 * @returns Display name (e.g., "Researcher 1") or null
 */
export function getTestUserDisplayName(address: string): string | null {
  const normalizedAddress = address.toLowerCase();

  const testUserNames: Record<string, string> = {
    '0xf39ca026377a84de1ee49cb62bac4e3aba8c73f7': 'Researcher 1',
    '0x037115d0179d5259d39bda543ab817b1398edece': 'Researcher 2',
    '0x3886dacbd70796443676fc99bc91d04cccb61ce4': 'Sponsor 1',
    '0xfb92cd8d7f8ba6b3a56a31c3d690626e3431a0d3': 'Sponsor 2',
    '0x37bfcf97873d7b2f45a795b0943549bef52e59c8': 'Clinic 1',
    '0xf6391daf33b77cd5edaa2b8b41dad54c1bfeb189': 'Clinic 2',
    '0x6048bda3729f1decce656a5cce787692b5e501ee': 'Patient 1',
    '0x65bb3c31c356d7b9dc6871187ec5b908d9baa804': 'Patient 2',
  };

  return testUserNames[normalizedAddress] || null;
}

/**
 * Development mode check
 * Only enable test users in development
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';
}

/**
 * Get role for address (test user in dev, or guest otherwise)
 *
 * @param address - Ethereum address
 * @returns UserRole (test role in dev, guest otherwise)
 */
export function getRoleForAddress(address: string): UserRole {
  // Only use test users in development mode
  if (isDevMode()) {
    const testRole = getTestUserRole(address);
    if (testRole) {
      console.log(`[Test Users] Auto-assigned role '${testRole}' to ${address}`);
      return testRole;
    }
  }

  // Default to guest for unknown addresses
  return UserRole.GUEST;
}
