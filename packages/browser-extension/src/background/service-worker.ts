/**
 * Background Service Worker
 * Handles DID management, messaging, and Nillion integration
 */

import {
  generateKeyPair,
  createDIDDocument,
  storeKeypair,
  storeDID,
  retrieveDID,
  hasKeypair,
} from '../lib/crypto';

import {
  VeritasNillionClient,
  type HealthRecordType,
} from '../lib/nillion-client';

import { getAllSampleHealthData } from '../lib/sample-health-data';

import {
  initializeZKProofs,
  generateEligibilityProof,
  verifyEligibilityProof,
  generateProofFromHealthData,
  isZKInitialized,
  getZKStatus,
} from '../lib/zk-proof-service';

console.log('🚀 Veritas Zero Health - Service Worker loaded');

// Global Nillion client instance
let nillionClient: VeritasNillionClient | null = null;

// ZK initialization flag
let zkInitPromise: Promise<void> | null = null;

// Installation handler
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    await initializeExtension();
  }
});

/**
 * Initialize extension on first install
 */
async function initializeExtension() {
  console.log('Initializing Veritas Zero Health extension...');

  // Set default settings
  await chrome.storage.local.set({
    settings: {
      autoLock: true,
      lockTimeout: 15, // minutes
      notifications: true,
    },
    activityLog: [],
  });

  console.log('✅ Extension initialized');
}

/**
 * Message handler for communication with popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received:', request.type, request);

  // Handle async operations
  (async () => {
    try {
      switch (request.type) {
        case 'GENERATE_DID': {
          const result = await handleGenerateDID(request.data.password);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GET_DID': {
          const did = await retrieveDID();
          sendResponse({ success: true, data: did });
          break;
        }

        case 'HAS_DID': {
          const hasDID = await hasKeypair();
          sendResponse({ success: true, data: { hasDID } });
          break;
        }

        case 'SIGN_DATA': {
          // TODO: Implement signing with stored keypair
          sendResponse({ success: false, error: 'Not implemented yet' });
          break;
        }

        case 'REQUEST_PERMISSION': {
          const result = await handlePermissionRequest(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'REVOKE_PERMISSION': {
          const result = await handleRevokePermission(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GET_PERMISSIONS': {
          const permissions = await getPermissions();
          sendResponse({ success: true, data: permissions });
          break;
        }

        case 'LOG_ACTIVITY': {
          await logActivity(request.data);
          sendResponse({ success: true });
          break;
        }

        // Nillion Integration
        case 'INIT_NILLION': {
          const result = await handleInitNillion(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'STORE_DOCUMENT': {
          const result = await handleStoreDocument(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GET_DOCUMENTS': {
          const result = await handleGetDocuments(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GET_DOCUMENT': {
          const result = await handleGetDocument(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'DELETE_DOCUMENT': {
          await handleDeleteDocument(request.data);
          sendResponse({ success: true });
          break;
        }

        case 'GRANT_ACCESS': {
          await handleGrantAccess(request.data);
          sendResponse({ success: true });
          break;
        }

        case 'REVOKE_ACCESS': {
          await handleRevokeAccess(request.data);
          sendResponse({ success: true });
          break;
        }

        case 'GET_NILLION_STATUS': {
          const status = {
            initialized: nillionClient?.isInitialized() || false,
            did: nillionClient?.getUserDID() || null,
            collectionIds: nillionClient?.getCollectionIds() || new Map(),
          };
          sendResponse({ success: true, data: status });
          break;
        }

        case 'POPULATE_SAMPLE_DATA': {
          const result = await handlePopulateSampleData();
          sendResponse({ success: true, data: result });
          break;
        }

        // ZK Proof Integration
        case 'INIT_ZK': {
          const result = await handleInitZK();
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GET_ZK_STATUS': {
          const status = getZKStatus();
          sendResponse({ success: true, data: status });
          break;
        }

        case 'GENERATE_ELIGIBILITY_PROOF': {
          const result = await handleGenerateEligibilityProof(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'VERIFY_ELIGIBILITY_PROOF': {
          const result = await handleVerifyEligibilityProof(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GENERATE_PROOF_FROM_HEALTH_DATA': {
          const result = await handleGenerateProofFromHealthData(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        // Wallet Connection Management
        case 'UPDATE_WALLET_CONNECTION': {
          const result = await handleUpdateWalletConnection(request.data);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'GET_WALLET_CONNECTION': {
          const connection = await getWalletConnection();
          sendResponse({ success: true, data: connection });
          break;
        }

        case 'DISCONNECT_WALLET': {
          await handleDisconnectWallet();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * Generate new DID and keypair
 */
