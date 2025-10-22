/**
 * NextAuth Type Extensions
 *
 * Extends NextAuth types to include our custom user fields from @veritas/types
 */

import type { UserRole } from "@veritas/types";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    address: string;
    role: UserRole;
    isVerified: boolean;
    humanityScore?: number | null;
    displayName?: string | null;
    avatar?: string | null;
    // Required by NextAuth AdapterUser but not used in Web3 auth
    email: string;
    emailVerified: Date | null;
  }

  interface Session {
    user: User;
    address: string;
    chainId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    userId?: string; // Custom field to store user ID (SIWX overwrites sub)
    address?: string; // Custom field to store extracted address from CAIP-10
    user?: User;
  }
}
