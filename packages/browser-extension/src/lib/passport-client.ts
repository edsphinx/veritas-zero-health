/**
 * Human Passport API Client for Browser Extension
 * Communicates with Next.js API backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface PassportScore {
  address: string;
  score: number;
  passing: boolean;
  threshold: number;
  lastUpdated: string;
  expiresAt: string | null;
}

export interface PassportVerification {
  address: string;
  verified: boolean;
  eligibleForHealthIdentity: boolean;
  details: {
    method: 'stamps' | 'double';
    score?: number;
    stampScore?: number;
    modelScore?: number;
    stampsPass?: boolean;
    modelPass?: boolean;
    passing?: boolean;
    threshold?: number;
    thresholds?: {
      minStampScore: number;
      minModelScore: number;
    };
  };
}

export interface PassportStamp {
  id: string;
  provider: string;
  issuedAt: string;
  expiresAt: string;
  issuer: string;
}

export interface PassportStampsResponse {
  address: string;
  count: number;
  stamps: any[];
  stampsByPlatform: Record<string, PassportStamp[]>;
  providers: string[];
}

export class PassportClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * Get Passport score for address
   */
  async getScore(address: string): Promise<PassportScore> {
    const response = await fetch(`${this.baseUrl}/api/passport/score/${address}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to fetch score');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Verify if address is eligible for Health Identity
   *
   * @param address - Ethereum address
   * @param options - Verification options
   */
  async verifyEligibility(
    address: string,
    options?: {
      doubleVerify?: boolean;
      minStampScore?: number;
      minModelScore?: number;
    }
  ): Promise<PassportVerification> {
    const params = new URLSearchParams();

    if (options?.doubleVerify) {
      params.append('doubleVerify', 'true');
    }
    if (options?.minStampScore) {
      params.append('minStampScore', options.minStampScore.toString());
    }
    if (options?.minModelScore) {
      params.append('minModelScore', options.minModelScore.toString());
    }

    const url = `${this.baseUrl}/api/passport/verify/${address}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to verify eligibility');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get all stamps for address
   */
  async getStamps(address: string): Promise<PassportStampsResponse> {
    const response = await fetch(`${this.baseUrl}/api/passport/stamps/${address}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to fetch stamps');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Check if Passport API is configured and available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/passport/score/0x0000000000000000000000000000000000000000`);
      return response.status !== 503; // 503 = service not configured
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const passportClient = new PassportClient();
