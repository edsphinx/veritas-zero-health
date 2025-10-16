/**
 * Nillion Server Client
 *
 * Server-side SecretVaults SDK client for Next.js API routes.
 * Handles encrypted storage and retrieval of health records.
 *
 * Architecture:
 * Browser Extension → Next.js API Routes → NillionServerClient → Nillion Network
 */

import { SecretVaultBuilderClient } from '@nillion/secretvaults';
import { Keypair } from '@nillion/nuc';
import { v4 as uuidv4 } from 'uuid';

/**
 * Health record types matching collection schemas
 */
export type HealthRecordType = 'diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies';

/**
 * Nillion server configuration from environment
 */
interface NillionConfig {
  urls: {
    chain: string;
    auth: string;
    dbs: string[];
  };
  collections: {
    diagnoses: string;
    biomarkers: string;
    vitals: string;
    medications: string;
    allergies: string;
  };
  network: string;
}

/**
 * Health record structure matching Nillion collection schema
 */
interface HealthRecordPayload {
  _id: string;
  userId: string;
  timestamp: number;
  recordType: HealthRecordType;
  data: {
    '%allot': string; // Encrypted data (JSON stringified)
  };
}

/**
 * Store operation result
 */
interface StoreResult {
  recordId: string;
  collectionId: string;
  timestamp: number;
}

/**
 * Retrieve operation result
 */
interface RetrieveResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: any[];
  count: number;
}

/**
 * Load Nillion configuration from environment variables
 */
function loadNillionConfig(): NillionConfig {
  const chainUrl = process.env.NILLION_CHAIN_URL;
  const authUrl = process.env.NILLION_AUTH_URL;
  const nodeUrlsStr = process.env.NILLION_NODE_URLS;
  const network = process.env.NILLION_NETWORK || 'testnet';

  if (!chainUrl) {
    throw new Error('NILLION_CHAIN_URL not set in environment');
  }

  if (!authUrl) {
    throw new Error('NILLION_AUTH_URL not set in environment');
  }

  if (!nodeUrlsStr) {
    throw new Error('NILLION_NODE_URLS not set in environment');
  }

  const dbs = nodeUrlsStr.split(',').map((url) => url.trim());

  if (dbs.length === 0) {
    throw new Error('NILLION_NODE_URLS must contain at least one URL');
  }

  // Load collection IDs
  const collections = {
    diagnoses: process.env.NILLION_COLLECTION_DIAGNOSES || '',
    biomarkers: process.env.NILLION_COLLECTION_BIOMARKERS || '',
    vitals: process.env.NILLION_COLLECTION_VITALS || '',
    medications: process.env.NILLION_COLLECTION_MEDICATIONS || '',
    allergies: process.env.NILLION_COLLECTION_ALLERGIES || '',
  };

  // Validate that we have at least some collection IDs
  const validCollections = Object.values(collections).filter((id) => id !== '');
  if (validCollections.length === 0) {
    throw new Error('No Nillion collection IDs configured. Set NILLION_COLLECTION_* env vars.');
  }

  return {
    urls: {
      chain: chainUrl,
      auth: authUrl,
      dbs,
    },
    collections,
    network,
  };
}

/**
 * Nillion Server Client
 *
 * Provides server-side access to Nillion SecretVaults for storing/retrieving
 * encrypted health records.
 */
export class NillionServerClient {
  private config: NillionConfig;
  private client: SecretVaultBuilderClient | null = null;
  private initialized: boolean = false;

  constructor() {
    this.config = loadNillionConfig();
  }

