/**
 * ProofGenerator - TypeScript wrapper for generating ZK proofs in browser
 *
 * Uses Web Workers to keep UI responsive during proof generation (~10-20s)
 */

export interface ProofInput {
  code: string[];
  requiredCodeHash: string;
}

export interface ProofResult {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    input: [string];
  };
  publicSignals: string[];
  duration: number;
  rawProof: any;
}

export type ProofProgress = {
  progress: number; // 0-100
  message: string;
};

export class ProofGenerator {
  private worker: Worker | null = null;
  private wasmUrl: string;
  private zkeyUrl: string;

  /**
   * Create a new proof generator
   *
   * @param wasmUrl - URL to the circuit WASM file (e.g., "/circuits/eligibility_code.wasm")
   * @param zkeyUrl - URL to the proving key (e.g., "/circuits/eligibility_0000.zkey")
   */
  constructor(wasmUrl: string, zkeyUrl: string) {
    this.wasmUrl = wasmUrl;
    this.zkeyUrl = zkeyUrl;
  }

  /**
   * Generate a ZK proof
   *
   * @param input - Circuit inputs
   * @param onProgress - Callback for progress updates
   * @returns Promise that resolves with the proof
   */
  async generateProof(
    input: ProofInput,
    onProgress?: (progress: ProofProgress) => void
  ): Promise<ProofResult> {
    return new Promise((resolve, reject) => {
      // Create worker
      this.worker = new Worker('/proof-worker.js');

      // Handle messages from worker
      this.worker.onmessage = (event) => {
        const { type, progress, message, result, error } = event.data;

        switch (type) {
          case 'PROGRESS':
            if (onProgress) {
              onProgress({ progress, message });
            }
            break;

          case 'SUCCESS':
            this.cleanup();
            resolve(result);
            break;

          case 'ERROR':
            this.cleanup();
            reject(new Error(error.message));
            break;
        }
      };

      // Handle worker errors
      this.worker.onerror = (error) => {
        this.cleanup();
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Send proof generation request
      this.worker.postMessage({
        type: 'GENERATE_PROOF',
        data: {
          input,
          wasmUrl: this.wasmUrl,
          zkeyUrl: this.zkeyUrl
        }
      });
    });
  }

  /**
   * Cancel ongoing proof generation
   */
  cancel() {
    this.cleanup();
  }

  /**
   * Clean up worker
   */
  private cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// React Hook for easier usage
export function useProofGenerator(wasmUrl: string, zkeyUrl: string) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState<ProofProgress | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const generatorRef = React.useRef<ProofGenerator | null>(null);

  React.useEffect(() => {
    generatorRef.current = new ProofGenerator(wasmUrl, zkeyUrl);

    return () => {
      generatorRef.current?.cancel();
    };
  }, [wasmUrl, zkeyUrl]);

  const generateProof = React.useCallback(
    async (input: ProofInput): Promise<ProofResult | null> => {
      if (!generatorRef.current) {
        throw new Error('ProofGenerator not initialized');
      }

      setIsGenerating(true);
      setError(null);
      setProgress(null);

      try {
        const result = await generatorRef.current.generateProof(
          input,
          (p) => setProgress(p)
        );
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsGenerating(false);
        setProgress(null);
      }
    },
    []
  );

  const cancel = React.useCallback(() => {
    generatorRef.current?.cancel();
    setIsGenerating(false);
    setProgress(null);
  }, []);

  return {
    generateProof,
    cancel,
    isGenerating,
    progress,
    error
  };
}

// Import React for the hook
import * as React from 'react';
