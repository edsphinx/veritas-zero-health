/**
 * MilestonesCard Component
 *
 * Displays study milestones with their descriptions and reward amounts
 */

'use client';

import type { Study } from '@veritas/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MilestonesCardProps {
  milestones: Study['milestones'];
}

export function MilestonesCard({ milestones }: MilestonesCardProps) {
  // Don't render if no milestones
  if (!milestones || milestones.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    {milestone.milestoneType}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {milestone.description}
                  </p>
                  <p className="text-green-600 font-bold">
                    ${milestone.rewardAmount} USDC
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
