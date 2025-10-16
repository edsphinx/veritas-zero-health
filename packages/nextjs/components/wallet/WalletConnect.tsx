'use client';

import dynamic from 'next/dynamic';

// Loading fallback for WalletConnectButton
function WalletConnectButtonLoading() {
  return (
    <button
      disabled
      className="flex items-center gap-2 px-6 py-3 bg-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
    >
      <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      Loading...
    </button>
  );
}

// Loading fallback for WalletConnectCompact
function WalletConnectCompactLoading() {
  return (
    <button
      disabled
      className="flex items-center gap-2 px-4 py-2 bg-gray-200 border-2 border-gray-300 rounded-lg cursor-not-allowed"
    >
      <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="text-sm text-gray-500">Loading...</span>
    </button>
  );
}

// Dynamically import the client components (no SSR)
export const WalletConnectButton = dynamic(
  () => import('./WalletConnect.client').then((mod) => mod.WalletConnectButtonClient),
  {
    ssr: false,
    loading: () => <WalletConnectButtonLoading />,
  }
);

export const WalletConnectCompact = dynamic(
  () => import('./WalletConnect.client').then((mod) => mod.WalletConnectCompactClient),
  {
    ssr: false,
    loading: () => <WalletConnectCompactLoading />,
  }
);
