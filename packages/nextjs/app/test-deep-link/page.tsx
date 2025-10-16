'use client';

import { useState } from 'react';

/**
 * Test page for browser extension deep link integration
 *
 * This page demonstrates how to trigger ZK proof generation from the web app
 * by opening the browser extension with deep link parameters.
 */
export default function TestDeepLinkPage() {
  const [extensionId, setExtensionId] = useState('');
  const [studyId, setStudyId] = useState('1');
  const [status, setStatus] = useState('');

  const handleOpenExtension = () => {
    if (!extensionId) {
      setStatus('Please enter your extension ID first');
      return;
    }

    // Build return URL
    const returnUrl = encodeURIComponent(`${window.location.origin}/test-deep-link?result=success`);

    // Build deep link URL
    const deepLinkUrl = `chrome-extension://${extensionId}/src/popup/index.html?action=generate-zk-proof&studyId=${studyId}&returnUrl=${returnUrl}`;

    console.log('Opening extension with deep link:', deepLinkUrl);
    setStatus(`Opening extension for Study #${studyId}...`);

    // Open extension in new tab
    window.open(deepLinkUrl, '_blank');
  };

  // Check if we returned from extension
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const proofSubmitted = urlParams?.get('proofSubmitted');
  const returnedStudyId = urlParams?.get('studyId');

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Browser Extension Deep Link Test
      </h1>

      {proofSubmitted === 'true' && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', color: '#059669', marginBottom: '8px' }}>
            Success! Proof Submitted
          </h2>
          <p style={{ color: '#047857', margin: 0 }}>
            ZK proof for Study #{returnedStudyId} was successfully submitted from the extension.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Setup Instructions</h2>
        <ol style={{ lineHeight: '1.6', color: '#374151' }}>
          <li>Load the unpacked extension in Chrome from <code>packages/browser-extension/dist/</code></li>
          <li>Copy the extension ID from <code>chrome://extensions/</code></li>
          <li>Paste it in the field below</li>
          <li>Click &quot;Open Extension&quot; to test the deep link flow</li>
        </ol>
      </div>

      <div style={{
        background: '#f9fafb',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Extension ID
          </label>
          <input
            type="text"
            value={extensionId}
            onChange={(e) => setExtensionId(e.target.value)}
            placeholder="e.g., abcdefghijklmnopqrstuvwxyz123456"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Find this in chrome://extensions/ (Developer mode must be enabled)
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            Study ID
          </label>
          <input
            type="text"
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
            placeholder="1"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Available studies: 1, 2, 3
          </p>
        </div>

        <button
          onClick={handleOpenExtension}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Open Extension for Study #{studyId}
        </button>

        {status && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#374151' }}>
            {status}
          </p>
        )}
      </div>

      <div style={{
        background: '#eff6ff',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          What happens when you click the button:
        </h3>
        <ol style={{ fontSize: '13px', lineHeight: '1.6', color: '#1e40af', margin: 0, paddingLeft: '20px' }}>
          <li>Extension opens in new tab with deep link parameters</li>
          <li>Extension automatically fetches study criteria from <code>/api/studies/{'{studyId}'}/criteria</code></li>
          <li>User generates ZK proof in the extension</li>
          <li>Extension automatically submits proof to <code>/api/studies/{'{studyId}'}/apply</code></li>
          <li>Extension redirects back to this page with success message</li>
        </ol>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          API Endpoints Test
        </h3>
        <p style={{ fontSize: '13px', color: '#78350f', marginBottom: '12px' }}>
          You can test the API endpoints directly:
        </p>
        <ul style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6', margin: 0 }}>
          <li>
            <a
              href="/api/studies/1/criteria"
              target="_blank"
              style={{ color: '#d97706', textDecoration: 'underline' }}
            >
              GET /api/studies/1/criteria
            </a>
          </li>
          <li>
            <a
              href="/api/studies/2/criteria"
              target="_blank"
              style={{ color: '#d97706', textDecoration: 'underline' }}
            >
              GET /api/studies/2/criteria
            </a>
          </li>
          <li>
            <a
              href="/api/studies/3/criteria"
              target="_blank"
              style={{ color: '#d97706', textDecoration: 'underline' }}
            >
              GET /api/studies/3/criteria
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
