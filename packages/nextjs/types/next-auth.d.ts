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
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
  }
}