async function handleGenerateDID(password: string) {
  // Check if DID already exists
  const existing = await hasKeypair();
  if (existing) {
    throw new Error('DID already exists');
  }

  // Generate keypair
  const keyPair = generateKeyPair();

  // Create DID document
  const didDocument = createDIDDocument(keyPair.publicKey);

  // Store encrypted keypair
  await storeKeypair(keyPair, password);

  // Store DID document
  await storeDID(didDocument);

  // Log activity
  await logActivity({
    type: 'DID_CREATED',
    timestamp: Date.now(),
    details: { did: didDocument.id },
  });

  console.log('✅ DID generated:', didDocument.id);

  return didDocument;
}

/**
 * Handle permission request from dApp
 */
async function handlePermissionRequest(data: {
  origin: string;
  requestedPermissions: string[];
}) {
  const { origin, requestedPermissions } = data;

  // Get current permissions (for future use)
  // const stored = await chrome.storage.local.get(['permissions']);
  // const _permissions = stored.permissions || {};

  // Store permission request (to be approved by user in popup)
  const requestId = `perm_${Date.now()}`;

  // Store pending request
  await chrome.storage.local.set({
    pendingPermissionRequest: {
      id: requestId,
      origin,
      requestedPermissions,
      timestamp: Date.now(),
    },
  });

  // Show popup for approval
  chrome.action.openPopup();

  // Log activity
  await logActivity({
    type: 'PERMISSION_REQUESTED',
    timestamp: Date.now(),
    details: { origin, permissions: requestedPermissions },
  });

  return { requestId };
}

/**
 * Revoke permission for an origin
 */
async function handleRevokePermission(data: { origin: string }) {
  const { origin } = data;

  const stored = await chrome.storage.local.get(['permissions']);
  const permissions = stored.permissions || {};

  if (permissions[origin]) {
    delete permissions[origin];
    await chrome.storage.local.set({ permissions });

    // Log activity
    await logActivity({
      type: 'PERMISSION_REVOKED',
      timestamp: Date.now(),
      details: { origin },
    });

    return { success: true };
  }

  return { success: false, error: 'No permissions for this origin' };
}

/**
 * Get all granted permissions
 */
async function getPermissions() {
  const stored = await chrome.storage.local.get(['permissions']);
  return stored.permissions || {};
}

/**
 * Log activity to audit trail
 */
async function logActivity(activity: {
  type: string;
  timestamp: number;
  details: any;
}) {
  const stored = await chrome.storage.local.get(['activityLog']);
  const activityLog = stored.activityLog || [];

  activityLog.push(activity);

  // Keep only last 100 activities
  if (activityLog.length > 100) {
    activityLog.shift();
  }

  await chrome.storage.local.set({ activityLog });
}

/**
 * Handle tab updates (for content script injection)
 */
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

/**
 * Initialize Nillion client
 * Nillion operations now go through Next.js API routes
 */
async function handleInitNillion(data: {
  did: string;
}) {
  const { did } = data;

  // Check if already initialized
  if (nillionClient?.isInitialized()) {
    console.log('Nillion client already initialized');
    return {
      status: 'already_initialized',
      collectionIds: Array.from(nillionClient.getCollectionIds().entries()),
    };
  }

  console.log('Initializing Nillion client...');

  // Create client - it will use Next.js API routes
  nillionClient = new VeritasNillionClient({
    // apiBaseUrl defaults to http://localhost:3000
  });

  await nillionClient.initialize(did);

  // Log activity
  await logActivity({
    type: 'NILLION_INITIALIZED',
    timestamp: Date.now(),
    details: {
      collectionIds: Array.from(nillionClient.getCollectionIds().entries()),
    },
  });

  return {
    status: 'initialized',
    collectionIds: Array.from(nillionClient.getCollectionIds().entries()),
  };
}

/**
 * Store health record document
 */
async function handleStoreDocument(data: {
  collection: HealthRecordType;
  record: any;
}) {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { collection, record } = data;

  console.log(`Storing ${collection} document...`);

  const documentId = await nillionClient.storeRecord(collection, record);

  // Log activity
  await logActivity({
    type: 'DOCUMENT_STORED',
    timestamp: Date.now(),
    details: {
      collection,
      documentId,
    },
  });

  return { documentId };
}

/**
 * Get all documents from a collection
 */
