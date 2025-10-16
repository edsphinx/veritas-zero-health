/**
 * NextAuth API Route Handler
 *
 * Handles all NextAuth endpoints:
 * - GET  /api/auth/session
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - POST /api/auth/callback/credentials
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
export const runtime = "nodejs";
