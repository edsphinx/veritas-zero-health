/**
 * Injected Script (runs in page context)
 *
 * This script creates the window.Veritas API that web pages can use.
 * It communicates with the content script via postMessage.
 */

(function() {
  'use strict';

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

  console.log('✅ Veritas API injected into page context');
})();
