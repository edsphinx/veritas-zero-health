/**
 * ZK Proof Service for Browser Extension
 *
 * Handles generation and verification of zero-knowledge proofs for clinical trial eligibility
 * Uses Mopro WASM with Halo2 + Plonkish backend
 */

// WASM initialization status
let wasmInitialized = false;

// Cryptographic keys (loaded from public/zk/)
let srsKey: Uint8Array | null = null;
let provingKey: Uint8Array | null = null;
let verifyingKey: Uint8Array | null = null;

/**
 * Initialize WASM module and load cryptographic keys
 */
export async function initializeZKProofs(): Promise<void> {
  if (wasmInitialized) {
    console.log('ZK proofs already initialized');
    return;
  }

  try {
    console.log('🔐 Initializing ZK proof system...');

    // Load WASM module
    const wasmPath = chrome.runtime.getURL('zk/mopro_wasm_bg.wasm');
    const wasmModuleImport = await import(chrome.runtime.getURL('zk/mopro_wasm.js'));

    await wasmModuleImport.default(wasmPath);

    // Load cryptographic keys
    const [srs, pk, vk] = await Promise.all([
      loadKey('zk/plonk_fibonacci_srs.bin'),
      loadKey('zk/plonk_eligibility_pk.bin'),
      loadKey('zk/plonk_eligibility_vk.bin'),
    ]);

    srsKey = srs;
    provingKey = pk;
    verifyingKey = vk;

    wasmInitialized = true;

    console.log('✅ ZK proof system initialized');
    console.log(`   SRS: ${srsKey.length} bytes`);
    console.log(`   PK:  ${provingKey.length} bytes`);
    console.log(`   VK:  ${verifyingKey.length} bytes`);
  } catch (error) {
    console.error('❌ Failed to initialize ZK proofs:', error);
    throw new Error(`ZK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load cryptographic key from extension assets
 */
async function loadKey(path: string): Promise<Uint8Array> {
  const url = chrome.runtime.getURL(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load key: ${path}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate eligibility proof
 *
 * @param eligibilityCode - The eligibility code to prove (e.g., "100")
 * @returns Proof object with proof bytes and public inputs
 */
export async function generateEligibilityProof(
  eligibilityCode: string
): Promise<{ proof: any; publicInputs: any; timeMs: number }> {
  if (!wasmInitialized) {
    throw new Error('ZK proof system not initialized. Call initializeZKProofs() first.');
  }

  if (!srsKey || !provingKey) {
    throw new Error('Cryptographic keys not loaded');
  }

  try {
    console.log(`🔐 Generating eligibility proof for code: ${eligibilityCode}`);

    const startTime = performance.now();

    // Import WASM functions
    const wasmModule = await import(chrome.runtime.getURL('zk/mopro_wasm.js'));

    // Generate proof
    const input = { code: [eligibilityCode] };
    const result = wasmModule.generate_eligibility_proof(
      srsKey,
      provingKey,
      input
    );

    const endTime = performance.now();
    const timeMs = Math.round(endTime - startTime);

    console.log(`✅ Proof generated in ${timeMs}ms`);

    return {
      proof: result[0],
      publicInputs: result[1],
      timeMs,
    };
  } catch (error) {
    console.error('❌ Proof generation failed:', error);
    throw new Error(`Proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify eligibility proof
 *
 * @param proof - The proof to verify
 * @param publicInputs - The public inputs
 * @returns True if proof is valid
 */
export async function verifyEligibilityProof(
  proof: any,
  publicInputs: any
): Promise<{ valid: boolean; timeMs: number }> {
  if (!wasmInitialized) {
    throw new Error('ZK proof system not initialized. Call initializeZKProofs() first.');
  }

  if (!srsKey || !verifyingKey) {
    throw new Error('Cryptographic keys not loaded');
  }

  try {
    console.log('🔍 Verifying eligibility proof...');

    const startTime = performance.now();

    // Import WASM functions
    const wasmModule = await import(chrome.runtime.getURL('zk/mopro_wasm.js'));

    // Verify proof
    const valid = wasmModule.verify_eligibility_proof(
      srsKey,
      verifyingKey,
      proof,
      publicInputs
    );

    const endTime = performance.now();
    const timeMs = Math.round(endTime - startTime);

    console.log(`${valid ? '✅' : '❌'} Proof verification: ${valid ? 'VALID' : 'INVALID'} (${timeMs}ms)`);

    return { valid, timeMs };
  } catch (error) {
    console.error('❌ Proof verification failed:', error);
    throw new Error(`Proof verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate proof from health data stored in Nillion
 *
 * @param dataType - Type of health data (e.g., 'biomarkers', 'diagnoses')
 * @param criteria - Eligibility criteria to prove
 * @returns Proof object
 */
export async function generateProofFromHealthData(
  dataType: string,
  criteria: { code: string }
): Promise<{ proof: any; publicInputs: any; timeMs: number }> {
  console.log(`📊 Generating proof from health data: ${dataType}`);

  // TODO: In future, fetch actual health data from Nillion and compute eligibility
  // For now, generate proof directly from criteria

  return generateEligibilityProof(criteria.code);
}

/**
 * Check if ZK proof system is initialized
 */
export function isZKInitialized(): boolean {
  return wasmInitialized;
}

/**
 * Get status of ZK proof system
 */
export function getZKStatus(): {
  initialized: boolean;
  srsLoaded: boolean;
  pkLoaded: boolean;
  vkLoaded: boolean;
} {
  return {
    initialized: wasmInitialized,
    srsLoaded: srsKey !== null,
    pkLoaded: provingKey !== null,
    vkLoaded: verifyingKey !== null,
  };
}
