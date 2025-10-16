'use client';

import { useAppKit } from '@reown/appkit/react';
import { useAccount, useEnsName, useDisconnect } from 'wagmi';

export function WalletConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected, isConnecting } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { disconnect } = useDisconnect();

  // Format address: 0x1234...5678
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-6 py-3 bg-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
      >
        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-500 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Connected Wallet</p>
              <p className="font-semibold text-gray-900">
                {ensName || formatAddress(address)}
              </p>
            </div>
          </div>
          <button
            onClick={() => open()}
            className="px-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Change
          </button>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      Connect Wallet
    </button>
  );
}

export function WalletConnectCompact() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <button
      onClick={() => open()}
      className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:shadow-md transition-all"
    >
      {isConnected && address ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-semibold text-gray-900">
            {ensName || formatAddress(address)}
          </span>
        </>
      ) : (
        <span className="text-sm font-medium text-gray-700">Connect Wallet</span>
      )}
    </button>
  );
}
