/**
 * AnonymousApplicantsCard Component
 *
 * Displays anonymous applicants section with privacy notice and verified count
 */

'use client';

import { Shield, Users } from 'lucide-react';
import type { Study } from '@veritas/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnonymousApplicantsCardProps {
  study: Study;
  verifiedApplicants: number;
}

export function AnonymousApplicantsCard({ study, verifiedApplicants }: AnonymousApplicantsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="mb-2">Anonymous Applicants</CardTitle>
            <CardDescription>
              All applicants verified using Zero-Knowledge Proofs
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">
              {verifiedApplicants}
            </p>
            <p className="text-sm text-muted-foreground">Verified Proofs</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Privacy Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Privacy Protected:</strong> Applicant identities are anonymous.
            Each has proven eligibility using cryptographic proofs without revealing
            personal information. Work with certified clinics to enroll eligible
            participants.
          </AlertDescription>
        </Alert>

        {/* Applicants List - Empty State */}
        {(!study.applications || study.applications.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted" />
            <p className="font-medium">No verified applicants yet</p>
            <p className="text-sm mt-2">
              Share your study link with potential participants
            </p>
          </div>
        )}

        {/* TODO: Implement applicants grid when applications API is ready */}
      </CardContent>
    </Card>
  );
}
