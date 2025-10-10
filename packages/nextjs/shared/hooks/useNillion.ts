/**
 * useNillion Hook
 *
 * React hook for interacting with encrypted health data via Nillion network.
 * Provides methods to store and retrieve health records through the browser extension.
 *
 * @example
 * ```typescript
 * function HealthDashboard() {
 *   const {
 *     isReady,
 *     userDID,
 *     diagnoses,
 *     biomarkers,
 *     loading,
 *     error,
 *     requestPermissions,
 *     fetchHealthData,
 *   } = useNillion();
 *
 *   useEffect(() => {
 *     if (isReady) {
 *       requestPermissions(['read:diagnoses', 'read:biomarkers']);
 *     }
 *   }, [isReady]);
 *
 *   return <HealthRecordsList records={diagnoses} />;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getNillionClient, NillionClient } from '@/infrastructure/nillion/NillionClient';
import type {
  Diagnosis,
  Biomarker,
  Vital,
  Medication,
  Allergy,
  HealthDataPermission,
} from '@/shared/types/health.types';

export interface UseNillionOptions {
  /** Auto-initialize on mount */
  autoInit?: boolean;
  /** Auto-request permissions on mount */
  autoRequestPermissions?: HealthDataPermission[];
  /** Auto-fetch data after permissions granted */
  autoFetch?: boolean;
}

export interface UseNillionReturn {
  /** Whether Nillion client is initialized and ready */
  isReady: boolean;
  /** User's DID (Decentralized Identifier) */
  userDID: string | null;
  /** Whether user has created their DID */
  hasDID: boolean;

  // Health data
  diagnoses: Diagnosis[];
  biomarkers: Biomarker[];
  vitals: Vital[];
  medications: Medication[];
  allergies: Allergy[];

  // State
  loading: boolean;
  error: Error | null;

  // Methods
  initialize: () => Promise<void>;
  requestPermissions: (permissions: HealthDataPermission[]) => Promise<boolean>;
  fetchHealthData: (types?: ('diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies')[]) => Promise<void>;
  getDiagnoses: () => Promise<Diagnosis[]>;
  getBiomarkers: () => Promise<Biomarker[]>;
  getVitals: () => Promise<Vital[]>;
  getMedications: () => Promise<Medication[]>;
  getAllergies: () => Promise<Allergy[]>;

  /** Nillion client instance (for advanced usage) */
  client: NillionClient;
}

/**
 * Hook for accessing encrypted health data via Nillion
 *
 * @param options - Configuration options
 * @returns Nillion state and methods
 */
export function useNillion(options: UseNillionOptions = {}): UseNillionReturn {
  const {
    autoInit = false,
    autoRequestPermissions = [],
    autoFetch = false,
  } = options;

  // Client instance (singleton)
  const [client] = useState(() => getNillionClient());

  // State
  const [isReady, setIsReady] = useState(false);
  const [userDID, setUserDID] = useState<string | null>(null);
  const [hasDID, setHasDID] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Health data
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);

  /**
   * Initialize Nillion client
   */
  const initialize = useCallback(async () => {
    if (isReady) return;

    setLoading(true);
    setError(null);

    try {
      await client.initialize();
      setIsReady(true);

      // Try to get user's DID
      try {
        const did = await client.getUserDID();
        setUserDID(did);
        setHasDID(true);
      } catch (err) {
        // DID might not exist yet
        setHasDID(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Nillion client');
      setError(error);
      setIsReady(false);
    } finally {
      setLoading(false);
    }
  }, [client, isReady]);

  /**
   * Request permissions to access health data
   */
  const requestPermissions = useCallback(async (permissions: HealthDataPermission[]): Promise<boolean> => {
    if (!isReady) {
      throw new Error('Nillion client not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const granted = await client.requestPermission(permissions);
      return granted;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Permission request failed');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, isReady]);

  /**
   * Fetch specific health data types
   */
  const fetchHealthData = useCallback(async (
    types: ('diagnoses' | 'biomarkers' | 'vitals' | 'medications' | 'allergies')[] = [
      'diagnoses',
      'biomarkers',
      'vitals',
      'medications',
      'allergies',
    ]
  ): Promise<void> => {
    if (!isReady) {
      throw new Error('Nillion client not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch requested types in parallel
      const promises = types.map(async (type) => {
        switch (type) {
          case 'diagnoses':
            return client.getDiagnoses().then(setDiagnoses);
          case 'biomarkers':
            return client.getBiomarkers().then(setBiomarkers);
          case 'vitals':
            return client.getVitals().then(setVitals);
          case 'medications':
            return client.getMedications().then(setMedications);
          case 'allergies':
            return client.getAllergies().then(setAllergies);
        }
      });

      await Promise.all(promises);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch health data');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [client, isReady]);

  /**
   * Individual fetch methods
   */
  const getDiagnoses = useCallback(async (): Promise<Diagnosis[]> => {
    const data = await client.getDiagnoses();
    setDiagnoses(data);
    return data;
  }, [client]);

  const getBiomarkers = useCallback(async (): Promise<Biomarker[]> => {
    const data = await client.getBiomarkers();
    setBiomarkers(data);
    return data;
  }, [client]);

  const getVitals = useCallback(async (): Promise<Vital[]> => {
    const data = await client.getVitals();
    setVitals(data);
    return data;
  }, [client]);

  const getMedications = useCallback(async (): Promise<Medication[]> => {
    const data = await client.getMedications();
    setMedications(data);
    return data;
  }, [client]);

  const getAllergies = useCallback(async (): Promise<Allergy[]> => {
    const data = await client.getAllergies();
    setAllergies(data);
    return data;
  }, [client]);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInit && !isReady) {
      initialize();
    }
  }, [autoInit, isReady, initialize]);

  /**
   * Auto-request permissions after initialization
   */
  useEffect(() => {
    if (isReady && autoRequestPermissions.length > 0) {
      requestPermissions(autoRequestPermissions);
    }
  }, [isReady, autoRequestPermissions, requestPermissions]);

  /**
   * Auto-fetch data after permissions
   */
  useEffect(() => {
    if (isReady && autoFetch && !loading) {
      fetchHealthData();
    }
  }, [isReady, autoFetch, loading, fetchHealthData]);

  return {
    isReady,
    userDID,
    hasDID,

    // Health data
    diagnoses,
    biomarkers,
    vitals,
    medications,
    allergies,

    // State
    loading,
    error,

    // Methods
    initialize,
    requestPermissions,
    fetchHealthData,
    getDiagnoses,
    getBiomarkers,
    getVitals,
    getMedications,
    getAllergies,

    // Client
    client,
  };
}
