/**
 * Clinic Portal - Patients List
 *
 * View all patients and their Health Identity SBT status
 * Filter and search functionality
 * Quick actions to issue SBTs
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Award,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { ClinicLayout } from '@/components/layout';

// --- Types ---

interface Patient {
  address: string;
  nillionDID?: string;
  hasSBT: boolean;
  sbtTokenId?: number;
  attestationsCount: number;
  lastActivity?: Date;
  createdAt: Date;
}

// Mock data - In production, this would come from API/blockchain
const MOCK_PATIENTS: Patient[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    nillionDID: 'did:nillion:abc123xyz789',
    hasSBT: true,
    sbtTokenId: 1,
    attestationsCount: 3,
    lastActivity: new Date('2025-10-12'),
    createdAt: new Date('2025-10-01'),
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    nillionDID: 'did:nillion:def456uvw012',
    hasSBT: true,
    sbtTokenId: 2,
    attestationsCount: 1,
    lastActivity: new Date('2025-10-13'),
    createdAt: new Date('2025-10-05'),
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    hasSBT: false,
    attestationsCount: 0,
    createdAt: new Date('2025-10-14'),
  },
];

// --- Component ---

export default function ClinicPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sbt' | 'no-sbt'>('all');

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    // Search filter
    const matchesSearch =
      patient.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.nillionDID?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'sbt' && patient.hasSBT) ||
      (filterStatus === 'no-sbt' && !patient.hasSBT);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalPatients = patients.length;
  const patientsWithSBT = patients.filter((p) => p.hasSBT).length;
  const totalAttestations = patients.reduce((sum, p) => sum + p.attestationsCount, 0);

  return (
    <ClinicLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/clinic"
              className="p-2 rounded-lg border border-border hover:bg-accent/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Patients</h1>
              <p className="text-muted-foreground mt-1">
                Manage patient Health Identity SBTs and attestations
              </p>
            </div>
          </div>

          <Link
            href="/clinic/issue"
            className="px-4 py-2 bg-gradient-to-r from-accent to-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Issue New SBT
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground">Total Patients</h3>
            </div>
            <p className="text-3xl font-bold">{totalPatients}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-sm text-muted-foreground">SBTs Issued</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{patientsWithSBT}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-sm text-muted-foreground">Total Attestations</h3>
            </div>
            <p className="text-3xl font-bold text-accent">{totalAttestations}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by address or DID..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Patients</option>
                <option value="sbt">With SBT</option>
                <option value="no-sbt">Without SBT</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Patients List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Patients Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Issue your first Health Identity SBT to get started'}
              </p>
              <Link
                href="/clinic/issue"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="h-5 w-5" />
                Issue First SBT
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${patient.hasSBT ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {patient.hasSBT ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm">
                              {patient.address.slice(0, 10)}...{patient.address.slice(-8)}
                            </p>
                            {patient.hasSBT && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                SBT #{patient.sbtTokenId}
                              </span>
                            )}
                          </div>
                          {patient.nillionDID && (
                            <p className="text-sm text-muted-foreground font-mono mt-1">
                              {patient.nillionDID.slice(0, 30)}...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground ml-11">
                        <span>
                          <strong>{patient.attestationsCount}</strong> attestations
                        </span>
                        <span>•</span>
                        <span>Created {patient.createdAt.toLocaleDateString()}</span>
                        {patient.lastActivity && (
                          <>
                            <span>•</span>
                            <span>
                              Last activity {patient.lastActivity.toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!patient.hasSBT && (
                        <Link
                          href={`/clinic/issue?patient=${patient.address}`}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium inline-flex items-center gap-2"
                        >
                          <Award className="h-4 w-4" />
                          Issue SBT
                        </Link>
                      )}
                      {patient.hasSBT && (
                        <button
                          className="px-4 py-2 border border-border rounded-lg hover:bg-accent/10 transition-colors text-sm font-medium"
                          onClick={() => {
                            /* TODO: Add attestation */
                          }}
                        >
                          Add Attestation
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h3 className="font-semibold mb-2">About Health Identity SBTs</h3>
          <p className="text-sm text-muted-foreground">
            Health Identity Soulbound Tokens (SBTs) are non-transferable credentials that link a
            patient's wallet address to their encrypted medical data in Nillion. Patients claim
            these SBTs by scanning a QR code you generate, ensuring they maintain full control over
            their health identity.
          </p>
        </motion.div>
      </div>
    </ClinicLayout>
  );
}
