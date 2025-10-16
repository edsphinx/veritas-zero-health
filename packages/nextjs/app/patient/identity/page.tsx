/**
 * Patient Portal - Health Identity View
 *
 * Displays the patient's Health Identity SBT information using clean architecture.
 * All blockchain operations are handled through the service layer.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { PatientLayout } from '@/components/layout';
import { useHealthIdentity } from '@/shared/hooks/useHealthIdentity';
import { useAuth } from '@/shared/hooks/useAuth';

export default function PatientIdentityPage() {
  const { address, isConnected } = useAuth();
  const [showClaimInstructions, setShowClaimInstructions] = useState(false);

  // Use clean hook that calls service layer
  const { hasIdentity, identity, attestations, isLoading, refetch } = useHealthIdentity({
    address,
    enabled: isConnected,
  });

  // --- Render States ---

  if (!isConnected || !address) {
    return (
      <PatientLayout>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Wallet Not Connected</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your Health Identity
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (isLoading) {
    return (
      <PatientLayout>
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Loading Identity...</h2>
            <p className="text-muted-foreground">
              Checking your Health Identity status on-chain
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  // No Health Identity SBT
  if (!hasIdentity) {
    return (
      <PatientLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Link
              href="/patient"
              className="p-2 rounded-lg border border-border hover:bg-accent/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Health Identity</h1>
              <p className="text-muted-foreground mt-1">
                Your verifiable health credentials on-chain
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <Award className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No Health Identity SBT</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You haven't claimed your Health Identity Soulbound Token yet. Ask your medical
              provider to issue you a voucher, then scan the QR code with the DASHI extension.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowClaimInstructions(!showClaimInstructions)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center justify-center gap-2"
              >
                <QrCode className="h-5 w-5" />
                How to Claim
              </button>
            </div>

            {showClaimInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 p-6 bg-accent/5 rounded-lg text-left"
              >
                <h3 className="font-semibold mb-4">Claiming Your Health Identity SBT</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary flex-shrink-0">1.</span>
                    <span>Visit your medical provider and request a Health Identity SBT voucher</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary flex-shrink-0">2.</span>
                    <span>Open the DASHI browser extension</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary flex-shrink-0">3.</span>
                    <span>Click "Scan QR Code" in the extension menu</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary flex-shrink-0">4.</span>
                    <span>Scan the QR code provided by your provider</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-primary flex-shrink-0">5.</span>
                    <span>Confirm the transaction to claim your SBT</span>
                  </li>
                </ol>
              </motion.div>
            )}
          </motion.div>
        </div>
      </PatientLayout>
    );
  }

  // Has Health Identity SBT
  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link
            href="/patient"
            className="p-2 rounded-lg border border-border hover:bg-accent/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Health Identity</h1>
            <p className="text-muted-foreground mt-1">
              Your verifiable health credentials on-chain
            </p>
          </div>
        </motion.div>

        {/* Health Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-green-100">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">Health Identity Active</h2>
                <p className="text-green-700">Soulbound Token Verified</p>
              </div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>

          {identity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Nillion DID</p>
                <p className="font-mono text-sm break-all">{identity.nillionDID}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="font-medium">
                  {new Date(Number(identity.createdAt) * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Attestations</p>
                <p className="text-2xl font-bold text-green-600">
                  {Number(identity.attestationCount)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium text-green-600">
                  {identity.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Attestations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Medical Data Attestations</h2>

          {attestations.length > 0 ? (
            <div className="space-y-3">
              {attestations.map((hash, index) => (
                <div
                  key={hash}
                  className="p-4 rounded-lg border border-border bg-accent/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Attestation #{index + 1}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {hash.slice(0, 10)}...{hash.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No attestations yet. Medical providers can attest to your health data.
              </p>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <Link
            href="/patient/records"
            className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent/10 transition-colors font-medium text-center"
          >
            View Medical Records
          </Link>
          <Link
            href="/studies"
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-center"
          >
            Browse Clinical Studies
          </Link>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
