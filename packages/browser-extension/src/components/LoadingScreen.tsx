/**
 * Reusable Loading Screen Component
 *
 * A consistent loading screen used throughout the extension
 */

export interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'Loading...', fullScreen = false }: LoadingScreenProps) {
  if (fullScreen) {
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
          <p className="loading-text">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-section">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
}
