/**
 * Nillion Client for Next.js
 *
 * High-level wrapper for encrypted health data operations via Veritas extension.
 * This client communicates with the browser extension which handles all Nillion operations.
 *
 * Architecture:
 * NillionClient → ExtensionBridge → window.Veritas → Extension → Nillion Network
 *
 * Unlike the browser extension's NillionClient (which uses Nillion SDK directly),
 * this client is a proxy that communicates with the extension via postMessage.
 *
 * @see packages/browser-extension/src/lib/nillion-client.ts (actual Nillion SDK implementation)
 * @see packages/nextjs/infrastructure/extension/ExtensionBridge.ts (communication layer)
 */

import {
  ExtensionBridge,
  getExtensionBridge,
  PermissionDeniedError,
} from '../extension/ExtensionBridge';

import {
  HealthRecordType,
  HealthRecord,
  Diagnosis,
  Biomarker,
  Vital,
  Medication,
  Allergy,
  HealthDataPermission,
  validateHealthRecord,
  createHealthRecord,
} from '@/shared/types/health.types';

/**
 * Nillion Client Configuration
 */
export interface NillionClientConfig {
  extensionBridge?: ExtensionBridge; // Use custom bridge (default: singleton)
  autoRequestPermissions?: boolean; // Auto-request permissions (default: false)
}

/**
 * Health data query options
 */
export interface HealthDataQueryOptions {
  limit?: number; // Max records to return
  offset?: number; // Pagination offset
  sortBy?: 'date' | 'timestamp'; // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort order
}

/**
 * Nillion Client
 *
 * Provides type-safe access to encrypted health data stored in Nillion.
 * All operations are proxied through the browser extension.
 *
 * @example
 * ```typescript
 * const client = new NillionClient();
 * await client.initialize();
 *
 * // Store health data
 * await client.storeDiagnosis({
 *   date: '2025-01-15',
 *   icd10Codes: ['E11.9'],
 *   description: 'Type 2 diabetes',
 *   severity: 'moderate',
 *   status: 'active'
 * });
 *
 * // Retrieve health data
 * const diagnoses = await client.getDiagnoses();
 * ```
 */
export class NillionClient {
  private bridge: ExtensionBridge;
  private config: Required<NillionClientConfig>;
  private initialized: boolean = false;
  private userDID: string | null = null;

  constructor(config: NillionClientConfig = {}) {
    this.bridge = config.extensionBridge || getExtensionBridge();
    this.config = {
      extensionBridge: this.bridge,
      autoRequestPermissions: config.autoRequestPermissions ?? false,
    };
  }

  /**
   * Initialize client and establish connection with extension
   *
   * @throws ExtensionNotInstalledError if extension not available
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize extension bridge
    await this.bridge.initialize();

    // Get user's DID
    try {
      this.userDID = await this.bridge.requestDID();
    } catch (error) {
      console.warn('Failed to get DID from extension:', error);
      // DID might not be created yet, that's ok
    }

    this.initialized = true;
  }

  /**
   * Get user's DID
   */
  async getUserDID(): Promise<string> {
    this.ensureInitialized();

    if (!this.userDID) {
      this.userDID = await this.bridge.requestDID();
    }

    return this.userDID;
  }

  /**
   * Check if user has created their DID
   */
  async hasDID(): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.getUserDID();
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================
  // Permission Management
  // ==========================================

  /**
   * Request permission to access health data
   *
   * @param permissions - Permissions to request
   * @returns true if granted
   */
  async requestPermission(permissions: HealthDataPermission[]): Promise<boolean> {
    this.ensureInitialized();
    return this.bridge.requestPermission(permissions);
  }

  /**
   * Request read permission for specific record type
   */
  private async ensurePermission(recordType: HealthRecordType): Promise<void> {
    if (this.config.autoRequestPermissions) {
      const permission: HealthDataPermission = `read:${recordType}`;
      try {
        await this.bridge.requestPermission([permission]);
      } catch (error) {
        if (error instanceof PermissionDeniedError) {
          throw new Error(`Permission denied for ${recordType}. User must approve access.`);
        }
        throw error;
      }
    }
  }

