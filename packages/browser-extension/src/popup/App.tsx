import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { PassportVerificationCard } from '../components/PassportVerification';
import { PoweredBy } from '../components/PoweredBy';
import { QRScanner } from '../components/QRScanner';
import { HumanWalletCard } from '../components/HumanWalletCard';
import { SBTService } from '../lib/sbt-service';
import type { PassportVerification } from '../lib/passport-client';

interface DIDDocument {
  id: string;
  publicKey: string;
  created: number;
  updated: number;
}

interface ActivityLog {
  type: string;
  timestamp: number;
  details: any;
}

interface VoucherData {
  type: string;
  version: string;
  data: {
    patientAddress: string;
    nillionDID: string;
    expiresAt: number;
    voucherNonce: number;
    signature: string;
    providerAddress: string;
    sbtContractAddress: string;
    chainId: number;
  };
}

interface WalletConnection {
  origin?: string;
  address?: string;
  method?: string;
  isVerified?: boolean;
  humanityScore?: number;
  connectedAt?: number;
  isConnected?: boolean;
}

function App() {
  const [did, setDid] = useState<DIDDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'main' | 'setup' | 'data' | 'permissions' | 'activity' | 'wallet-connect' | 'passport-verification' | 'scan-qr' | 'claim-sbt'>('main');
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);

  useEffect(() => {
    checkDID();
    loadActivityLog();
    loadStoredData();
    loadWalletConnection();
  }, []);

  async function loadStoredData() {
    try {
      const stored = await chrome.storage.local.get(['ethAddress', 'isVerified']);
      if (stored.ethAddress) {
        setEthAddress(stored.ethAddress);
      }
      if (stored.isVerified) {
        setIsVerified(stored.isVerified);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  async function loadWalletConnection() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_WALLET_CONNECTION' });
      if (response.success && response.data.isConnected) {
        setWalletConnection(response.data);
        if (response.data.address) {
          setEthAddress(response.data.address);
        }
        if (response.data.isVerified) {
          setIsVerified(response.data.isVerified);
        }
      }
    } catch (error) {
      console.error('Error loading wallet connection:', error);
    }
  }

  async function handleDisconnectWallet() {
    try {
      // Clear extension state
      await chrome.runtime.sendMessage({ type: 'DISCONNECT_WALLET' });

      // Clear local storage state
      await chrome.storage.local.remove([
        'walletConnection',
        'ethAddress',
        'isVerified',
        'verificationData',
        'verification_complete',
        'verification_timestamp'
      ]);

      // Reset UI state
      setWalletConnection(null);
      setEthAddress(null);
      setIsVerified(false);

      // Go back to wallet connect view
      setView('wallet-connect');

      await loadActivityLog();

      console.log('🔌 Wallet disconnected and state cleared');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  async function checkDID() {
    setLoading(true);
    try {
      // Check if DID exists
      const response = await chrome.runtime.sendMessage({ type: 'HAS_DID' });

      if (response.success && response.data.hasDID) {
        // Load DID
        const didResponse = await chrome.runtime.sendMessage({ type: 'GET_DID' });
        if (didResponse.success) {
          setDid(didResponse.data);
        }

        // Load complete verification state from storage
        const stored = await chrome.storage.local.get([
          'ethAddress',
          'isVerified',
          'verificationData',
          'verification_complete',
          'walletConnection'
        ]);

        console.log('📦 Loaded state from storage:', {
          hasWallet: !!stored.ethAddress,
          isVerified: !!stored.isVerified,
          verificationComplete: !!stored.verification_complete,
          hasWalletConnection: !!stored.walletConnection
        });

        // Update local state
        if (stored.ethAddress) {
          setEthAddress(stored.ethAddress);
        }

        if (stored.isVerified) {
          setIsVerified(true);
        }

        // Determine view based on state
        // If verification is complete, go straight to main
        if (stored.verification_complete && stored.isVerified && stored.ethAddress) {
          console.log('✅ Already verified, going to main view');
          setView('main');
        } else if (!stored.ethAddress) {
          // No wallet connected yet
          setView('wallet-connect');
        } else if (!stored.isVerified) {
          // Wallet connected but not verified
          setView('passport-verification');
        } else {
          // Everything good
          setView('main');
        }
      } else {
        // No DID yet, show setup
        setView('setup');
      }
    } catch (error) {
      console.error('Error checking DID:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivityLog() {
    try {
      const stored = await chrome.storage.local.get(['activityLog']);
      setActivityLog((stored.activityLog || []).reverse());
    } catch (error) {
      console.error('Error loading activity log:', error);
    }
  }

  async function handleCreateDID() {
    if (!password || password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_DID',
        data: { password },
      });

      if (response.success) {
        setDid(response.data);
        setView('wallet-connect');
        setPassword('');
        await loadActivityLog();
      } else {
        alert('Error creating DID: ' + response.error);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectWallet() {
    try {
      setLoading(true);

      // Web app configuration
      const webAppUrl = 'http://localhost:3000';
      const webAppDomain = 'localhost:3000';

      // Store extension ID so web app can communicate back
      const extensionId = chrome.runtime.id;
      await chrome.storage.local.set({ veritas_extension_id: extensionId });

      // First, check if wallet is already connected in the web app
      console.log('🔍 Checking if wallet already connected...');

      try {
        const statusResponse = await fetch(`${webAppUrl}/api/extension/wallet/status`, {
          credentials: 'include', // Include cookies
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          if (statusData.success && statusData.data.connected) {
            // Wallet already connected! Update extension with existing info
            console.log('✅ Wallet already connected:', statusData.data.address);

            await chrome.runtime.sendMessage({
              type: 'UPDATE_WALLET_CONNECTION',
              data: {
                origin: webAppUrl,
                address: statusData.data.address,
                method: statusData.data.method || 'web3',
                isVerified: statusData.data.passportVerified || false,
                humanityScore: statusData.data.passportScore || 0,
              },
            });

            // CRITICAL: Save verification state to local storage
            // This ensures checkDID() won't try to verify again
            await chrome.storage.local.set({
              ethAddress: statusData.data.address,
              isVerified: statusData.data.passportVerified || false,
              verification_complete: statusData.data.passportVerified || false,
              verification_timestamp: Date.now()
            });

            // Update local state
            setEthAddress(statusData.data.address);
            setIsVerified(statusData.data.passportVerified || false);
            await loadWalletConnection();
            await loadActivityLog();

            setLoading(false);
            setView('main');

            // User will see connection info in HumanWalletCard - no need for alert
            console.log('✅ Wallet already connected, showing main view');
            return;
          }
        }
      } catch (err) {
        console.log('⚠️ Could not check wallet status, opening onboarding:', err);
      }

      // No wallet connected yet - open onboarding
      console.log('⚠️ No wallet connected, opening onboarding...');

      // First, check if there's already a tab open with our app
      const tabs = await chrome.tabs.query({});
      const existingTab = tabs.find(tab =>
        tab.url?.includes(webAppDomain)
      );

      if (existingTab && existingTab.id) {
        // Tab already exists - focus on it and navigate to onboarding
        await chrome.tabs.update(existingTab.id, {
          active: true,
          url: `${webAppUrl}/onboarding?extensionId=${extensionId}`,
        });

        // Focus the window containing the tab
        if (existingTab.windowId) {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        }

        console.log('✅ Switched to existing tab');
      } else {
        // No existing tab - create a new one
        await chrome.tabs.create({
          url: `${webAppUrl}/onboarding?extensionId=${extensionId}`,
          active: true,
        });

        console.log('✅ Created new tab');
      }

      // Close the popup (user will complete onboarding in web app)
      window.close();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error opening web app: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified(verification: PassportVerification) {
    console.log('🎉 Verification successful!', verification);

    // Store verification status with completion flag
    await chrome.storage.local.set({
      isVerified: true,
      verificationData: verification,
      verification_complete: true, // Flag to prevent re-verification
      verification_timestamp: Date.now()
    });

    setIsVerified(true);

    // Also update wallet connection with verified status
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_WALLET_CONNECTION',
        data: {
          origin: 'http://localhost:3000',
          address: ethAddress,
          method: 'web3',
          isVerified: true,
          humanityScore: verification.details.stampScore || verification.details.score || 0,
        },
      });
    } catch (err) {
      console.warn('Could not update wallet connection:', err);
    }

    // Log activity
    await chrome.runtime.sendMessage({
      type: 'LOG_ACTIVITY',
      data: {
        type: 'PASSPORT_VERIFIED',
        details: {
          address: ethAddress,
          score: verification.details.stampScore || verification.details.score,
          timestamp: Date.now()
        }
      }
    });

    // Go to main view
    setView('main');
    await loadActivityLog();
    await loadWalletConnection();
  }

  function handleQRScan(voucher: VoucherData) {
    setVoucherData(voucher);
    setView('claim-sbt');
  }

  async function handleClaimSBT() {
    if (!voucherData || !ethAddress) {
      alert('Missing voucher data or wallet address');
      return;
    }

    setLoading(true);
    try {
      // Call SBT contract to claim Health Identity
      const result = await SBTService.claimHealthIdentity({
        sbtContractAddress: voucherData.data.sbtContractAddress,
        patientAddress: voucherData.data.patientAddress,
        nillionDID: voucherData.data.nillionDID,
        expiresAt: voucherData.data.expiresAt,
        voucherNonce: voucherData.data.voucherNonce,
        signature: voucherData.data.signature,
      });

      if (result.success) {
        // Log activity
        await chrome.runtime.sendMessage({
          type: 'LOG_ACTIVITY',
          data: {
            type: 'SBT_CLAIMED',
            details: {
              address: ethAddress,
              provider: voucherData.data.providerAddress,
              sbtContract: voucherData.data.sbtContractAddress,
              tokenId: result.tokenId,
              txHash: result.txHash,
            }
          }
        });

        alert(`✅ Success! Health Identity SBT claimed!\n\nToken ID: ${result.tokenId}\nTx: ${result.txHash?.slice(0, 10)}...`);
        setView('main');
        await loadActivityLog();
      } else {
        alert(`❌ Failed to claim SBT:\n\n${result.error}`);
      }
    } catch (error) {
      alert('Error claiming SBT: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  if (loading && view !== 'setup') {
    return (
      <div className="container loading-container">
        <div className="loading-screen">
          <div className="loading-header">
            <div className="loading-icon">🏥</div>
            <h1 className="loading-title">DASHI</h1>
            <p className="loading-subtitle">Your Sovereign Health Identity</p>
          </div>
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
          </div>
          <p className="loading-text">Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  if (view === 'setup') {
    return (
      <div className="container">
        <div className="setup">
          <div className="header">
            <h1>🏥 DASHI</h1>
            <p className="tagline">Your Health. Your Identity. Your Sovereignty.</p>
          </div>

          <div className="card">
            <h2>Welcome!</h2>
            <p>Create your Decentralized Identifier (DID) to get started.</p>

            <div className="form-group">
              <label>Choose a Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                className="input"
              />
              <p className="hint">
                This password encrypts your private key. Don't forget it!
              </p>
            </div>

            <button
              onClick={handleCreateDID}
              disabled={loading || password.length < 8}
              className="button button-primary"
            >
              {loading ? 'Creating...' : 'Create DID'}
            </button>
          </div>

          <div className="info">
            <p>
              <strong>What is a DID?</strong> A Decentralized Identifier gives you
              self-sovereign control over your medical data.
            </p>
          </div>

          <PoweredBy />
        </div>
      </div>
    );
  }

  if (view === 'data') {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={() => setView('main')} className="back-button">
            ← Back
          </button>
          <h2>My Health Data</h2>
        </div>

        <div className="data-section">
          <div className="empty-state">
            <p>📋 No health records yet</p>
            <p className="hint">
              Connect to the Veritas Zero Health app to add your medical records
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'permissions') {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={() => setView('main')} className="back-button">
            ← Back
          </button>
          <h2>Permissions</h2>
        </div>

        <div className="permissions-section">
          <div className="empty-state">
            <p>🔐 No permissions granted yet</p>
            <p className="hint">
              Apps will appear here when you grant them access to your data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'activity') {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={() => setView('main')} className="back-button">
            ← Back
          </button>
          <h2>Activity Log</h2>
        </div>

        <div className="activity-section">
          {activityLog.length === 0 ? (
            <div className="empty-state">
              <p>📝 No activity yet</p>
            </div>
          ) : (
            <div className="activity-list">
              {activityLog.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'DID_CREATED' && '🆔'}
                    {activity.type === 'PERMISSION_REQUESTED' && '🔒'}
                    {activity.type === 'PERMISSION_REVOKED' && '❌'}
                    {activity.type === 'PAGE_VISITED' && '🌐'}
                    {activity.type === 'PASSPORT_VERIFIED' && '✅'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-type">{activity.type.replace('_', ' ')}</div>
                    <div className="activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'wallet-connect') {
    return (
      <div className="container">
        <div className="setup">
          <div className="header">
            <h1>🏥 DASHI</h1>
            <p className="tagline">Your Health. Your Identity. Your Sovereignty.</p>
          </div>

          <div className="card">
            <h2>Connect Your Wallet</h2>
            <p>
              Connect your wallet using Human Wallet to verify your identity.
            </p>

            <div className="info" style={{ margin: '1.5rem 0' }}>
              <p>
                <strong>Why do I need a wallet?</strong>
                <br />
                Your wallet address is your identity in DASHI. We use Human Passport to verify you're a unique human.
              </p>
            </div>

            <button
              onClick={handleConnectWallet}
              disabled={loading}
              className="button button-primary"
            >
              {loading ? 'Connecting...' : '🔗 Connect with Human Wallet'}
            </button>
          </div>

          <div className="info">
            <p>
              Clicking the button will open a new tab where you can connect using MetaMask, WalletConnect, Coinbase Wallet, and more.
            </p>
          </div>

          <PoweredBy />
        </div>
      </div>
    );
  }

  if (view === 'passport-verification') {
    if (!ethAddress) {
      setView('wallet-connect');
      return null;
    }

    return (
      <div className="container">
        <div className="setup">
          <div className="header">
            <h1>🏥 DASHI</h1>
            <p className="tagline">Your Health. Your Identity. Your Sovereignty.</p>
          </div>

          <PassportVerificationCard
            address={ethAddress}
            onVerified={handleVerified}
            minScore={50}
            useDoubleVerification={true}
          />

          <div className="info">
            <p>
              <strong>Connected Wallet:</strong>
              <br />
              {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}
            </p>
          </div>

          <PoweredBy />
        </div>
      </div>
    );
  }

  if (view === 'scan-qr') {
    return (
      <QRScanner
        onScan={handleQRScan}
        onCancel={() => setView('main')}
      />
    );
  }

  if (view === 'claim-sbt') {
    if (!voucherData) {
      setView('main');
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const isExpired = voucherData.data.expiresAt < now;
    const timeRemaining = voucherData.data.expiresAt - now;

    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={() => setView('main')} className="back-button">
            ← Back
          </button>
          <h2>Claim Health Identity SBT</h2>
        </div>

        <div className="card">
          <h3>📋 Voucher Details</h3>

          {isExpired ? (
            <div className="error-message" style={{ marginTop: '1rem' }}>
              <p>⚠️ This voucher has expired</p>
              <p>Please request a new QR code from your provider</p>
            </div>
          ) : (
            <>
              <div className="voucher-details">
                <div className="detail-row">
                  <span className="detail-label">Your Address:</span>
                  <span className="detail-value">
                    {voucherData.data.patientAddress.slice(0, 10)}...
                    {voucherData.data.patientAddress.slice(-8)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Provider:</span>
                  <span className="detail-value">
                    {voucherData.data.providerAddress.slice(0, 10)}...
                    {voucherData.data.providerAddress.slice(-8)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Nillion DID:</span>
                  <span className="detail-value">
                    {voucherData.data.nillionDID.slice(0, 20)}...
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Chain ID:</span>
                  <span className="detail-value">{voucherData.data.chainId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Expires In:</span>
                  <span className={`detail-value ${timeRemaining < 60 ? 'text-warning' : 'text-success'}`}>
                    {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
                  </span>
                </div>
              </div>

              <div className="info" style={{ margin: '1rem 0' }}>
                <p>
                  <strong>What happens next?</strong>
                  <br />
                  By confirming, a Health Identity Soulbound Token (SBT) will be minted to your Smart Account address. This is a non-transferable credential verified by your medical provider.
                </p>
              </div>

              <button
                onClick={handleClaimSBT}
                disabled={loading}
                className="button button-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Claiming...' : '✅ Confirm & Claim SBT'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="container">
      <div className="header">
        <h1>🏥 DASHI</h1>
        <div className="status">
          <span className="status-dot"></span>
          Active
        </div>
      </div>

      {/* Human Wallet Card - Replaces old connection status */}
      {(walletConnection?.isConnected || (isVerified && ethAddress)) && (
        <HumanWalletCard
          address={ethAddress}
          onDisconnect={handleDisconnectWallet}
        />
      )}

      <div className="did-card">
        <div className="did-label">Your DID</div>
        <div className="did-value">{did?.id}</div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(did?.id || '');
            alert('DID copied to clipboard!');
          }}
          className="copy-button"
        >
          📋 Copy
        </button>
      </div>

      <div className="menu">
        {isVerified && ethAddress && (
          <button onClick={() => setView('scan-qr')} className="menu-item highlight">
            <span className="menu-icon">📷</span>
            <div className="menu-content">
              <div className="menu-title">Scan QR Code</div>
              <div className="menu-subtitle">Claim your Health Identity SBT</div>
            </div>
            <span className="menu-arrow">→</span>
          </button>
        )}

        <button onClick={() => setView('data')} className="menu-item">
          <span className="menu-icon">📊</span>
          <div className="menu-content">
            <div className="menu-title">My Health Data</div>
            <div className="menu-subtitle">View and manage records</div>
          </div>
          <span className="menu-arrow">→</span>
        </button>

        <button onClick={() => setView('permissions')} className="menu-item">
          <span className="menu-icon">🔐</span>
          <div className="menu-content">
            <div className="menu-title">Permissions</div>
            <div className="menu-subtitle">Manage app access</div>
          </div>
          <span className="menu-arrow">→</span>
        </button>

        <button onClick={() => setView('activity')} className="menu-item">
          <span className="menu-icon">📝</span>
          <div className="menu-content">
            <div className="menu-title">Activity Log</div>
            <div className="menu-subtitle">
              {activityLog.length} {activityLog.length === 1 ? 'event' : 'events'}
            </div>
          </div>
          <span className="menu-arrow">→</span>
        </button>
      </div>

      <PoweredBy />
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
