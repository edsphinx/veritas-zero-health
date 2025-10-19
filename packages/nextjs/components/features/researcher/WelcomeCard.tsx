/**
 * WelcomeCard Component
 *
 * Displays the welcome message for the researcher portal
 */

'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function WelcomeCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="text-3xl">Researcher Portal</CardTitle>
        <CardDescription className="text-lg">
          Create and manage privacy-preserving clinical trials with zero-knowledge proof verification
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
