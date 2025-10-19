/**
 * Progress Indicator Component
 *
 * Visual progress tracker for multi-step study creation wizard
 */

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: ProgressIndicatorProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const step = index + 1;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      step < currentStep
                        ? 'bg-success border-success text-success-foreground'
                        : step === currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {step < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{step}</span>
                    )}
                  </div>
                  <p className="text-xs mt-2 text-center">
                    {stepLabels[index]}
                  </p>
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      step < currentStep ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
