/**
 * Resume Banner Component
 *
 * Displays a banner when user resumes an incomplete study creation
 * Shows current progress and allows cancellation
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { StudyCreationStatus } from '@/stores/studyCreationStore';

interface ResumeBannerProps {
  status: StudyCreationStatus;
  currentStep: number;
  totalSteps: number;
  onCancel: () => void;
}

const STATUS_MESSAGES: Record<StudyCreationStatus, string> = {
  idle: 'Not started',
  draft: 'Draft saved',
  escrow: 'Creating escrow...',
  escrow_done: 'Escrow created',
  registry: 'Publishing to registry...',
  registry_done: 'Registry published',
  criteria: 'Setting criteria...',
  criteria_done: 'Criteria set',
  milestones: 'Adding milestones...',
  complete: 'Complete',
};

export function ResumeBanner({
  status,
  currentStep,
  totalSteps,
  onCancel,
}: ResumeBannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const progressPercentage = ((currentStep - 1) / totalSteps) * 100;

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="text-blue-900 dark:text-blue-100">
            Resuming Study Creation
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-2">
            <div>
              <strong>Status:</strong> {STATUS_MESSAGES[status]}
            </div>
            <div>
              <strong>Progress:</strong> Step {currentStep} of {totalSteps}
            </div>
            <Progress value={progressPercentage} className="mt-2 h-2" />
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancel Creation
        </Button>
      </div>
    </Alert>
  );
}
