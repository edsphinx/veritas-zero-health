/**
 * Clinic Portal - Issue Health Identity SBT
 *
 * This page allows clinics to:
 * 1. Register a new patient
 * 2. Upload medical records to Nillion
 * 3. Generate a signed voucher for the patient to claim their Health Identity SBT
 * 4. Display QR code for patient to scan with browser extension
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  Award,
  User,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { ClinicLayout } from '@/components/layout';

// --- Types ---

interface VoucherData {
  patientAddress: string;
  nillionDID: string;
  expiresAt: number;
  voucherNonce: number;
  signature: string;
  providerAddress: string;
  sbtContractAddress: string;
  chainId: number;
}

interface VoucherResponse {
  success: boolean;
  voucher?: VoucherData;
  qrCode?: string;
  expiresAtISO?: string;
  error?: string;
}

// --- Component ---

export default function IssueHealthIdentitySBT() {
  const { address: connectedAddress } = useAccount();

  // Form state
  const [patientAddress, setPatientAddress] = useState('');
  const [nillionDID, setNillionDID] = useState('');
  const [expiresIn, setExpiresIn] = useState(86400); // 24 hours default

  // UI state
  const [step, setStep] = useState<'form' | 'generating' | 'success'>('form');
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- Handlers ---

  const handleGenerateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('generating');

    try {
      const response = await fetch('/api/clinic/voucher/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientAddress,
          nillionDID: nillionDID || `did:nillion:${patientAddress.slice(2, 10)}`,
          expiresIn,
        }),
      });

      const data: VoucherResponse = await response.json();

      if (!data.success || !data.voucher || !data.qrCode) {
        throw new Error(data.error || 'Failed to generate voucher');
      }

      setVoucher(data.voucher);
      setQrCode(data.qrCode);
      setExpirationDate(data.expiresAtISO || null);
      setStep('success');
    } catch (err) {
      console.error('Error generating voucher:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStep('form');
    }
  };

  const handleCopyVoucher = async () => {
    if (!voucher) return;

    const voucherJSON = JSON.stringify(
      {
        type: 'VERITAS_HEALTH_IDENTITY_SBT',
        version: '1.0',
        data: voucher,
      },
      null,
      2
    );

    await navigator.clipboard.writeText(voucherJSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPatientAddress('');
    setNillionDID('');
    setVoucher(null);
    setQrCode(null);
    setExpirationDate(null);
    setError(null);
    setStep('form');
  };

  // --- Render ---

  return (
    <ClinicLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold">Issue Health Identity SBT</h1>
              <p className="text-muted-foreground mt-1">
                Generate a voucher for a patient to claim their Soulbound Token
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleGenerateVoucher} className="space-y-6">
              {/* Patient Information Card */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Patient Information</h2>
                    <p className="text-sm text-muted-foreground">
                      Enter the patient's wallet address and Nillion DID
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Patient Address */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Patient Wallet Address *
                    </label>
                    <input
                      type="text"
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      placeholder="0x..."
                      required
                      pattern="^0x[a-fA-F0-9]{40}$"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The Ethereum address that will receive the SBT
                    </p>
                  </div>

                  {/* Nillion DID */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nillion DID (Optional)
                    </label>
                    <input
                      type="text"
                      value={nillionDID}
                      onChange={(e) => setNillionDID(e.target.value)}
                      placeholder="did:nillion:..."
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to auto-generate from patient address
                    </p>
                  </div>

                  {/* Expiration Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Voucher Expiration
                    </label>
                    <select
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value={3600}>1 hour</option>
                      <option value={21600}>6 hours</option>
                      <option value={43200}>12 hours</option>
                      <option value={86400}>24 hours (recommended)</option>
                      <option value={172800}>48 hours</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How long the voucher will be valid
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!patientAddress || !connectedAddress}
                className="w-full px-6 py-4 bg-gradient-to-r from-accent to-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Award className="h-5 w-5" />
                Generate Voucher & QR Code
              </button>

              {!connectedAddress && (
                <p className="text-sm text-center text-muted-foreground">
                  Please connect your wallet to continue
                </p>
              )}
            </form>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Generating Voucher...</h2>
            <p className="text-muted-foreground">
              Creating signed voucher and QR code for patient
            </p>
          </motion.div>
        )}

        {step === 'success' && voucher && qrCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Message */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Voucher Generated Successfully</p>
                <p className="text-sm text-green-700 mt-1">
                  Patient can now scan the QR code with the DASHI browser extension to claim
                  their Health Identity SBT
                </p>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Patient QR Code</h2>
                  <p className="text-sm text-muted-foreground">
                    Have the patient scan this code with the DASHI extension
                  </p>
                </div>
              </div>

              {/* QR Code Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-white rounded-xl border-2 border-border">
                  <img src={qrCode} alt="SBT Voucher QR Code" className="w-80 h-80" />
                </div>

                {/* Expiration Info */}
                {expirationDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires: {new Date(expirationDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Voucher Details */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Voucher Details</h3>
                <button
                  onClick={handleCopyVoucher}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-accent/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Patient Address</span>
                  <span className="font-mono">{voucher.patientAddress.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Nillion DID</span>
                  <span className="font-mono">{voucher.nillionDID.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-mono">{voucher.providerAddress.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Nonce</span>
                  <span className="font-mono">{voucher.voucherNonce}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Chain</span>
                  <span>{voucher.chainId === 11155420 ? 'Optimism Sepolia' : `Chain ${voucher.chainId}`}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent/10 transition-colors font-medium"
              >
                Issue Another SBT
              </button>
              <Link
                href="/clinic/patients"
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-center"
              >
                View All Patients
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </ClinicLayout>
  );
}