async function handleGetDocuments(data: { collection: HealthRecordType }) {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { collection } = data;

  console.log(`Retrieving ${collection} documents...`);

  const documents = await nillionClient.getRecords(collection);

  return { documents };
}

/**
 * Get a single document by ID
 */
async function handleGetDocument(data: { documentId: string }) {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { documentId } = data;

  console.log(`Retrieving document ${documentId}...`);

  const document = await nillionClient.getRecord(documentId);

  return { document };
}

/**
 * Delete a document
 */
async function handleDeleteDocument(data: {
  collection: HealthRecordType;
  documentId: string;
}) {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { collection, documentId } = data;

  console.log(`Deleting document ${documentId}...`);

  await nillionClient.deleteRecord(collection, documentId);

  // Log activity
  await logActivity({
    type: 'DOCUMENT_DELETED',
    timestamp: Date.now(),
    details: { collection, documentId },
  });
}

/**
 * Grant access to external app (extends existing permission handler)
 */
async function handleGrantAccess(data: {
  origin: string;
  permissions: string[];
}) {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { origin, permissions } = data;

  console.log(`Granting Nillion access to ${origin}:`, permissions);

  // Grant access via Nillion
  await nillionClient.grantAccess(origin, permissions);

  // Also store in local permissions
  const stored = await chrome.storage.local.get(['permissions']);
  const allPermissions = stored.permissions || {};

  allPermissions[origin] = {
    permissions,
    grantedAt: Date.now(),
  };

  await chrome.storage.local.set({ permissions: allPermissions });

  // Log activity
  await logActivity({
    type: 'ACCESS_GRANTED',
    timestamp: Date.now(),
    details: { origin, permissions },
  });
}

/**
 * Revoke access from external app (extends existing revoke handler)
 */