  // ==========================================
  // Diagnoses
  // ==========================================

  /**
   * Store a diagnosis
   */
  async storeDiagnosis(diagnosis: Omit<Diagnosis, 'id' | 'timestamp'>): Promise<string> {
    this.ensureInitialized();

    const record = createHealthRecord<Diagnosis>('diagnoses', diagnosis);

    if (!validateHealthRecord('diagnoses', record)) {
      throw new Error('Invalid diagnosis record');
    }

    // TODO: Implement store via extension
    // For now, extension's requestData only supports reading
    throw new Error('Store operation not yet implemented in extension API');
  }

  /**
   * Get all diagnoses
   */
  async getDiagnoses(options?: HealthDataQueryOptions): Promise<Diagnosis[]> {
    this.ensureInitialized();
    await this.ensurePermission('diagnoses');

    const data = await this.bridge.requestData('diagnoses');
    return this.applyQueryOptions(data, options);
  }

  /**
   * Get single diagnosis by ID
   */
  async getDiagnosis(id: string): Promise<Diagnosis | null> {
    const diagnoses = await this.getDiagnoses();
    return diagnoses.find((d) => d.id === id) || null;
  }

  // ==========================================
  // Biomarkers
  // ==========================================

  /**
   * Store a biomarker result
   */
  async storeBiomarker(biomarker: Omit<Biomarker, 'id' | 'timestamp'>): Promise<string> {
    this.ensureInitialized();

    const record = createHealthRecord<Biomarker>('biomarkers', biomarker);

    if (!validateHealthRecord('biomarkers', record)) {
      throw new Error('Invalid biomarker record');
    }

    throw new Error('Store operation not yet implemented in extension API');
  }

  /**
   * Get all biomarkers
   */
  async getBiomarkers(options?: HealthDataQueryOptions): Promise<Biomarker[]> {
    this.ensureInitialized();
    await this.ensurePermission('biomarkers');

    const data = await this.bridge.requestData('biomarkers');
    return this.applyQueryOptions(data, options);
  }

  /**
   * Get single biomarker by ID
   */
  async getBiomarker(id: string): Promise<Biomarker | null> {
    const biomarkers = await this.getBiomarkers();
    return biomarkers.find((b) => b.id === id) || null;
  }

  // ==========================================
  // Vitals
  // ==========================================

  /**
   * Store vital signs
   */
  async storeVital(vital: Omit<Vital, 'id' | 'timestamp'>): Promise<string> {
    this.ensureInitialized();

    const record = createHealthRecord<Vital>('vitals', vital);

    if (!validateHealthRecord('vitals', record)) {
      throw new Error('Invalid vital record');
    }

    throw new Error('Store operation not yet implemented in extension API');
  }

  /**
   * Get all vitals
   */
  async getVitals(options?: HealthDataQueryOptions): Promise<Vital[]> {
    this.ensureInitialized();
    await this.ensurePermission('vitals');

    const data = await this.bridge.requestData('vitals');
    return this.applyQueryOptions(data, options);
  }

  /**
   * Get single vital by ID
   */
  async getVital(id: string): Promise<Vital | null> {
    const vitals = await this.getVitals();
    return vitals.find((v) => v.id === id) || null;
  }

  // ==========================================
  // Medications
  // ==========================================

  /**
   * Store medication
   */
  async storeMedication(medication: Omit<Medication, 'id' | 'timestamp'>): Promise<string> {
    this.ensureInitialized();

    const record = createHealthRecord<Medication>('medications', medication);

    if (!validateHealthRecord('medications', record)) {
      throw new Error('Invalid medication record');
    }

    throw new Error('Store operation not yet implemented in extension API');
  }

