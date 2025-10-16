/**
 * Fund Study Page
 *
 * Allows sponsors to browse and fund available clinical studies.
 * Shows study details, funding requirements, and deposit interface.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Beaker,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  Search,
  Filter,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useStudies } from '@/shared/hooks/useStudies';
import { toast } from 'sonner';

export default function FundStudyPage() {
  const router = useRouter();
  const { address, isConnected } = useAuth();
  const { studies, loading } = useStudies();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter studies that need funding
  const availableStudies = studies.filter(study =>
    study.status === 'Created' || study.status === 'Funding'
  ).filter(study =>
    searchQuery === '' ||
    study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    study.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudy || !fundingAmount) {
      toast.error('Please select a study and enter amount');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement funding transaction
      // This will call the ResearchFundingEscrow contract to deposit funds

      toast.success('Funding Successful!', {
        description: `Successfully funded ${fundingAmount} USDC to ${selectedStudy.title}`,
      });

      setSelectedStudy(null);
      setFundingAmount('');
    } catch (error) {
      console.error('Error funding study:', error);
      toast.error('Funding Failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground">
            Please connect your wallet to fund studies
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <button
            onClick={() => router.push('/sponsor')}
            className="text-sm text-muted-foreground hover:text-primary mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Fund a Clinical Study</h1>
              <p className="text-muted-foreground">
                Support groundbreaking research and make an impact
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search studies by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Studies Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading available studies...</p>
          </div>
        ) : availableStudies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Studies Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? 'No studies match your search. Try different keywords.'
                : 'There are currently no studies seeking funding. Check back later!'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedStudy(study)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Beaker className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{study.title}</h3>
                      <p className="text-sm text-muted-foreground">Study #{study.id}</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-warning/10 text-warning font-medium">
                    {study.status}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                  {study.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Max Participants
                    </span>
                    <span className="font-semibold">{study.maxParticipants || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Funding Needed
                    </span>
                    <span className="font-semibold text-primary">TBD USDC</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Created
                    </span>
                    <span className="font-semibold">
                      {new Date(study.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStudy(study);
                  }}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Fund This Study
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Funding Modal */}
        {selectedStudy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Fund Study</h2>
                  <p className="text-sm text-muted-foreground">{selectedStudy.title}</p>
                </div>
                <button
                  onClick={() => setSelectedStudy(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">About This Study</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudy.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Max Participants</span>
                    <span className="font-semibold">{selectedStudy.maxParticipants}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Status</span>
                    <span className="font-semibold text-warning">{selectedStudy.status}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleFund}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Funding Amount (USDC)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="number"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the amount you want to contribute to this study
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStudy(null)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-3 font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !fundingAmount}
                    className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Funding
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
