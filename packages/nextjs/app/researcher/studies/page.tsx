/**
 * Researcher Studies Management Page
 *
 * Displays all studies created by the connected researcher.
 * Shows study stats, applicant counts, and management options.
 * Follows clean architecture - uses StudyList component and hooks.
 */

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Beaker, TrendingUp, Users, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { ResearcherLayout } from '@/components/layout';
import { useStudiesByResearcher } from '@/shared/hooks/useStudies';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';

export default function ResearcherStudiesPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();

  // Fetch studies created by this researcher
  const { studies, isLoading, totalCount } = useStudiesByResearcher(address);

  // Calculate stats
  const activeStudies = studies.filter((s) => s.status === 'Active' || s.status === 'Created').length;

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
            <div className="space-y-4">
              {studies.map((study) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{study.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {study.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-success/10 border-success/20 text-success">
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {study.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Study ID</p>
                      <p className="text-sm font-medium">#{study.escrowId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Registry ID</p>
                      <p className="text-sm font-medium">#{study.registryId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Chain</p>
                      <p className="text-sm font-medium">
                        {study.chainId === 11155420 ? 'OP Sepolia' : `Chain ${study.chainId}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created</p>
                      <p className="text-sm font-medium">
                        {new Date(study.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Link
                      href={`/researcher/studies/${study.escrowId}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      View Details
                      <Users className="h-4 w-4" />
                    </Link>
                    <a
                      href={`https://sepolia-optimism.etherscan.io/tx/${study.escrowTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      View on Etherscan
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </ResearcherLayout>
  );
}
