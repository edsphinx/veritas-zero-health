/**
 * SuperAdmin Access Control
 *
 * Defines and validates superadmin addresses
 */

import type { Address } from 'viem';

/**
 * Hardcoded superadmin addresses
 * These addresses have full system access
 */
const SUPERADMIN_ADDRESSES: Address[] = [
  '0xeA5A20D8d9Eeed3D8275993bdF3Bdb4749e7C485', // Deployer
  '0xf5Ac0b87325Bf1B3Eee525EB9646faFD69D2FedC', // Personal address
];

/**
 * Check if an address is a superadmin
 */
export function isSuperAdmin(address: Address | null | undefined): boolean {
  if (!address) return false;

  // Normalize addresses to lowercase for comparison
  const normalizedAddress = address.toLowerCase() as Address;

  return SUPERADMIN_ADDRESSES.some(
    (adminAddress) => adminAddress.toLowerCase() === normalizedAddress
  );
}

/**
 * Get all superadmin addresses
 */
export function getSuperAdminAddresses(): Address[] {
  return [...SUPERADMIN_ADDRESSES];
}

/**
 * Check if user has superadmin access and return appropriate message
 */
export function validateSuperAdminAccess(address: Address | null | undefined): {
  hasAccess: boolean;
  message?: string;
} {
  if (!address) {
    return {
      hasAccess: false,
      message: 'No wallet connected',
    };
  }

  if (!isSuperAdmin(address)) {
    return {
      hasAccess: false,
      message: 'Access denied. SuperAdmin privileges required.',
    };
  }

  return {
    hasAccess: true,
  };
}
