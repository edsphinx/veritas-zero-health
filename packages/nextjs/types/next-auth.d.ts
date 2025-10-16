/**
 * NextAuth Type Extensions
 *
 * Extends NextAuth types to include our custom fields
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      address: string;
      role: string;
      isVerified: boolean;
      humanityScore?: number;
      displayName?: string;
      avatar?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    address: string;
    role: string;
    isVerified: boolean;
    humanityScore?: number;
    displayName?: string;
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    address: string;
    role: string;
    isVerified: boolean;
    humanityScore?: number;
    displayName?: string;
    avatar?: string;
  }
}