async function handleRevokeAccess(data: { origin: string }) {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { origin } = data;

  console.log(`Revoking Nillion access from ${origin}`);

  // Revoke access via Nillion
  await nillionClient.revokeAccess(origin);

  // Also remove from local permissions
  const stored = await chrome.storage.local.get(['permissions']);
  const permissions = stored.permissions || {};

  if (permissions[origin]) {
    delete permissions[origin];
    await chrome.storage.local.set({ permissions });
  }

  // Log activity
  await logActivity({
    type: 'ACCESS_REVOKED',
    timestamp: Date.now(),
    details: { origin },
  });
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessageExternal.addListener((request, _sender, sendResponse) => {
  console.log('External message:', request);

  // Handle postMessage from web pages
  if (request.type === 'VERITAS_REQUEST') {
    // Forward to main message handler
    chrome.runtime.sendMessage(request.data, sendResponse);
    return true;
  }
});

// Periodic cleanup
setInterval(async () => {
  // Clean up old pending requests
  const stored = await chrome.storage.local.get(['pendingPermissionRequest']);

  if (stored.pendingPermissionRequest) {
    const age = Date.now() - stored.pendingPermissionRequest.timestamp;

    // Remove if older than 5 minutes
    if (age > 5 * 60 * 1000) {
      await chrome.storage.local.remove(['pendingPermissionRequest']);
      console.log('Cleaned up old permission request');
    }
  }
}, 60 * 1000); // Every minute

/**
 * Populate sample health data for testing/demo
 */
async function handlePopulateSampleData() {
  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  console.log('Populating sample health data...');

  const allData = getAllSampleHealthData();
  const results = {
    diagnoses: 0,
    biomarkers: 0,
    vitals: 0,
    medications: 0,
    allergies: 0,
  };

  // Store each type of data
  for (const [type, records] of Object.entries(allData)) {
    for (const record of records) {
      try {
        await nillionClient.storeRecord(type as HealthRecordType, record);
        results[type as keyof typeof results]++;
      } catch (error) {
        console.error(`Error storing ${type}:`, error);
      }
    }
  }

  console.log('Sample data populated:', results);

  // Log activity
  await logActivity({
    type: 'SAMPLE_DATA_POPULATED',
    timestamp: Date.now(),
    details: results,
  });

  return results;
}

/**
 * Initialize ZK proof system
 */
async function handleInitZK() {
  // Prevent multiple simultaneous initializations
  if (zkInitPromise) {
    console.log('ZK initialization already in progress...');
    await zkInitPromise;
    return { status: 'initialized', ...getZKStatus() };
  }

  if (isZKInitialized()) {
    console.log('ZK proofs already initialized');
    return { status: 'already_initialized', ...getZKStatus() };
  }

  console.log('Initializing ZK proof system...');

  zkInitPromise = initializeZKProofs();

  try {
    await zkInitPromise;

    // Log activity
    await logActivity({
      type: 'ZK_INITIALIZED',
      timestamp: Date.now(),
      details: getZKStatus(),
    });

    return { status: 'initialized', ...getZKStatus() };
  } finally {
    zkInitPromise = null;
  }
}

/**
 * Generate eligibility proof
 */
async function handleGenerateEligibilityProof(data: {
  eligibilityCode: string;
}) {
  if (!isZKInitialized()) {
    throw new Error('ZK proof system not initialized. Call INIT_ZK first.');
  }

  const { eligibilityCode } = data;

  console.log(`Generating proof for eligibility code: ${eligibilityCode}`);

  const result = await generateEligibilityProof(eligibilityCode);

  // Log activity
  await logActivity({
    type: 'ZK_PROOF_GENERATED',
    timestamp: Date.now(),
    details: {
      eligibilityCode,
      timeMs: result.timeMs,
    },
  });

  return result;
}

/**
 * Verify eligibility proof
 */
async function handleVerifyEligibilityProof(data: {
  proof: any;
  publicInputs: any;
}) {
  if (!isZKInitialized()) {
    throw new Error('ZK proof system not initialized. Call INIT_ZK first.');
  }

  const { proof, publicInputs } = data;

  console.log('Verifying eligibility proof...');

  const result = await verifyEligibilityProof(proof, publicInputs);

  // Log activity
  await logActivity({
    type: 'ZK_PROOF_VERIFIED',
    timestamp: Date.now(),
    details: {
      valid: result.valid,
      timeMs: result.timeMs,
    },
  });

  return result;
}

/**
 * Generate proof from health data stored in Nillion
 */
async function handleGenerateProofFromHealthData(data: {
  dataType: string;
  criteria: { age?: string; minAge?: string; maxAge?: string; studyId?: string };
}) {
  if (!isZKInitialized()) {
    throw new Error('ZK proof system not initialized. Call INIT_ZK first.');
  }

  if (!nillionClient?.isInitialized()) {
    throw new Error('Nillion client not initialized');
  }

  const { dataType, criteria } = data;

  console.log(`Generating proof from health data: ${dataType}`);

  const result = await generateProofFromHealthData(dataType, criteria);

  // Log activity
  await logActivity({
    type: 'ZK_PROOF_FROM_HEALTH_DATA',
    timestamp: Date.now(),
    details: {
      dataType,
      criteria,
      timeMs: result.timeMs,
    },
  });

  return result;
}

/**
 * Update wallet connection from web app
 */
async function handleUpdateWalletConnection(data: {
  origin: string;
  address: string;
  method: string;
  isVerified?: boolean;
  humanityScore?: number;
}) {
  const { origin, address, method, isVerified, humanityScore } = data;

  console.log(`Wallet connected from ${origin}:`, address);

  // Store connection state
  await chrome.storage.local.set({
    ethAddress: address,
    walletConnection: {
      origin,
      address,
      method,
      isVerified: isVerified || false,
      humanityScore: humanityScore || 0,
      connectedAt: Date.now(),
    },
  });

  // Log activity
  await logActivity({
    type: 'WALLET_CONNECTED',
    timestamp: Date.now(),
    details: {
      origin,
      address,
      method,
    },
  });

  // Notify all content scripts that connection was updated
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url?.includes(origin)) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'WALLET_CONNECTION_UPDATED',
        data: {
          address,
          isConnected: true,
          origin,
        },
      }).catch(() => {
        // Content script might not be ready, that's okay
      });
    }
  }

  return { success: true };
}

/**
 * Get current wallet connection
 */
async function getWalletConnection() {
  const stored = await chrome.storage.local.get(['walletConnection', 'ethAddress']);
  return stored.walletConnection || { isConnected: false };
}

/**
 * Disconnect wallet
 */
async function handleDisconnectWallet() {
  console.log('Disconnecting wallet...');

  // Clear connection state
  await chrome.storage.local.remove(['walletConnection', 'ethAddress', 'isVerified']);

  // Log activity
  await logActivity({
    type: 'WALLET_DISCONNECTED',
    timestamp: Date.now(),
    details: {},
  });

  // Notify all content scripts
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'WALLET_CONNECTION_UPDATED',
        data: {
          isConnected: false,
        },
      }).catch(() => {
        // Ignore if content script not ready
      });
    }
  }
}
