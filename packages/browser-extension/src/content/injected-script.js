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
    // Connection state
    isConnected: false,
    address: null,
    isVerified: false,
    humanityScore: 0,

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

    // Get current wallet connection status
    async getConnectionStatus() {
      return {
        isConnected: this.isConnected,
        address: this.address,
        isVerified: this.isVerified,
        humanityScore: this.humanityScore,
      };
    },

    // Update connection state (called internally)
    _updateConnection(data) {
      const wasConnected = this.isConnected;

      this.isConnected = data.isConnected || false;
      this.address = data.address || null;
      this.isVerified = data.isVerified || false;
      this.humanityScore = data.humanityScore || 0;

      // Trigger events
      if (!wasConnected && this.isConnected) {
        window.dispatchEvent(new CustomEvent('veritas-connected', {
          detail: { address: this.address }
        }));
      } else if (wasConnected && !this.isConnected) {
        window.dispatchEvent(new Event('veritas-disconnected'));
      }

      if (this.isConnected && data.address !== this.address) {
        window.dispatchEvent(new CustomEvent('veritas-account-changed', {
          detail: { address: this.address }
        }));
      }
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

    // Initialize Nillion client in extension
    async initializeNillion() {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'VERITAS_INIT_NILLION',
          timestamp: Date.now()
        }, '*');

        const handleResponse = (event) => {
          if (event.data.type === 'VERITAS_INIT_NILLION_RESPONSE') {
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
          reject(new Error('Nillion initialization timeout'));
        }, 10000);
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

    // Populate sample health data for testing
    async populateSampleData() {
      return new Promise((resolve, reject) => {
        window.postMessage({
          type: 'VERITAS_POPULATE_SAMPLE_DATA',
          timestamp: Date.now()
        }, '*');

        const handleResponse = (event) => {
          if (event.data.type === 'VERITAS_POPULATE_SAMPLE_DATA_RESPONSE') {
            window.removeEventListener('message', handleResponse);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.results);
            }
          }
        };

        window.addEventListener('message', handleResponse);

        setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          reject(new Error('Populate sample data timeout'));
        }, 15000);
      });
    },

    // Check if extension is installed
    isInstalled() {
      return true;
    },

    // Get version
    version: '0.1.0'
  };

  // Listen for connection updates from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data.type === 'VERITAS_WALLET_CONNECTION_UPDATED') {
      window.Veritas._updateConnection(event.data.data);
    }
  });

  // Dispatch event to notify page that API is ready
  window.dispatchEvent(new Event('veritas-ready'));

  console.log('✅ Veritas API injected into page context');
})();
