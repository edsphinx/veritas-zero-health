/**
 * Nillion Client Wrapper for Veritas Zero Health
 *
 * This client communicates with Next.js API routes that handle Nillion operations.
 * Architecture: Browser Extension → Next.js API → Nillion SecretVaults SDK → Nillion Network
 *
 * Benefits:
 * - No need for complex browser polyfills in extension
 * - Server-side API handles all Nillion SDK complexity
 * - Extension just makes simple HTTP requests
 */

/**
 * Health record types supported by Veritas
 */
export type HealthRecordType = 'diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies';

/**
 * Configuration for Nillion client
 */
export interface NillionConfig {
  apiBaseUrl?: string;      // Next.js API base URL (default: http://localhost:3000)
}

/**
 * Get Nillion configuration from environment variables
 */
function getNillionEnvConfig(): Required<NillionConfig> {
  return {
    apiBaseUrl: import.meta.env.VITE_NEXTJS_API_URL || 'http://localhost:3000',
  };
}

/**
 * Health record stored in Nillion
 */
export interface HealthRecord {
  id?: string;              // Record ID (auto-generated)
  type: HealthRecordType;   // Type of health record
  data: any;                // Health record data (encrypted)
  timestamp: number;        // Creation timestamp
  userId: string;           // User's Veritas DID
}

/**
 * Permission grant for external apps
 */
export interface PermissionGrant {
  appOrigin: string;
  permissions: string[];  // e.g., ['read:diagnoses', 'read:biomarkers']
  grantedAt: number;
  expiresAt: number | null;
}

/**
 * Veritas Nillion Client
 *
 * Manages encrypted health records using Nillion Private Storage.
 *
 * TODO: Implement with current SecretVaults SDK
 */
export class VeritasNillionClient {
  private config: Required<NillionConfig>;
  private initialized: boolean = false;
  private collectionIds: Map<HealthRecordType, string> = new Map();
  private userDID: string | null = null;

  constructor(config: NillionConfig = {}) {
    // Merge provided config with env vars (provided config takes precedence)
    const envConfig = getNillionEnvConfig();

    this.config = {
      apiBaseUrl: config.apiBaseUrl ?? envConfig.apiBaseUrl,
    };

    console.log('Nillion client configured:', {
      apiBaseUrl: this.config.apiBaseUrl,
    });
  }

  /**
   * Initialize Nillion client
   * The actual Nillion operations happen on the Next.js server
   */
  async initialize(userDID: string): Promise<void> {
    if (this.initialized) {
      console.log('Nillion client already initialized');
      return;
    }

    this.userDID = userDID;

    console.log('✅ Nillion client initialized - using Next.js API at:', this.config.apiBaseUrl);

    this.initialized = true;
  }

  /**
   * Store a health record in Nillion via Next.js API
   */
  async storeRecord(
    type: HealthRecordType,
    data: any
  ): Promise<string> {
    this.ensureInitialized();

    console.log(`📤 Storing ${type} record via Next.js API...`);

    const response = await fetch(`${this.config.apiBaseUrl}/api/nillion/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        userId: this.userDID,
        data,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to store record');
    }

    console.log(`✅ Stored ${type} record:`, result.data.recordId);

    return result.data.recordId;
  }

  /**
   * Retrieve health records by type via Next.js API
   */
  async getRecords(type: HealthRecordType): Promise<HealthRecord[]> {
    this.ensureInitialized();

    console.log(`📥 Fetching ${type} records via Next.js API...`);

    const url = new URL(`${this.config.apiBaseUrl}/api/nillion/retrieve`);
    url.searchParams.set('type', type);
    if (this.userDID) {
      url.searchParams.set('userId', this.userDID);
    }

    console.log(`   URL: ${url.toString()}`);

    try {
      const response = await fetch(url.toString());

      console.log(`   Response status: ${response.status}`);
      console.log(`   Response headers:`, Object.fromEntries(response.headers.entries()));

      const result = await response.json();

      console.log(`   Response:`, result);

      if (!result.success) {
        console.error(`   Error: ${result.error}`);
        throw new Error(result.error || 'Failed to retrieve records');
      }

      console.log(`✅ Retrieved ${result.data.count} ${type} records`);

      return result.data.records;
    } catch (error) {
      console.error(`   Fetch error for ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get a single record by ID
   *
   * TODO: Implement with current SecretVaults SDK
   */
  async getRecord(recordId: string): Promise<HealthRecord | null> {
    this.ensureInitialized();

    console.log(`⚠️  Mock: Retrieving record ${recordId}...`);

    // TODO: Use builderClient.findData() with specific filter

    return null;
  }

  /**
   * Delete a health record via Next.js API
   */
  async deleteRecord(type: HealthRecordType, recordId: string): Promise<void> {
    this.ensureInitialized();

    console.log(`🗑️  Deleting ${type} record ${recordId} via Next.js API...`);

    const response = await fetch(`${this.config.apiBaseUrl}/api/nillion/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        recordId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete record');
    }

    console.log(`✅ Deleted ${type} record: ${recordId}`);
  }

  /**
   * Get all records across all types
   */
  async getAllRecords(): Promise<Map<HealthRecordType, HealthRecord[]>> {
    this.ensureInitialized();

    const allRecords = new Map<HealthRecordType, HealthRecord[]>();
    const recordTypes: HealthRecordType[] = ['diagnoses', 'biomarkers', 'vitals', 'medications', 'allergies'];

    for (const type of recordTypes) {
      try {
        const records = await this.getRecords(type);
        allRecords.set(type, records);
      } catch (error) {
        console.error(`Failed to get ${type} records:`, error);
        allRecords.set(type, []);
      }
    }

    return allRecords;
  }

  /**
   * Grant access to an external app (placeholder)
   */
  async grantAccess(
    appOrigin: string,
    _permissions: string[]
  ): Promise<void> {
    this.ensureInitialized();

    console.log(`⚠️  Mock: Granting access to ${appOrigin}`);

    // TODO: Implement Nillion access control policies
  }

  /**
   * Revoke access from an external app (placeholder)
   */
  async revokeAccess(appOrigin: string): Promise<void> {
    this.ensureInitialized();

    console.log(`⚠️  Mock: Revoking access from ${appOrigin}`);

    // TODO: Implement Nillion access control revocation
  }

  /**
   * Get current user's DID
   */
  getUserDID(): string | null {
    return this.userDID;
  }

  /**
   * Get collection IDs
   */
  getCollectionIds(): Map<HealthRecordType, string> {
    return this.collectionIds;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure client is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Nillion client not initialized. Call initialize() first.');
    }
  }

  /**
   * Destroy client and cleanup resources
   */
  async destroy(): Promise<void> {
    console.log('Destroying Nillion client...');

    this.collectionIds.clear();
    this.userDID = null;
    this.initialized = false;

    console.log('✅ Nillion client destroyed');
  }
}

/**
 * Helper function to create and initialize Nillion client
 */
export async function createNillionClient(
  config: NillionConfig,
  userDID: string
): Promise<VeritasNillionClient> {
  const client = new VeritasNillionClient(config);
  await client.initialize(userDID);
  return client;
}
