/**
 * Role Detector Service
 *
 * Detects user role based on their wallet address.
 * Uses environment variables to map test addresses to roles.
 */

import { UserRole } from '@/shared/types/auth.types';

/**
 * Role mapping configuration from .env
 */
interface RoleMapping {
  address: string;
  role: UserRole;
}

/**
 * Get role mappings from environment variables
 */
function getRoleMappings(): RoleMapping[] {
  const mappings: RoleMapping[] = [];

  // Researchers
  if (process.env.RESEARCHER_1_ADDRESS) {
    mappings.push({
      address: process.env.RESEARCHER_1_ADDRESS.toLowerCase(),
      role: UserRole.RESEARCHER,
    });
  }
  if (process.env.RESEARCHER_2_ADDRESS) {
    mappings.push({
      address: process.env.RESEARCHER_2_ADDRESS.toLowerCase(),
      role: UserRole.RESEARCHER,
    });
  }

  // Sponsors
  if (process.env.SPONSOR_1_ADDRESS) {
    mappings.push({
      address: process.env.SPONSOR_1_ADDRESS.toLowerCase(),
      role: UserRole.SPONSOR,
    });
  }
  if (process.env.SPONSOR_2_ADDRESS) {
    mappings.push({
      address: process.env.SPONSOR_2_ADDRESS.toLowerCase(),
      role: UserRole.SPONSOR,
    });
  }

  // Clinics
  if (process.env.CLINIC_1_ADDRESS) {
    mappings.push({
      address: process.env.CLINIC_1_ADDRESS.toLowerCase(),
      role: UserRole.CLINIC,
    });
  }
  if (process.env.CLINIC_2_ADDRESS) {
    mappings.push({
      address: process.env.CLINIC_2_ADDRESS.toLowerCase(),
      role: UserRole.CLINIC,
    });
  }

  // Patients
  if (process.env.PATIENT_1_ADDRESS) {
    mappings.push({
      address: process.env.PATIENT_1_ADDRESS.toLowerCase(),
      role: UserRole.PATIENT,
    });
  }
  if (process.env.PATIENT_2_ADDRESS) {
    mappings.push({
      address: process.env.PATIENT_2_ADDRESS.toLowerCase(),
      role: UserRole.PATIENT,
    });
  }

  return mappings;
}

/**
 * Detect role from wallet address
 *
 * @param address - Wallet address to check
 * @returns Detected user role
 */
export function detectRoleFromAddress(address: string | undefined): UserRole | null {
  if (!address) return null;

  const normalized = address.toLowerCase();
  const mappings = getRoleMappings();

  // Find matching role mapping
  const mapping = mappings.find((m) => m.address === normalized);

  if (mapping) {
    console.log(`[RoleDetector] Detected role ${mapping.role} for address ${address}`);
    return mapping.role;
  }

  console.log(`[RoleDetector] No role mapping found for address ${address}`);
  return null;
}

/**
 * Check if address has a specific role
 *
 * @param address - Wallet address to check
 * @param role - Role to check for
 * @returns True if address has the role
 */
export function hasRole(address: string | undefined, role: UserRole): boolean {
  const detectedRole = detectRoleFromAddress(address);
  return detectedRole === role;
}

/**
 * Get all addresses for a specific role
 *
 * @param role - Role to get addresses for
 * @returns Array of addresses with the role
 */
export function getAddressesForRole(role: UserRole): string[] {
  const mappings = getRoleMappings();
  return mappings.filter((m) => m.role === role).map((m) => m.address);
}

/**
 * Get all role mappings (for debugging/admin purposes)
 *
 * @returns All role mappings
 */
export function getAllRoleMappings(): RoleMapping[] {
  return getRoleMappings();
}
