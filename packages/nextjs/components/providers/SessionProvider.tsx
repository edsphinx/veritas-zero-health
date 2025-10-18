"use client";

/**
 * Session Provider Component
 *
 * Wraps the application with NextAuth SessionProvider
 * Must be a client component because SessionProvider uses React Context
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
