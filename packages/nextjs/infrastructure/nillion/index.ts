/**
 * Nillion Infrastructure
 *
 * Encrypted health data storage via Veritas browser extension (client-side)
 * and direct Nillion network access (server-side API routes)
 */

// Client-side (browser) - communicates with extension
export {
  NillionClient,
  getNillionClient,
  resetNillionClient,
  type NillionClientConfig,
  type HealthDataQueryOptions,
} from './NillionClient';

// Server-side (API routes) - communicates directly with Nillion network
export {
  NillionServerClient,
  getNillionServerClient,
  resetNillionServerClient,
  type HealthRecordType,
} from './NillionServerClient';
