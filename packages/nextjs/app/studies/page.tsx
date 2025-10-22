/**
 * Public Studies Browse Page
 *
 * Shows all available clinical studies for browsing
 */

'use client';

import { motion } from 'framer-motion';
import { FlaskConical, Search } from 'lucide-react';
import { StudyList } from '@/components/features/studies';
import { AppHeader, AppFooter } from '@/components/layout';
import { fadeUpVariants, transitions } from '@/lib/animations';

export default function StudiesPage() {
  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={transitions.standard}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <FlaskConical className="h-10 w-10 text-primary" />
                Browse Clinical Studies
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Discover clinical trials and research studies you can participate in
              </p>
            </div>
          </div>

          {/* Search & Filters Section (Future Enhancement) */}
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 text-muted-foreground">
            <Search className="h-5 w-5" />
            <span className="text-sm">
              Showing all available studies. Advanced search and filters coming soon.
            </span>
          </div>
        </motion.div>

        {/* Studies List */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ ...transitions.standard, delay: 0.1 }}
        >
          <StudyList
            filters={{ status: 'recruiting' }}
            limit={50}
            showApplyButton={true}
            emptyMessage="No studies are currently recruiting. Check back soon!"
          />
        </motion.div>
        </div>
      </div>
      <AppFooter />
    </>
  );
}
