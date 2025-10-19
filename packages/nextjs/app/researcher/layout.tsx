/**
 * Researcher Portal Layout
 *
 * This layout wraps all pages under /researcher/*
 * Provides authentication, navigation, and consistent UI
 */

import { ResearcherLayout } from '@/components/layout';

export default function ResearcherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ResearcherLayout>{children}</ResearcherLayout>;
}
