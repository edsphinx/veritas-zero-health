/**
 * RecentActivityCard Component
 *
 * Displays recent activity or empty state for researcher dashboard
 */

'use client';

import Link from 'next/link';
import { Beaker, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function RecentActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Beaker className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No studies created yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Get started by creating your first clinical trial. Define eligibility criteria and start recruiting participants.
          </p>
          <Button asChild size="lg">
            <Link href="/researcher/create-study">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Study
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
