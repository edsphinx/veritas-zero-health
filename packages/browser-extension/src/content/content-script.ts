/**
 * Content Script
 * Bridges communication between web pages and the extension
 * Uses postMessage API for secure cross-origin communication
 */

console.log('🔌 Veritas Zero Health - Content Script loaded');

// Inject script into page context to expose API
const script = document.createElement('script');
script.textContent = `
  (function() {
    // Create Veritas API object in window
    window.Veritas = {
      // Request DID from extension
      async requestDID() {
        return new Promise((resolve, reject) => {
          window.postMessage({
            type: 'VERITAS_REQUEST_DID',
            timestamp: Date.now()
          }, '*');

          const handleResponse = (event) => {
            if (event.data.type === 'VERITAS_DID_RESPONSE') {
              window.removeEventListener('message', handleResponse);
              if (event.data.error) {
                reject(new Error(event.data.error));
              } else {
                resolve(event.data.did);
              }
            }
          };

          window.addEventListener('message', handleResponse);

          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            reject(new Error('Request timeout'));
          }, 10000);
        });
      },

      // Request permission to access user data
      async requestPermission(permissions) {
        return new Promise((resolve, reject) => {
          window.postMessage({
            type: 'VERITAS_REQUEST_PERMISSION',
            permissions,
            timestamp: Date.now()
          }, '*');

          const handleResponse = (event) => {
            if (event.data.type === 'VERITAS_PERMISSION_RESPONSE') {
              window.removeEventListener('message', handleResponse);
              if (event.data.error) {
                reject(new Error(event.data.error));
              } else {
                resolve(event.data);
              }
            }
          };

          window.addEventListener('message', handleResponse);

          setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            reject(new Error('Permission request timeout'));
          }, 30000);
        });
      },

      // Request specific data (if permission granted)
      async requestData(dataType) {
        return new Promise((resolve, reject) => {
          window.postMessage({
            type: 'VERITAS_REQUEST_DATA',
            dataType,
            timestamp: Date.now()
          }, '*');

          const handleResponse = (event) => {
            if (event.data.type === 'VERITAS_DATA_RESPONSE') {
              window.removeEventListener('message', handleResponse);
              if (event.data.error) {
                reject(new Error(event.data.error));
              } else {
                resolve(event.data.data);
              }
            }
          };

          window.addEventListener('message', handleResponse);

          setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            reject(new Error('Data request timeout'));
          }, 10000);
        });
      },

      // Check if extension is installed
      isInstalled() {
        return true;
      },

      // Get version
      version: '0.1.0'
    };

    // Dispatch event to notify page that API is ready
    window.dispatchEvent(new Event('veritas-ready'));

    console.log('✅ Veritas API injected');
  })();
`;

// Inject at document start
document.documentElement.appendChild(script);
script.remove();

// Listen for messages from the page
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