  /**
   * Initialize SecretVaults client
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.client) {
      return;
    }

    console.log('🔐 Initializing Nillion SecretVaults client...');
    console.log(`   Network: ${this.config.network}`);
    console.log(`   Nodes: ${this.config.urls.dbs.length}`);

    try {
      // Create keypair for builder
      const keypair = Keypair.generate();

      // Initialize SecretVaultBuilderClient with from() static method
      this.client = await SecretVaultBuilderClient.from({
        keypair,
        urls: this.config.urls,
        blindfold: {
          operation: 'store', // For storing concealed data
        },
      });

      this.initialized = true;
      console.log('✅ Nillion client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Nillion client:', error);
      throw new Error(
        `Nillion initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Store health record in Nillion
   *
   * @param type - Type of health record
   * @param userId - User's DID
   * @param data - Health data to encrypt and store
   * @returns Record ID
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async storeRecord(type: HealthRecordType, userId: string, data: any): Promise<StoreResult> {
    await this.ensureInitialized();

    const collectionId = this.config.collections[type];
    if (!collectionId) {
      throw new Error(`Collection ID not configured for type: ${type}`);
    }

    console.log(`📤 Storing ${type} record for user ${userId.slice(0, 20)}...`);

    try {
      // Create record payload matching schema
      const recordId = uuidv4();
      const payload: HealthRecordPayload = {
        _id: recordId,
        userId,
        timestamp: Date.now(),
        recordType: type,
        data: {
          '%allot': JSON.stringify(data), // Data to be encrypted
        },
      };

      // Store record via SecretVaults SDK
      await this.client!.createStandardData({
        body: {
          collection: collectionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: [payload as any],
        },
      });

      console.log(`✅ Stored ${type} record: ${recordId}`);

      return {
        recordId,
        collectionId,
        timestamp: payload.timestamp,
      };
    } catch (error) {
      console.error(`❌ Failed to store ${type} record:`, error);
      throw new Error(`Store failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve health records from Nillion
   *
   * @param type - Type of health records to retrieve
   * @param userId - User's DID (optional filter)
   * @returns Array of decrypted records
   */
  async retrieveRecords(type: HealthRecordType, userId?: string): Promise<RetrieveResult> {
    await this.ensureInitialized();

    const collectionId = this.config.collections[type];
    if (!collectionId) {
      throw new Error(`Collection ID not configured for type: ${type}`);
    }

    console.log(`📥 Retrieving ${type} records${userId ? ` for user ${userId.slice(0, 20)}...` : '...'}`);

    try {
      // Build filter query
      const filter = userId ? { userId } : {};

      // Retrieve records via SecretVaults SDK
      const response = await this.client!.findData({
        collection: collectionId,
        filter,
      });

      // Parse encrypted data (response.data is the array)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = (response.data || []).map((record: any) => {
        try {
          // Decrypt and parse data field
          const decryptedData = record.data?.['%allot'] || record.data;
          const parsedData = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;

          return {
            id: record._id,
            userId: record.userId,
            timestamp: record.timestamp,
            type: record.recordType,
            data: parsedData,
          };
        } catch (parseError) {
          console.warn(`Failed to parse record ${record._id}:`, parseError);
          return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).filter((record: any) => record !== null);

      console.log(`✅ Retrieved ${records.length} ${type} records`);

      return {
        records,
        count: records.length,
      };
    } catch (error) {
      console.error(`❌ Failed to retrieve ${type} records:`, error);
      throw new Error(`Retrieve failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete health record from Nillion
   *
   * @param type - Type of health record
   * @param recordId - Record ID to delete
   */
  async deleteRecord(type: HealthRecordType, recordId: string): Promise<void> {
    await this.ensureInitialized();

    const collectionId = this.config.collections[type];
    if (!collectionId) {
      throw new Error(`Collection ID not configured for type: ${type}`);
    }

    console.log(`🗑️  Deleting ${type} record: ${recordId}`);

    try {
      await this.client!.deleteData({
        collection: collectionId,
        filter: { _id: recordId },
      });
      console.log(`✅ Deleted ${type} record: ${recordId}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${type} record:`, error);
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all records for a user across all types
   *
   * @param userId - User's DID
   * @returns Map of record type to records
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllRecords(userId: string): Promise<Map<HealthRecordType, any[]>> {
    await this.ensureInitialized();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRecords = new Map<HealthRecordType, any[]>();
    const types: HealthRecordType[] = ['diagnoses', 'biomarkers', 'vitals', 'medications', 'allergies'];

    for (const type of types) {
      try {
        if (this.config.collections[type]) {
          const result = await this.retrieveRecords(type, userId);
          allRecords.set(type, result.records);
        }
      } catch (error) {
        console.error(`Failed to get ${type} records:`, error);
        allRecords.set(type, []);
      }
    }

    return allRecords;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Get collection ID for a record type
   */
  getCollectionId(type: HealthRecordType): string {
    return this.config.collections[type];
  }

  /**
   * Get all configured collection IDs
   */
  getAllCollectionIds(): Record<HealthRecordType, string> {
    return { ...this.config.collections };
  }

  /**
   * Ensure client is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.client) {
      await this.initialize();
    }
  }
}

/**
 * Singleton instance for reuse across API requests
 */
let serverClientInstance: NillionServerClient | null = null;

/**
 * Get or create Nillion server client singleton
 *
 * @example
 * ```typescript
 * const client = getNillionServerClient();
 * await client.storeRecord('diagnoses', userDid, diagnosisData);
 * ```
 */
export function getNillionServerClient(): NillionServerClient {
  if (!serverClientInstance) {
    serverClientInstance = new NillionServerClient();
  }
  return serverClientInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetNillionServerClient(): void {
  serverClientInstance = null;
}
