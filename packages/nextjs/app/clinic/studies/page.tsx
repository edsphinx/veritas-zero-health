'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { FlaskConical, Users, CheckCircle, Clock } from 'lucide-react';
import { ClinicLayout } from '@/components/layout';

interface Study {
  id: number;
  title: string;
  description: string;
  status: string;
  participantCount: number;
  maxParticipants: number;
  milestones: { id: number; status: string }[];
}

export default function ClinicStudiesPage() {
  const { address, isConnected } = useAccount();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);

      // TODO: Fetch from ResearchFundingEscrow contract
      // For now, mock data
      const mockStudies: Study[] = [
        {
          id: 1,
          title: 'Type 2 Diabetes Treatment Study',
          description:
            '12-month study testing new medication for Type 2 Diabetes.',
          status: 'Active',
          participantCount: 3,
          maxParticipants: 40,
          milestones: [
            { id: 1, status: 'Pending' },
            { id: 2, status: 'Pending' },
            { id: 3, status: 'Pending' },
          ],
        },
        {
          id: 2,
          title: 'Hypertension Medication Trial',
          description: 'Testing new blood pressure medication with minimal side effects.',
          status: 'Active',
          participantCount: 2,
          maxParticipants: 50,
          milestones: [
            { id: 4, status: 'Pending' },
            { id: 5, status: 'Pending' },
          ],
        },
      ];

      setStudies(mockStudies);
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-green-100 text-green-800 border-green-200',
      Funding: 'bg-blue-100 text-blue-800 border-blue-200',
      Completed: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isConnected) {
    return (
      <ClinicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the clinic dashboard
            </p>
          </div>
        </div>
      </ClinicLayout>
    );
  }

  return (
    <ClinicLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Active Studies</h1>
        <p className="text-gray-600">
          Manage participants and verify milestone completion
        </p>
      </div>

      {/* Studies Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading studies...</p>
        </div>
      ) : studies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FlaskConical className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No studies assigned to your clinic</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studies.map((study) => (
            <div
              key={study.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Study Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900 flex-1">
                    {study.title}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      study.status
                    )}`}
                  >
                    {study.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {study.description}
                </p>
              </div>

              {/* Study Stats */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-blue-600 font-semibold">
                        Participants
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {study.participantCount}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <p className="text-xs text-purple-600 font-semibold">
                        Milestones
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {study.milestones.length}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <Link
                  href={`/clinic/studies/${study.id}`}
                  className="block w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Manage Study
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </ClinicLayout>
  );
}
