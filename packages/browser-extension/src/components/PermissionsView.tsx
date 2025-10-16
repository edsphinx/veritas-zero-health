import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface PermissionGrant {
  appOrigin: string;
  permissions: string[];
  grantedAt: number;
  expiresAt: number | null;
}

interface PermissionsViewProps {
  onBack: () => void;
}

export function PermissionsView({ onBack }: PermissionsViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, PermissionGrant>>({});
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    setLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PERMISSIONS' });

      if (response.success) {
        setPermissions(response.data);
      } else {
        setError('Failed to load permissions');
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokePermission(origin: string) {
    const confirmed = confirm(`Are you sure you want to revoke access for ${origin}?`);
    if (!confirmed) return;

    setRevoking(origin);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REVOKE_PERMISSION',
        data: { origin },
      });

      if (response.success) {
        // Remove from local state
        const updatedPermissions = { ...permissions };
        delete updatedPermissions[origin];
        setPermissions(updatedPermissions);

        toast.success(`Access revoked for ${origin}`);
      } else {
        setError('Failed to revoke permission');
      }
    } catch (err) {
      console.error('Error revoking permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke permission');
    } finally {
      setRevoking(null);
    }
  }

  function getPermissionIcon(permission: string): string {
    if (permission.includes('diagnoses')) return '🏥';
    if (permission.includes('biomarkers')) return '🧬';
    if (permission.includes('vitals')) return '❤️';
    if (permission.includes('medications')) return '💊';
    if (permission.includes('allergies')) return '⚠️';
    if (permission.includes('profile')) return '👤';
    return '🔐';
  }

  function formatPermission(permission: string): string {
    // Convert 'read:diagnoses' to 'Read Diagnoses'
    const [action, resource] = permission.split(':');
    const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
    const formattedResource = resource.charAt(0).toUpperCase() + resource.slice(1);
    return `${formattedAction} ${formattedResource}`;
  }

  function isExpired(expiresAt: number | null): boolean {
    if (!expiresAt) return false;
    return expiresAt < Date.now();
  }

  function getExpiryText(expiresAt: number | null): string {
    if (!expiresAt) return 'Never expires';

    const now = Date.now();
    if (expiresAt < now) return 'Expired';

    const timeLeft = expiresAt - now;
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

    if (daysLeft > 30) {
      return `Expires in ${Math.floor(daysLeft / 30)} months`;
    } else if (daysLeft > 0) {
      return `Expires in ${daysLeft} days`;
    } else {
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      return `Expires in ${hoursLeft} hours`;
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={onBack} className="back-button">← Back</button>
          <h2>Permissions</h2>
        </div>

        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Loading permissions...</p>
        </div>
      </div>
    );
  }

  const permissionEntries = Object.entries(permissions);
  const hasPermissions = permissionEntries.length > 0;

  return (
    <div className="container">
      <div className="header-nav">
        <button onClick={onBack} className="back-button">← Back</button>
        <h2>Permissions</h2>
      </div>

      {error && (
        <div className="card error-card">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!hasPermissions ? (
        <div className="empty-state-card">
          <div className="empty-icon">🔐</div>
          <h3>No permissions granted yet</h3>
          <p className="hint">
            When you grant apps access to your health data, they will appear here.
            You can review and revoke permissions at any time.
          </p>
        </div>
      ) : (
        <>
          <div className="card info-card">
            <p>
              <strong>💡 Manage Access</strong>
              <br />
              You have granted {permissionEntries.length} app{permissionEntries.length !== 1 ? 's' : ''} access to your health data.
              Review and revoke permissions below.
            </p>
          </div>

          <div className="permissions-list">
            {permissionEntries.map(([origin, grant]) => {
              const expired = isExpired(grant.expiresAt);

              return (
                <div key={origin} className={`permission-card ${expired ? 'expired' : ''}`}>
                  <div className="permission-header">
                    <div className="permission-origin-group">
                      <span className="permission-app-icon">🌐</span>
                      <div className="permission-origin-info">
                        <div className="permission-origin">{origin}</div>
                        <div className="permission-meta">
                          Granted {new Date(grant.grantedAt).toLocaleDateString()}
                          {expired && <span className="expired-badge">Expired</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokePermission(origin)}
                      disabled={revoking === origin}
                      className="revoke-button"
                    >
                      {revoking === origin ? 'Revoking...' : 'Revoke'}
                    </button>
                  </div>

                  <div className="permission-details">
                    <div className="permissions-granted">
                      <div className="section-title">Granted Permissions:</div>
                      <div className="permission-badges">
                        {grant.permissions.map((permission) => (
                          <div key={permission} className="permission-badge">
                            <span className="permission-icon">{getPermissionIcon(permission)}</span>
                            <span className="permission-text">{formatPermission(permission)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="permission-expiry">
                      <span className="expiry-icon">⏰</span>
                      <span className={`expiry-text ${expired ? 'expired' : ''}`}>
                        {getExpiryText(grant.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="info">
        <p>
          <strong>About Permissions</strong>
          <br />
          Apps must request permission to access your encrypted health data. All data access is logged and can be revoked at any time.
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

        .empty-state-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 1rem;
        }

        .empty-state-card h3 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .info-card {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .error-card {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }

        .permissions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .permission-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
        }

        .permission-card.expired {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .permission-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .permission-origin-group {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          flex: 1;
        }

        .permission-app-icon {
          font-size: 32px;
        }

        .permission-origin-info {
          flex: 1;
        }

        .permission-origin {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          word-break: break-all;
        }

        .permission-meta {
          font-size: 13px;
          color: #6b7280;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .expired-badge {
          background: #fca5a5;
          color: #991b1b;
          padding: 0.125rem 0.5rem;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .revoke-button {
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .revoke-button:hover:not(:disabled) {
          background: #dc2626;
        }

        .revoke-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .permission-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .permission-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .permission-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 13px;
        }

        .permission-icon {
          font-size: 16px;
        }

        .permission-text {
          color: #374151;
          font-weight: 500;
        }

        .permission-expiry {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 13px;
          color: #6b7280;
        }

        .expiry-icon {
          font-size: 16px;
        }

        .expiry-text.expired {
          color: #dc2626;
          font-weight: 600;
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
