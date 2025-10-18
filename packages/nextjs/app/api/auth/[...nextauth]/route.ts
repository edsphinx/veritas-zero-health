/**
 * NextAuth API Route Handler
 *
 * Handles all authentication routes: /api/auth/signin, /api/auth/signout, etc.
 * Uses SIWE (Sign-In With Ethereum) for Web3 authentication
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
