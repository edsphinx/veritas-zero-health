"use client";

/**
 * Session Provider Component
 *
 * Wraps the application with NextAuth SessionProvider
 * Must be a client component because SessionProvider uses React Context
 *
 * CRITICAL: Receives initial session from server for SSR hydration
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: ReactNode;
  session: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
