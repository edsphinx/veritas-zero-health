import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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

function App() {
  const [did, setDid] = useState<DIDDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'main' | 'setup' | 'data' | 'permissions' | 'activity'>('main');
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  useEffect(() => {
    checkDID();
    loadActivityLog();
  }, []);

  async function checkDID() {
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'HAS_DID' });

      if (response.success && response.data.hasDID) {
        // Load DID
        const didResponse = await chrome.runtime.sendMessage({ type: 'GET_DID' });
        if (didResponse.success) {
          setDid(didResponse.data);
        }
      } else {
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
        setView('main');
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

  if (loading && view !== 'setup') {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (view === 'setup') {
    return (
      <div className="container">
        <div className="setup">
          <div className="header">
            <h1>🏥 Veritas Zero Health</h1>
            <p className="tagline">Your Health. Your Data. Your Control.</p>
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

  // Main view
  return (
    <div className="container">
      <div className="header">
        <h1>🏥 Veritas Zero Health</h1>
        <div className="status">
          <span className="status-dot"></span>
          Active
        </div>
      </div>

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

      <div className="footer">
        <p>Private. Secure. Yours.</p>
      </div>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
