import { useState, useEffect } from 'react';
import {
  initializeZKProofs,
  generateEligibilityProof,
  verifyEligibilityProof,
  getZKStatus
} from '../lib/zk-proof-service';

interface ZKProofGeneratorProps {
  onBack: () => void;
  studyId?: string;
  returnUrl?: string;
}

interface StudyCriteria {
  minAge?: number;
  maxAge?: number;
  requiredDiagnoses?: string[];
  biomarkerRanges?: Record<string, { min?: number; max?: number; unit: string }>;
}

export function ZKProofGenerator({ onBack, studyId, returnUrl }: ZKProofGeneratorProps) {
  // User-friendly inputs
  const [userAge, setUserAge] = useState('');

  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [proof, setProof] = useState<any>(null);
  const [publicInputs, setPublicInputs] = useState<any>(null);
  const [proofTime, setProofTime] = useState<number>(0);
  const [verificationTime, setVerificationTime] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zkStatus, setZkStatus] = useState(getZKStatus());
  const [studyCriteria, setStudyCriteria] = useState<StudyCriteria | null>(null);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAndInitializeZK();
    if (studyId) {
      loadStudyCriteria(studyId);
    }
  }, [studyId]);

  async function checkAndInitializeZK() {
    const status = getZKStatus();
    setZkStatus(status);

    if (!status.initialized) {
      setInitializing(true);
      try {
        await initializeZKProofs();
        setZkStatus(getZKStatus());
      } catch (err) {
        setError(`Failed to initialize ZK system: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setInitializing(false);
      }
    }
  }

  async function loadStudyCriteria(studyIdParam: string) {
    setLoadingCriteria(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_NEXTJS_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/studies/${studyIdParam}/criteria`);

      if (!response.ok) {
        throw new Error('Failed to load study criteria');
      }

      const data = await response.json();
      setStudyCriteria(data.criteria);

      // Don't auto-populate - let user enter their actual age
    } catch (err) {
      console.error('Error loading study criteria:', err);
      setError(err instanceof Error ? err.message : 'Failed to load study criteria');
    } finally {
      setLoadingCriteria(false);
    }
  }

  async function submitProofToStudy() {
    if (!studyId || !proof || !returnUrl) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_NEXTJS_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/studies/${studyId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          proof,
          publicInputs,
          proofTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit proof');
      }

      const result = await response.json();

      // Log activity
      await chrome.runtime.sendMessage({
        type: 'LOG_ACTIVITY',
        data: {
          type: 'STUDY_APPLICATION_SUBMITTED',
          details: {
            studyId,
            success: result.success,
            timestamp: Date.now()
          }
        }
      });

      // Redirect back to Next.js
      window.location.href = `${returnUrl}?proofSubmitted=true&studyId=${studyId}`;
    } catch (err) {
      console.error('Error submitting proof:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateProof() {
    // Validate user input
    if (!userAge.trim()) {
      setError('Please enter your age');
      return;
    }

    const age = parseInt(userAge.trim());
    if (isNaN(age) || age < 0 || age > 120) {
      setError('Please enter a valid age (0-120)');
      return;
    }

    // Validate against study criteria if available
    if (studyCriteria) {
      if (studyCriteria.minAge && age < studyCriteria.minAge) {
        setError(`You must be at least ${studyCriteria.minAge} years old for this study`);
        return;
      }
      if (studyCriteria.maxAge && age > studyCriteria.maxAge) {
        setError(`You must be ${studyCriteria.maxAge} years or younger for this study`);
        return;
      }
    }

    // Convert age to eligibility code (for the ZK circuit)
    const code = age.toString();

    setGenerating(true);
    setError(null);
    setProof(null);
    setPublicInputs(null);
    setVerificationResult(null);

    try {
      const result = await generateEligibilityProof(code);
      setProof(result.proof);
      setPublicInputs(result.publicInputs);
      setProofTime(result.timeMs);

      // Save proof to activity log
      await chrome.runtime.sendMessage({
        type: 'LOG_ACTIVITY',
        data: {
          type: 'ZK_PROOF_GENERATED',
          details: {
            age: age,
            studyId: studyId || 'manual',
            timeMs: result.timeMs,
            timestamp: Date.now()
          }
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proof');
    } finally {
      setGenerating(false);
    }
  }

  async function handleVerifyProof() {
    if (!proof || !publicInputs) {
      setError('No proof to verify');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const result = await verifyEligibilityProof(proof, publicInputs);
      setVerificationResult(result.valid);
      setVerificationTime(result.timeMs);

      // Save verification to activity log
      await chrome.runtime.sendMessage({
        type: 'LOG_ACTIVITY',
        data: {
          type: 'ZK_PROOF_VERIFIED',
          details: {
            valid: result.valid,
            timeMs: result.timeMs,
            timestamp: Date.now()
          }
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify proof');
    } finally {
      setVerifying(false);
    }
  }

  function copyProofToClipboard() {
    if (!proof) return;

    const proofData = {
      proof,
      publicInputs,
      generatedAt: Date.now(),
      age: userAge
    };

    navigator.clipboard.writeText(JSON.stringify(proofData, null, 2));
    alert('Proof copied to clipboard!');
  }

  if (initializing) {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={onBack} className="back-button">← Back</button>
          <h2>Generate ZK Proof</h2>
        </div>

        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Initializing ZK proof system...</p>
          <p className="hint">Loading WASM module and cryptographic keys</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-nav">
        <button onClick={onBack} className="back-button">← Back</button>
        <h2>Generate ZK Proof</h2>
      </div>

      {/* ZK System Status */}
      <div className="status-card">
        <div className="status-header">
          <span className={`status-indicator ${zkStatus.initialized ? 'active' : 'inactive'}`}></span>
          <span>ZK System: {zkStatus.initialized ? 'Ready' : 'Not Initialized'}</span>
        </div>
        <div className="status-details">
          <div className="status-item">
            <span>SRS Key:</span>
            <span>{zkStatus.srsLoaded ? '✅' : '❌'}</span>
          </div>
          <div className="status-item">
            <span>Proving Key:</span>
            <span>{zkStatus.pkLoaded ? '✅' : '❌'}</span>
          </div>
          <div className="status-item">
            <span>Verifying Key:</span>
            <span>{zkStatus.vkLoaded ? '✅' : '❌'}</span>
          </div>
        </div>
      </div>

      {/* Study Info (if coming from study application) */}
      {studyId && studyCriteria && (
        <div className="card info-card">
          <h3>📋 Study Application</h3>
          <p className="hint">Generating proof for Study #{studyId}</p>

          <div className="criteria-list">
            {studyCriteria.minAge && studyCriteria.maxAge && (
              <div className="criteria-item">
                <span className="criteria-label">Age Range:</span>
                <span className="criteria-value">{studyCriteria.minAge} - {studyCriteria.maxAge} years</span>
              </div>
            )}
            {studyCriteria.requiredDiagnoses && studyCriteria.requiredDiagnoses.length > 0 && (
              <div className="criteria-item">
                <span className="criteria-label">Required Diagnoses:</span>
                <span className="criteria-value">{studyCriteria.requiredDiagnoses.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="card">
        <h3>Your Age</h3>
        <p className="hint">
          {studyId
            ? `Enter your age to prove eligibility for this study (${studyCriteria?.minAge || '?'}-${studyCriteria?.maxAge || '?'} years)`
            : 'Enter your age to generate a zero-knowledge proof'}
        </p>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            Age (years)
          </label>
          <input
            type="number"
            value={userAge}
            onChange={(e) => setUserAge(e.target.value)}
            placeholder="e.g., 25, 30, 45"
            min="0"
            max="120"
            className="input"
            disabled={generating || !zkStatus.initialized || loadingCriteria}
            style={{ fontSize: '16px' }}
          />
        </div>

        <button
          onClick={handleGenerateProof}
          disabled={generating || !zkStatus.initialized || !userAge.trim() || loadingCriteria}
          className="button button-primary"
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {generating ? (
            <>
              <span className="spinner-small"></span>
              Generating Proof...
            </>
          ) : loadingCriteria ? (
            'Loading criteria...'
          ) : (
            '🔐 Generate Proof'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card error-card">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Proof Result */}
      {proof && (
        <div className="card success-card">
          <div className="proof-header">
            <h3>✅ Proof Generated</h3>
            <span className="proof-time">{proofTime}ms</span>
          </div>

          <div className="proof-details">
            <div className="detail-row">
              <span className="detail-label">Your Age:</span>
              <span className="detail-value">{userAge} years</span>
            </div>
            {studyCriteria && (
              <div className="detail-row">
                <span className="detail-label">Study Requirement:</span>
                <span className="detail-value">
                  {studyCriteria.minAge}-{studyCriteria.maxAge} years ✓
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Proof Size:</span>
              <span className="detail-value">{JSON.stringify(proof).length} bytes</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Generation Time:</span>
              <span className="detail-value">{proofTime}ms</span>
            </div>
          </div>

          <div className="button-group" style={{ marginTop: '1rem' }}>
            {studyId && returnUrl ? (
              <button
                onClick={submitProofToStudy}
                disabled={submitting}
                className="button button-primary"
                style={{ gridColumn: '1 / -1' }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Submitting to Study...
                  </>
                ) : (
                  '✅ Submit Application'
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleVerifyProof}
                  disabled={verifying}
                  className="button button-secondary"
                >
                  {verifying ? 'Verifying...' : '🔍 Verify Proof'}
                </button>
                <button
                  onClick={copyProofToClipboard}
                  className="button button-secondary"
                >
                  📋 Copy Proof
                </button>
              </>
            )}
          </div>

          {/* Verification Result */}
          {verificationResult !== null && (
            <div className={`verification-result ${verificationResult ? 'valid' : 'invalid'}`}>
              <div className="verification-icon">
                {verificationResult ? '✅' : '❌'}
              </div>
              <div className="verification-text">
                <strong>{verificationResult ? 'Proof Valid' : 'Proof Invalid'}</strong>
                <span>Verified in {verificationTime}ms</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="info">
        <p>
          <strong>What is a Zero-Knowledge Proof?</strong>
          <br />
          A ZK proof allows you to prove eligibility for clinical trials without revealing your actual health data. The proof is verified on-chain while your data stays private.
        </p>
      </div>

      <style>{`
        .loading-section {
          text-align: center;
          padding: 3rem 1rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .info-card {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .criteria-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .criteria-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border-radius: 6px;
          font-size: 14px;
        }

        .criteria-label {
          color: #6b7280;
          font-weight: 500;
        }

        .criteria-value {
          color: #111827;
          font-weight: 600;
        }

        .status-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .status-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.active {
          background-color: #10b981;
        }

        .status-indicator.inactive {
          background-color: #ef4444;
        }

        .status-details {
          display: grid;
          gap: 0.5rem;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #6b7280;
        }

        .spinner-small {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
        }

        .success-card {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .error-card {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }

        .proof-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .proof-time {
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        .proof-details {
          background: white;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .button-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .verification-result {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 6px;
          margin-top: 1rem;
        }

        .verification-result.valid {
          background: #d1fae5;
          border: 2px solid #10b981;
        }

        .verification-result.invalid {
          background: #fee2e2;
          border: 2px solid #ef4444;
        }

        .verification-icon {
          font-size: 32px;
        }

        .verification-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .verification-text strong {
          font-size: 16px;
        }

        .verification-text span {
          font-size: 14px;
          color: #6b7280;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
