/**
 * Researcher Study Detail Page
 *
 * Shows complete study information including participants, criteria, and blockchain data
 * Follows clean architecture with extracted components and semantic animations
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  MedicalCriteriaDisplay,
  StudyHeaderCard,
  BlockchainInfoCard,
  MilestonesCard,
  AnonymousApplicantsCard,
  StudyDetailLoadingSkeleton,
  StudyNotFoundState,
} from '@/components/features/studies';
import { useStudy } from '@/hooks/useStudy';
import { listContainerVariants, listItemVariants, transitions } from '@/lib/animations';
import { getVerifiedApplicantsCount } from '@/lib/study-helpers';
import { Button } from '@/components/ui/button';

export default function ResearcherStudyDetailPage() {
  const params = useParams();
  const studyId = params?.studyId as string;

  const { data: study, isLoading, error } = useStudy(studyId);

  // Loading State - extracted to component
  if (isLoading) {
    return <StudyDetailLoadingSkeleton />;
  }

  // Error State or Not Found - extracted to component
  if (error || !study) {
    return (
      <StudyNotFoundState
        message={error ? error.message : undefined}
        backUrl="/researcher/studies"
        backLabel="Back to My Studies"
      />
    );
  }

  // Business logic - moved to helper function
  const verifiedApplicants = getVerifiedApplicantsCount(study);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <motion.div
        variants={listItemVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.standard}
      >
        <Button asChild variant="ghost" size="sm">
          <Link href="/researcher/studies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Studies
          </Link>
        </Button>
      </motion.div>

      {/* Study Sections - staggered animations */}
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Study Header */}
        <motion.div variants={listItemVariants}>
          <StudyHeaderCard study={study} verifiedApplicants={verifiedApplicants} />
        </motion.div>

        {/* Blockchain Contracts & Transactions */}
        <motion.div variants={listItemVariants}>
          <BlockchainInfoCard study={study} />
        </motion.div>

        {/* Eligibility Criteria - now has its own Card wrapper */}
        {study.criteria && (
          <motion.div variants={listItemVariants}>
            <MedicalCriteriaDisplay criteria={study.criteria} />
          </motion.div>
        )}

        {/* Milestones */}
        <motion.div variants={listItemVariants}>
          <MilestonesCard milestones={study.milestones} />
        </motion.div>

        {/* Anonymous Applicants */}
        <motion.div variants={listItemVariants}>
          <AnonymousApplicantsCard study={study} verifiedApplicants={verifiedApplicants} />
        </motion.div>
      </motion.div>
    </div>
  );
}
