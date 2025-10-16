/**
 * Human Wallet Card Component
 * Displays wallet and Human Passport information similar to passport.xyz
 */

import { useState, useEffect } from 'react';

interface HumanWalletData {
  address: string;
  isVerified: boolean;
  humanityScore: number;
  method?: string;
  connectedAt?: number;
}

interface Props {
  address?: string | null;
  onDisconnect?: () => void;
}

export function HumanWalletCard({ address, onDisconnect }: Props) {
  const [walletData, setWalletData] = useState<HumanWalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadWalletData();
    } else {
      setLoading(false);
    }
  }, [address]);

  async function loadWalletData() {
    setLoading(true);
    try {
      const stored = await chrome.storage.local.get([
        'walletConnection',
        'isVerified',
        'verificationData'
      ]);

      if (stored.walletConnection) {
        setWalletData({
          address: stored.walletConnection.address,
          isVerified: stored.walletConnection.isVerified || stored.isVerified || false,
          humanityScore: stored.walletConnection.humanityScore || 0,
          method: stored.walletConnection.method,
          connectedAt: stored.walletConnection.connectedAt,
        });
      } else if (address) {
        // Fallback if no wallet connection but have address
        setWalletData({
          address,
          isVerified: stored.isVerified || false,
          humanityScore: stored.verificationData?.details?.score || 0,
        });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function getConnectionMethod() {
    if (!walletData?.method) return 'Web3';
    return walletData.method === 'web3' ? 'MetaMask/Web3' : walletData.method;
  }

  if (loading) {
    return (
      <div className="human-wallet-card loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  return (
    <div className="human-wallet-card">
      {/* Unified Row: Human Passport (left) | Connected Wallet (right) */}
      <div className="unified-row">
        <div className="unified-section">
          <span className="unified-label">Human Passport</span>
          <span className={`unified-status ${walletData.isVerified ? 'verified' : 'unverified'}`}>
            {walletData.isVerified ? '✓ Verified' : 'Not Verified'}
          </span>
        </div>
        <span className="unified-separator">|</span>
        <div className="unified-section">
          <span className="unified-label">Connected Wallet</span>
          <span className="unified-value" title={walletData.address}>
            {formatAddress(walletData.address)}
          </span>
        </div>
      </div>

      {/* Human Score Section (only if verified) */}
      {walletData.isVerified && (
        <div className="passport-score">
          <div className="score-circle">
            <div className="score-value">{walletData.humanityScore.toFixed(1)}</div>
            <div className="score-label">Score</div>
          </div>
          <div className="score-details">
            <div className="score-detail-item">
              <span className="detail-label">Humanity Score</span>
              <span className="detail-value">{walletData.humanityScore.toFixed(2)}</span>
            </div>
            <div className="score-detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value status-badge">
                {walletData.humanityScore >= 20 ? 'Eligible' : 'Needs More Stamps'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Not Verified CTA */}
      {!walletData.isVerified && (
        <div className="passport-cta-compact">
          <p>Verify your humanity to access clinical trials</p>
          <a
            href="https://app.passport.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="passport-verify-link"
          >
            Get Verified →
          </a>
        </div>
      )}

      {/* Disconnect Button with Method */}
      {onDisconnect && (
        <button onClick={onDisconnect} className="wallet-disconnect-btn-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px' }}>
            <path
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Disconnect</span>
          <span className="disconnect-method">{getConnectionMethod()}</span>
        </button>
      )}
    </div>
  );
}
