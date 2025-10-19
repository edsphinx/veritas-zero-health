/**
 * Study Not Found State
 *
 * Reusable empty/error state for study detail pages
 * Shows when study doesn't exist or user lacks access
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeUpVariants, transitions } from '@/lib/animations';

interface StudyNotFoundStateProps {
  /** Error message or reason why study wasn't found */
  message?: string;
  /** URL to return to (defaults to researcher studies list) */
  backUrl?: string;
  /** Label for back button */
  backLabel?: string;
}

export function StudyNotFoundState({
  message = "This study doesn't exist or you don't have access to it.",
  backUrl = '/researcher/studies',
  backLabel = 'Back to Studies',
}: StudyNotFoundStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.standard}
        className="text-center max-w-md"
      >
        <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Study Not Found</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button asChild>
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
