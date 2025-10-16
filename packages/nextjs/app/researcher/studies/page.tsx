/**
 * Researcher Studies Management Page
 *
 * Displays all studies created by the connected researcher.
 * Shows study stats, applicant counts, and management options.
 * Follows clean architecture - uses StudyList component and hooks.
 */

'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Beaker, TrendingUp, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import { ResearcherLayout } from '@/components/layout';
import { StudyList } from '@/components/trials';
import { useStudiesByResearcher } from '@/shared/hooks/useStudies';
import { cn } from '@/shared/lib/utils';

export default function ResearcherStudiesPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Fetch studies created by this researcher
  const { studies, isLoading, totalCount } = useStudiesByResearcher(address);

  // Calculate stats
  const activeStudies = studies.filter((s) => s.status === 0).length;

  const handleViewStudyDetails = (studyId: bigint) => {
    router.push(`/researcher/studies/${studyId.toString()}`);
  };

  return (
    <ResearcherLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Beaker className="h-8 w-8 text-success" />
              My Clinical Studies
            </h1>
            <p className="text-muted-foreground">
              Manage your studies, view applicants, and track enrollment
            </p>
          </div>
          <Link
            href="/researcher/create-study"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create New Study
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Studies</h3>
            </div>
            <p className="text-3xl font-bold">{totalCount}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">Active Studies</h3>
            </div>
            <p className="text-3xl font-bold text-success">{activeStudies}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-accent/10 p-2">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Closed Studies
              </h3>
            </div>
            <p className="text-3xl font-bold text-accent">{totalCount - activeStudies}</p>
          </motion.div>
        </div>

        {/* Studies List */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading your studies...</p>
            </div>
          ) : studies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit">
                <Beaker className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Studies Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven&apos;t created any clinical studies yet. Create your first study to
                start recruiting participants.
              </p>
              <Link
                href="/researcher/create-study"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Your First Study
              </Link>
            </div>
          ) : (
            <StudyList
              showApplyButton={false}
              onApplyClick={handleViewStudyDetails}
              className="mt-0"
            />
          )}
        </motion.div>
      </div>
    </ResearcherLayout>
  );
}
