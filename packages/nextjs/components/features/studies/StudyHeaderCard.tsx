/**
 * StudyHeaderCard Component
 *
 * Displays study header with title, status, description, and key stats
 */

'use client';

import { DollarSign, Users, Shield } from 'lucide-react';
import type { Study } from '@veritas/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/features/researcher';
import { getStatusColor } from '@/lib/helpers';

interface StudyHeaderCardProps {
  study: Study;
  verifiedApplicants: number;
}

export function StudyHeaderCard({ study, verifiedApplicants }: StudyHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-3xl mb-2">{study.title}</CardTitle>
            <CardDescription>Study ID: {study.id}</CardDescription>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
              study.status
            )}`}
          >
            {study.status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed mb-6">
          {study.description}
        </p>

        {/* Study Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Total Funding"
            value={`$${study.totalFunding || 0} USDC`}
            color="green"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Enrolled"
            value={`${study.participantCount || 0}/${study.maxParticipants || 0}`}
            color="blue"
          />
          <StatCard
            icon={<Shield className="h-5 w-5" />}
            label="Verified Applicants"
            value={verifiedApplicants}
            color="purple"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Remaining Budget"
            value={`$${study.remainingFunding || 0} USDC`}
            color="orange"
          />
        </div>
      </CardContent>
    </Card>
  );
}
