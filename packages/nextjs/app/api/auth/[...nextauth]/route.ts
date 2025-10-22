/**
 * NextAuth API Route Handler
 *
 * Handles all authentication routes: /api/auth/signin, /api/auth/signout, etc.
 * Uses SIWE (Sign-In With Ethereum) for Web3 authentication
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
