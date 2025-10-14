/**
 * Content Script
 * Bridges communication between web pages and the extension
 * Uses postMessage API for secure cross-origin communication
 */

console.log('🔌 Veritas Zero Health - Content Script loaded');

// Inject script into page context to expose API
// Using separate file to avoid CSP inline script violations
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/content/injected-script.js');
script.onload = function() {
  console.log('✅ Veritas API script loaded');
  // Remove script tag after execution
  script.remove();
};

// Inject at document start
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the page (injected script)
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) {
    return;
  }

  const { type, ...data } = event.data;

  try {
    switch (type) {
      case 'VERITAS_REQUEST_DID': {
        // Request DID from background script
        const response = await chrome.runtime.sendMessage({
          type: 'GET_DID',
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_DID_RESPONSE',
              did: response.data,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_DID_RESPONSE',
              error: response.error || 'Failed to get DID',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_INIT_NILLION': {
        // Check if DID exists first
        const hasDidResponse = await chrome.runtime.sendMessage({
          type: 'HAS_DID',
        });

        if (!hasDidResponse.success || !hasDidResponse.data.hasDID) {
          // No DID exists - need to create one first
          // Check if we already have a pending request to avoid loops
          const stored = await chrome.storage.local.get(['pendingNillionInit']);

          if (!stored.pendingNillionInit) {
            // First time - store flag and open popup
            await chrome.storage.local.set({
              pendingNillionInit: true,
              pendingNillionInitOrigin: window.location.origin,
            });

            // Open popup to create DID
            try {
              await chrome.runtime.sendMessage({ type: 'REQUEST_PERMISSION', data: {
                origin: window.location.origin,
                requestedPermissions: ['create:did', 'init:nillion']
              }});
            } catch (err) {
              console.error('Failed to open popup:', err);
            }
          }

          // Respond with pending status
          window.postMessage(
            {
              type: 'VERITAS_INIT_NILLION_RESPONSE',
              status: 'pending',
              message: 'Please create a DID in the extension popup',
            },
            '*'
          );
          break;
        }

        // DID exists, get it and initialize Nillion
        const didResponse = await chrome.runtime.sendMessage({
          type: 'GET_DID',
        });

        if (!didResponse.success || !didResponse.data) {
          window.postMessage(
            {
              type: 'VERITAS_INIT_NILLION_RESPONSE',
              error: 'Failed to retrieve DID',
            },
            '*'
          );
          break;
        }

        // didResponse.data is a DIDDocument with { id, publicKey, created, updated }
        const didDocument = didResponse.data;

        const response = await chrome.runtime.sendMessage({
          type: 'INIT_NILLION',
          data: {
            did: didDocument.id,
          },
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_INIT_NILLION_RESPONSE',
              status: response.data.status,
              collectionIds: response.data.collectionIds,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_INIT_NILLION_RESPONSE',
              error: response.error || 'Failed to initialize Nillion',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_REQUEST_PERMISSION': {
        // Request permission from background script
        const origin = window.location.origin;

        const response = await chrome.runtime.sendMessage({
          type: 'REQUEST_PERMISSION',
          data: {
            origin,
            requestedPermissions: data.permissions,
          },
        });

        if (response.success) {
          // Permission request submitted, wait for user approval
          window.postMessage(
            {
              type: 'VERITAS_PERMISSION_RESPONSE',
              requestId: response.data.requestId,
              status: 'pending',
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_PERMISSION_RESPONSE',
              error: response.error,
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_REQUEST_DATA': {
        // Request health data from background script (Nillion)
        const response = await chrome.runtime.sendMessage({
          type: 'GET_DOCUMENTS',
          data: {
            collection: data.dataType, // e.g., 'diagnoses', 'biomarkers'
          },
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_DATA_RESPONSE',
              data: response.data.documents || [],
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_DATA_RESPONSE',
              error: response.error || 'Failed to fetch data',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_POPULATE_SAMPLE_DATA': {
        // Populate sample health data
        const response = await chrome.runtime.sendMessage({
          type: 'POPULATE_SAMPLE_DATA',
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_POPULATE_SAMPLE_DATA_RESPONSE',
              results: response.data,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_POPULATE_SAMPLE_DATA_RESPONSE',
              error: response.error || 'Failed to populate sample data',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_INIT_ZK': {
        // Initialize ZK proof system
        const response = await chrome.runtime.sendMessage({
          type: 'INIT_ZK',
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_INIT_ZK_RESPONSE',
              status: response.data.status,
              zkStatus: response.data,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_INIT_ZK_RESPONSE',
              error: response.error || 'Failed to initialize ZK proofs',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_GENERATE_PROOF': {
        // Generate eligibility proof
        const response = await chrome.runtime.sendMessage({
          type: 'GENERATE_ELIGIBILITY_PROOF',
          data: {
            eligibilityCode: data.eligibilityCode,
          },
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_GENERATE_PROOF_RESPONSE',
              proof: response.data.proof,
              publicInputs: response.data.publicInputs,
              timeMs: response.data.timeMs,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_GENERATE_PROOF_RESPONSE',
              error: response.error || 'Failed to generate proof',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_VERIFY_PROOF': {
        // Verify eligibility proof
        const response = await chrome.runtime.sendMessage({
          type: 'VERIFY_ELIGIBILITY_PROOF',
          data: {
            proof: data.proof,
            publicInputs: data.publicInputs,
          },
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_VERIFY_PROOF_RESPONSE',
              valid: response.data.valid,
              timeMs: response.data.timeMs,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_VERIFY_PROOF_RESPONSE',
              error: response.error || 'Failed to verify proof',
            },
            '*'
          );
        }
        break;
      }

      case 'VERITAS_GENERATE_PROOF_FROM_HEALTH_DATA': {
        // Generate proof from health data
        const response = await chrome.runtime.sendMessage({
          type: 'GENERATE_PROOF_FROM_HEALTH_DATA',
          data: {
            dataType: data.dataType,
            criteria: data.criteria,
          },
        });

        if (response.success) {
          window.postMessage(
            {
              type: 'VERITAS_GENERATE_PROOF_FROM_HEALTH_DATA_RESPONSE',
              proof: response.data.proof,
              publicInputs: response.data.publicInputs,
              timeMs: response.data.timeMs,
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'VERITAS_GENERATE_PROOF_FROM_HEALTH_DATA_RESPONSE',
              error: response.error || 'Failed to generate proof from health data',
            },
            '*'
          );
        }
        break;
      }

      default:
        // Ignore unknown messages
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);

    // Send error response
    const responseType = type.replace('REQUEST', 'RESPONSE');
    window.postMessage(
      {
        type: responseType,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      '*'
    );
  }
});

// Listen for wallet connection events from the page
// This allows Next.js app to notify the extension when wallet is connected
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message from background:', message);

  if (message.type === 'WALLET_CONNECTION_UPDATED') {
    // Notify the page that wallet connection state changed
    window.postMessage(
      {
        type: 'VERITAS_WALLET_CONNECTION_UPDATED',
        data: message.data,
      },
      '*'
    );
    sendResponse({ success: true });
  }

  return true;
});

// Log activity when page loads
chrome.runtime.sendMessage({
  type: 'LOG_ACTIVITY',
  data: {
    type: 'PAGE_VISITED',
    timestamp: Date.now(),
    details: {
      url: window.location.href,
      origin: window.location.origin,
    },
  },
});

console.log('✅ Veritas content script initialized');
