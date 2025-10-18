/**
 * NextAuth API Route Handler
 *
 * Handles all authentication routes: /api/auth/signin, /api/auth/signout, etc.
 * Uses SIWE (Sign-In With Ethereum) for Web3 authentication
 *
 * Note: NextAuth v5 beta compatibility with Next.js 15
 * We need to wrap the handlers to match Next.js 15's route handler signature
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
