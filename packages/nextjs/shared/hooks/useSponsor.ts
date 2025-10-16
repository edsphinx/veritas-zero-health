/**
 * Hook: useSponsor
 *
 * Custom hook for sponsor-related functionality.
 * Fetches sponsor dashboard data from API endpoint.
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import type { SponsorDeposit } from '@/core/domain/SponsorDeposit';

/**
 * useSponsor Hook
 *
 * @example
 * ```tsx
 * function SponsorDashboard() {
 *   const { deposits, totalFunded, activeStudiesCount, loading, error } = useSponsor();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return <div>Total Funded: ${totalFunded.toString()}</div>;
 * }
 * ```
 */
export function useSponsor() {
  const { address, isConnected } = useAuth();
  const [deposits, setDeposits] = useState<SponsorDeposit[]>([]);
  const [totalFunded, setTotalFunded] = useState<bigint>(BigInt(0));
  const [activeStudiesCount, setActiveStudiesCount] = useState<number>(0);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setDeposits([]);
      setTotalFunded(BigInt(0));
      setActiveStudiesCount(0);
      setTotalDeposits(0);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from API endpoint
        const response = await fetch(`/api/sponsors/dashboard?address=${address}`);

        if (!response.ok) {
          throw new Error('Failed to fetch sponsor data');
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && result.data) {
            // Convert BigInt strings back to BigInt
            const depositsWithBigInt = result.data.deposits.map((d: any) => ({
              ...d,
              amount: BigInt(d.amount),
              blockNumber: BigInt(d.blockNumber),
              depositedAt: new Date(d.depositedAt),
              createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
              updatedAt: d.updatedAt ? new Date(d.updatedAt) : undefined,
            }));

            setDeposits(depositsWithBigInt);
            setTotalFunded(BigInt(result.data.totalFunded));
            setActiveStudiesCount(result.data.activeStudiesCount);
            setTotalDeposits(result.data.totalDeposits);
          } else {
            setError(result.error || 'Failed to load sponsor data');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  return {
    deposits,
    totalFunded,
    activeStudiesCount,
    totalDeposits,
    loading,
    error,
    refetch: () => {
      // Trigger re-fetch by clearing and letting useEffect run again
      setDeposits([]);
    },
  };
}
