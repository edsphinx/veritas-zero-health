/**
 * Nillion Demo Component
 *
 * Demonstrates Nillion integration with the browser extension.
 * Shows extension detection, connection, and health data access.
 *
 * @example
 * ```tsx
 * <NillionDemo />
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useExtension, useNillion } from '@/shared/hooks';
import type { HealthDataPermission, Diagnosis, Biomarker } from '@/shared/types';

export function NillionDemo() {
  // Extension state
  const {
    isInstalled,
    isConnected,
    version,
    connect: connectExtension,
    error: extensionError,
    isLoading: extensionLoading,
  } = useExtension();

  // Nillion state
  const {
    isReady: nillionReady,
    userDID,
    hasDID,
    diagnoses,
    biomarkers,
    loading: nillionLoading,
    error: nillionError,
    initialize: initNillion,
    requestPermissions,
    fetchHealthData,
  } = useNillion();

  const [step, setStep] = useState<'detect' | 'connect' | 'init' | 'permissions' | 'data'>('detect');

  /**
   * Step 1: Detect extension
   */
  useEffect(() => {
    if (isInstalled) {
      setStep('connect');
    }
  }, [isInstalled]);

  /**
   * Step 2: Connect to extension
   */
  const handleConnect = async () => {
    try {
      await connectExtension();
      setStep('init');
    } catch (err) {
      console.error('Failed to connect to extension:', err);
    }
  };

  /**
   * Step 3: Initialize Nillion
   */
  const handleInitNillion = async () => {
    try {
      await initNillion();
      setStep('permissions');
    } catch (err) {
      console.error('Failed to initialize Nillion:', err);
    }
  };

  /**
   * Step 4: Request permissions
   */
  const handleRequestPermissions = async () => {
    try {
      const permissions: HealthDataPermission[] = [
        'read:diagnoses',
        'read:biomarkers',
        'read:vitals',
        'read:medications',
        'read:allergies',
      ];

      const granted = await requestPermissions(permissions);
      if (granted) {
        setStep('data');
      } else {
        console.error('Permissions denied');
      }
    } catch (err) {
      console.error('Failed to request permissions:', err);
    }
  };

  /**
   * Step 5: Fetch health data
   */
  const handleFetchData = async () => {
    try {
      await fetchHealthData();
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Nillion Integration Demo</h1>

      {/* Extension Status */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-xl font-semibold">Extension Status</h2>

        <div className="space-y-2">
          <StatusItem label="Extension Installed" value={isInstalled} />
          <StatusItem label="Extension Connected" value={isConnected} />
          {version && <StatusItem label="Extension Version" value={version} />}
        </div>

        {extensionError && (
          <div className="text-red-600 p-3 bg-red-50 rounded">
            Error: {extensionError.message}
          </div>
        )}

        {!isInstalled && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-semibold">Extension not detected</p>
            <p className="text-sm mt-1">Please install the Veritas browser extension to continue.</p>
          </div>
        )}

        {isInstalled && !isConnected && (
          <button
            onClick={handleConnect}
            disabled={extensionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {extensionLoading ? 'Connecting...' : 'Connect Extension'}
          </button>
        )}
      </div>

      {/* Nillion Status */}
      {isConnected && (
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-semibold">Nillion Status</h2>

          <div className="space-y-2">
            <StatusItem label="Nillion Ready" value={nillionReady} />
            <StatusItem label="Has DID" value={hasDID} />
            {userDID && (
              <div className="flex gap-2 items-start">
                <span className="font-medium min-w-[120px]">User DID:</span>
                <code className="flex-1 text-sm bg-gray-100 px-2 py-1 rounded break-all">
                  {typeof userDID === 'object' ? JSON.stringify(userDID) : userDID}
                </code>
              </div>
            )}
          </div>

          {nillionError && (
            <div className="text-red-600 p-3 bg-red-50 rounded">
              Error: {nillionError.message}
            </div>
          )}

          {!nillionReady && (
            <button
              onClick={handleInitNillion}
              disabled={nillionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {nillionLoading ? 'Initializing...' : 'Initialize Nillion'}
            </button>
          )}
        </div>
      )}

      {/* Permissions */}
      {nillionReady && step === 'permissions' && (
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-semibold">Request Permissions</h2>
          <p className="text-sm text-gray-600">
            Grant access to read your health data from the extension.
          </p>

          <button
            onClick={handleRequestPermissions}
            disabled={nillionLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {nillionLoading ? 'Requesting...' : 'Request All Permissions'}
          </button>
        </div>
      )}

      {/* Health Data */}
      {nillionReady && step === 'data' && (
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-semibold">Health Data</h2>

          <button
            onClick={handleFetchData}
            disabled={nillionLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {nillionLoading ? 'Loading...' : 'Fetch Health Data'}
          </button>

          <div className="space-y-4 mt-4">
            <DataSection title="Diagnoses" count={diagnoses.length} data={diagnoses} />
            <DataSection title="Biomarkers" count={biomarkers.length} data={biomarkers} />
          </div>
        </div>
      )}

      {/* Current Step Indicator */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600">
          Current Step: <span className="font-semibold capitalize">{step}</span>
        </p>
        <div className="flex gap-2 mt-2">
          {['detect', 'connect', 'init', 'permissions', 'data'].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded ${
                s === step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Status Item Component
 */
function StatusItem({ label, value }: { label: string; value: boolean | string }) {
  return (
    <div className="flex gap-2 items-center">
      <span className="font-medium min-w-[120px]">{label}:</span>
      {typeof value === 'boolean' ? (
        <span className={`px-2 py-1 rounded text-sm ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? '✓ Yes' : '✗ No'}
        </span>
      ) : (
        <span className="text-sm">{value}</span>
      )}
    </div>
  );
}

/**
 * Data Section Component
 */
function DataSection({ title, count, data }: { title: string; count: number; data: Diagnosis[] | Biomarker[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded p-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-gray-600">{count} records</span>
      </div>

      {count > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:underline mt-2"
        >
          {expanded ? 'Hide' : 'Show'} details
        </button>
      )}

      {expanded && count > 0 && (
        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-60">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
