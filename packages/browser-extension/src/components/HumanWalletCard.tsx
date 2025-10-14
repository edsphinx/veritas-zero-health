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
      {/* Wallet Section */}
      <div className="wallet-section">
        <div className="wallet-header">
          <div className="wallet-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="wallet-info">
            <div className="wallet-label">Connected Wallet</div>
            <div className="wallet-address" title={walletData.address}>
              {formatAddress(walletData.address)}
            </div>
          </div>
        </div>
        <div className="wallet-method">{getConnectionMethod()}</div>
        {onDisconnect && (
          <button onClick={onDisconnect} className="wallet-disconnect-btn-full">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px' }}>
              <path
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Disconnect Wallet
          </button>
        )}
      </div>

      {/* Human Passport Section */}
      <div className="passport-section">
        <div className="passport-header">
          <div className="passport-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="passport-info">
            <div className="passport-label">Human Passport</div>
            <div className="passport-status">
              {walletData.isVerified ? (
                <span className="status-verified">
                  ✓ Verified Human
                </span>
              ) : (
                <span className="status-unverified">
                  Not Verified
                </span>
              )}
            </div>
          </div>
        </div>

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

        {!walletData.isVerified && (
          <div className="passport-cta">
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
      </div>
    </div>
  );
}