  /**
   * Get all medications
   */
  async getMedications(options?: HealthDataQueryOptions): Promise<Medication[]> {
    this.ensureInitialized();
    await this.ensurePermission('medications');

    const data = await this.bridge.requestData('medications');
    return this.applyQueryOptions(data, options);
  }

  /**
   * Get single medication by ID
   */
  async getMedication(id: string): Promise<Medication | null> {
    const medications = await this.getMedications();
    return medications.find((m) => m.id === id) || null;
  }

  // ==========================================
  // Allergies
  // ==========================================

  /**
   * Store allergy
   */
  async storeAllergy(allergy: Omit<Allergy, 'id' | 'timestamp'>): Promise<string> {
    this.ensureInitialized();

    const record = createHealthRecord<Allergy>('allergies', allergy);

    if (!validateHealthRecord('allergies', record)) {
      throw new Error('Invalid allergy record');
    }

    throw new Error('Store operation not yet implemented in extension API');
  }

  /**
   * Get all allergies
   */
  async getAllergies(options?: HealthDataQueryOptions): Promise<Allergy[]> {
    this.ensureInitialized();
    await this.ensurePermission('allergies');

    const data = await this.bridge.requestData('allergies');
    return this.applyQueryOptions(data, options);
  }

  /**
   * Get single allergy by ID
   */
  async getAllergy(id: string): Promise<Allergy | null> {
    const allergies = await this.getAllergies();
    return allergies.find((a) => a.id === id) || null;
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Get all health data for a user
   */
  async getAllHealthData(): Promise<{
    diagnoses: Diagnosis[];
    biomarkers: Biomarker[];
    vitals: Vital[];
    medications: Medication[];
    allergies: Allergy[];
  }> {
    this.ensureInitialized();

    // Request all permissions at once
    const allPermissions: HealthDataPermission[] = [
      'read:diagnoses',
      'read:biomarkers',
      'read:vitals',
      'read:medications',
      'read:allergies',
    ];

    await this.bridge.requestPermission(allPermissions);

    // Fetch all data in parallel
    const [diagnoses, biomarkers, vitals, medications, allergies] = await Promise.all([
      this.getDiagnoses(),
      this.getBiomarkers(),
      this.getVitals(),
      this.getMedications(),
      this.getAllergies(),
    ]);

    return {
      diagnoses,
      biomarkers,
      vitals,
      medications,
      allergies,
    };
  }

  /**
   * Check if user has any health data
   */
  async hasHealthData(): Promise<boolean> {
    try {
      const data = await this.getAllHealthData();
      return Object.values(data).some((records) => records.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Apply query options to results
   */
  private applyQueryOptions<T extends HealthRecord>(
    data: T[],
    options?: HealthDataQueryOptions
  ): T[] {
    if (!options) return data;

    let result = [...data];

    // Sort
    if (options.sortBy) {
      result.sort((a, b) => {
        const aVal = options.sortBy === 'date'
          ? new Date(a.date).getTime()
          : (a.timestamp ?? a.createdAt ?? 0);
        const bVal = options.sortBy === 'date'
          ? new Date(b.date).getTime()
          : (b.timestamp ?? b.createdAt ?? 0);

        return options.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    // Pagination
    if (options.offset) {
      result = result.slice(options.offset);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if extension is available
   */
  isExtensionAvailable(): boolean {
    return this.bridge.isExtensionInstalled();
  }

  /**
   * Ensure client is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('NillionClient not initialized. Call initialize() first.');
    }
  }
}

/**
 * Singleton instance
 */
let clientInstance: NillionClient | null = null;

/**
 * Get or create singleton NillionClient
 *
 * @example
 * ```typescript
 * const client = getNillionClient();
 * await client.initialize();
 *
 * const diagnoses = await client.getDiagnoses();
 * ```
 */
export function getNillionClient(config?: NillionClientConfig): NillionClient {
  if (!clientInstance) {
    clientInstance = new NillionClient(config);
  }
  return clientInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetNillionClient(): void {
  clientInstance = null;
}
