/**
 * Passport Verification Component
 * Shows user's Human Passport status and eligibility for Health Identity
 */

import { useState, useEffect } from 'react';
import { passportClient, type PassportVerification, type PassportScore } from '../lib/passport-client';

interface Props {
  address: string;
  onVerified?: (verification: PassportVerification) => void;
  minScore?: number;
  useDoubleVerification?: boolean;
}

export function PassportVerificationCard({ address, onVerified, minScore = 50, useDoubleVerification = true }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<PassportVerification | null>(null);
  const [score, setScore] = useState<PassportScore | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);

  useEffect(() => {
    checkVerification();
  }, [address]);

  async function checkVerification(forceRefresh = false) {
    setLoading(true);
    setError(null);

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await getCachedVerification(address);
        if (cached) {
          const minutesAgo = Math.floor((Date.now() - cached.timestamp) / 60000);
          console.log(`✅ Using cached verification data (${minutesAgo} min ago)`);
          setVerification(cached.verification);
          setScore(cached.score);
          setCacheTimestamp(cached.timestamp);

          // Notify parent if verified
          if (cached.verification.verified && onVerified) {
            onVerified(cached.verification);
          }

          setLoading(false);
          return;
        }
      }

      console.log('🔄 Fetching fresh verification data from API...');

      // Get verification status
      const verificationData = await passportClient.verifyEligibility(address, {
        doubleVerify: useDoubleVerification,
        minStampScore: minScore,
        minModelScore: 60,
      });

      setVerification(verificationData);

      // Get detailed score
      const scoreData = await passportClient.getScore(address);
      setScore(scoreData);

      // Cache the results
      const timestamp = Date.now();
      await cacheVerification(address, verificationData, scoreData);
      setCacheTimestamp(timestamp);

      // Notify parent if verified
      if (verificationData.verified && onVerified) {
        onVerified(verificationData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check verification');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Get cached verification data if it exists and is still valid (< 1 hour old)
   *
   * Why 1 hour? Human Passport has ~25 API calls/hour limit.
   * With 1 hour cache, worst case = 2 calls/hour (verify + getScore)
   */
  async function getCachedVerification(addr: string): Promise<{ verification: PassportVerification; score: PassportScore; timestamp: number } | null> {
    try {
      const key = `passport_cache_${addr.toLowerCase()}`;
      const stored = await chrome.storage.local.get([key]);

      if (!stored[key]) {
        return null;
      }

      const cache = stored[key];
      const now = Date.now();
      const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (respects API rate limits)

      // Check if cache is still valid
      if (now - cache.timestamp < CACHE_DURATION) {
        return {
          verification: cache.verification,
          score: cache.score,
          timestamp: cache.timestamp
        };
      }

      // Cache expired
      return null;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Cache verification data with timestamp
   */
  async function cacheVerification(addr: string, verification: PassportVerification, score: PassportScore): Promise<void> {
    try {
      const key = `passport_cache_${addr.toLowerCase()}`;
      await chrome.storage.local.set({
        [key]: {
          verification,
          score,
          timestamp: Date.now()
        }
      });
      console.log('💾 Cached verification data');
    } catch (error) {
      console.warn('Failed to cache verification:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await checkVerification(true); // Force refresh, bypass cache
    setRefreshing(false);
  }

  function openPassport() {
    window.open('https://app.passport.xyz', '_blank');
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Checking Passport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card error-card">
        <div className="error-icon">⚠️</div>
        <h3>Verification Error</h3>
        <p>{error}</p>
        <button onClick={() => checkVerification()} className="button button-secondary">
          Try Again
        </button>
      </div>
    );
  }

  if (!verification || !score) {
    return null;
  }

  const currentScore = verification.details.stampScore || verification.details.score || 0;
  const scorePercentage = Math.min((currentScore / minScore) * 100, 100);

  if (verification.verified) {
    return (
      <div className="card success-card">
        <div className="verification-header">
          <div className="verification-icon">✅</div>
          <div>
            <h3>Verified Human!</h3>
            <p className="verification-subtitle">Eligible for Health Identity</p>
          </div>
        </div>

        <div className="score-display">
          <div className="score-value">{currentScore.toFixed(1)}</div>
          <div className="score-label">
            Passport Score
            <span className="score-threshold">(Required: {minScore})</span>
          </div>
        </div>

        {useDoubleVerification && verification.details.modelScore !== undefined && (
          <div className="model-score">
            <div className="model-score-label">ML Model Score:</div>
            <div className="model-score-value">
              {verification.details.modelScore === -1 ? 'Insufficient data' : `${verification.details.modelScore}/100`}
            </div>
          </div>
        )}

        <div className="verification-details">
          <div className="detail-item">
            <span>✓ Stamps Verification</span>
            <span className="detail-value">Passed</span>
          </div>
          {useDoubleVerification && verification.details.modelPass !== undefined && (
            <div className="detail-item">
              <span>{verification.details.modelPass ? '✓' : '✗'} ML Model</span>
              <span className="detail-value">{verification.details.modelPass ? 'Passed' : 'Failed'}</span>
            </div>
          )}
          <div className="detail-item">
            <span>Last Updated</span>
            <span className="detail-value">{new Date(score.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        <button onClick={handleRefresh} disabled={refreshing} className="button button-secondary">
          {refreshing ? 'Refreshing...' : '🔄 Refresh Score'}
        </button>

        {cacheTimestamp && (
          <p className="hint" style={{ marginTop: '8px', textAlign: 'center' }}>
            Last updated: {new Date(cacheTimestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  // Not verified
  return (
    <div className="card warning-card">
      <div className="verification-header">
        <div className="verification-icon">⚠️</div>
        <div>
          <h3>Verification Required</h3>
          <p className="verification-subtitle">Need Human Passport to continue</p>
        </div>
      </div>

      <div className="score-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${scorePercentage}%` }}></div>
        </div>
        <div className="progress-labels">
          <span>Current: {currentScore.toFixed(1)}</span>
          <span>Required: {minScore}</span>
        </div>
        <div className="progress-missing">
          Need {(minScore - currentScore).toFixed(1)} more points
        </div>
      </div>

      <div className="verification-requirements">
        <h4>Why do I need this?</h4>
        <p>
          Medical-grade verification requires a Human Passport score of {minScore}+ to ensure you're a unique human and
          prevent fraud in clinical trials.
        </p>

        <h4>Quick ways to reach {minScore}:</h4>
        <ul className="requirements-list">
          <li>
            <strong>Government ID</strong> (30) + <strong>Phone</strong> (15) = 45 points
            <br />
            <span className="hint">+ any social stamp to reach {minScore}</span>
          </li>
          <li>
            <strong>Biometrics</strong> (25) + <strong>Phone</strong> (15) + <strong>Discord</strong> (5) +{' '}
            <strong>Google</strong> (3) = 48 points
          </li>
          <li>
            <strong>Multiple stamps:</strong> GitHub (8) + ENS (5) + NFT (5) + ETH Activity (10) + Socials (15+) = 48+
          </li>
        </ul>
      </div>

      <div className="button-group">
        <button onClick={openPassport} className="button button-primary">
          Get Verified at Human Passport
        </button>
        <button onClick={handleRefresh} disabled={refreshing} className="button button-secondary">
          {refreshing ? 'Checking...' : 'I Already Have Stamps'}
        </button>
      </div>

      <p className="hint">
        After collecting stamps, wait 60 seconds then click "I Already Have Stamps" to refresh your score.
      </p>

      {cacheTimestamp && (
        <p className="hint" style={{ marginTop: '8px', textAlign: 'center' }}>
          Last checked: {new Date(cacheTimestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
