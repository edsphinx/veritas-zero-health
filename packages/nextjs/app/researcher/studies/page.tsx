/**
 * Researcher Studies - List View
 *
 * Shows all studies created by the researcher
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, Beaker, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { StudyList } from '@/components/features/studies';
import { StatCard } from '@/components/features/researcher';
import { useAuth } from '@/hooks/useAuth';
import { useStudiesByResearcher } from '@/hooks/useStudies';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ResearcherStudiesPage() {
  const { user } = useAuth();
  const { data, error } = useStudiesByResearcher(user?.address);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.standard}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Beaker className="h-8 w-8 text-primary" />
              My Studies
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your clinical trials and track participant enrollment
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/researcher/create-study">
              <Plus className="h-5 w-5 mr-2" />
              Create Study
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      {data && data.studies.length > 0 && (
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ ...transitions.standard, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <StatCard
            icon={<Beaker className="h-5 w-5" />}
            label="Total Studies"
            value={data.studies.length}
            color="primary"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total Participants"
            value={data.studies.reduce((sum, s) => sum + s.participantCount, 0)}
            color="secondary"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Active Studies"
            value={data.studies.filter(s => s.status === 'recruiting' || s.status === 'active').length}
            color="accent"
          />
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load studies: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Studies List */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.2 }}
      >
        <StudyList
          filters={{ researcherId: user?.address }}
          limit={50}
          showApplyButton={false}
          emptyMessage="You haven't created any studies yet. Click 'Create Study' to get started."
        />
      </motion.div>
    </div>
  );
}
