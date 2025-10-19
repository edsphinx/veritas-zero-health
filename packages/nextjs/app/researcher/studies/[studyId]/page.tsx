/**
 * Researcher Study Detail Page
 *
 * Shows complete study information including participants, criteria, and blockchain data
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Beaker,
  Shield,
} from 'lucide-react';
import {
  MedicalCriteriaDisplay,
  StudyHeaderCard,
  BlockchainInfoCard,
  MilestonesCard,
  AnonymousApplicantsCard,
} from '@/components/features/studies';
import { useStudy } from '@/hooks/useStudy';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResearcherStudyDetailPage() {
  const params = useParams();
  const studyId = params?.studyId as string;

  const { data: study, isLoading, error } = useStudy(studyId);

  // Loading State
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full mb-4" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State or Not Found
  if (error || !study) {
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
          <p className="text-muted-foreground mb-6">
            {error ? error.message : "This study doesn't exist or you don't have access to it."}
          </p>
          <Button asChild>
            <Link href="/researcher/studies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Studies
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const verifiedApplicants = study.applications?.filter((app) => app.proofVerified).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <motion.div
        variants={fadeUpVariants}
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

      {/* Study Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.1 }}
      >
        <StudyHeaderCard study={study} verifiedApplicants={verifiedApplicants} />
      </motion.div>

      {/* Blockchain Contracts & Transactions */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.2 }}
      >
        <BlockchainInfoCard study={study} />
      </motion.div>

      {/* Eligibility Criteria */}
      {study.criteria && (
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ ...transitions.standard, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Eligibility Criteria</h2>
              </div>
            </CardHeader>
            <CardContent>
              <MedicalCriteriaDisplay criteria={study.criteria} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Milestones */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.4 }}
      >
        <MilestonesCard milestones={study.milestones} />
      </motion.div>

      {/* Anonymous Applicants */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.5 }}
      >
        <AnonymousApplicantsCard study={study} verifiedApplicants={verifiedApplicants} />
      </motion.div>
    </div>
  );
}
