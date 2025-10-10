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
        // TODO: Implement data fetching from Nillion
        window.postMessage(
          {
            type: 'VERITAS_DATA_RESPONSE',
            error: 'Not implemented yet',
          },
          '*'
        );
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
