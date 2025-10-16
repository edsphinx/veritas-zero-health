/**
 * Web Worker for generating ZK proofs without blocking the UI
 *
 * This runs snarkjs in a background thread so the UI stays responsive
 * while generating proofs (~10-20 seconds).
 */

importScripts('https://cdn.jsdelivr.net/npm/snarkjs@latest/build/snarkjs.min.js');

// Log when worker is initialized
console.log('[ProofWorker] Worker initialized and ready');

self.onmessage = async (event) => {
    const { type, data } = event.data;

    try {
        if (type === 'GENERATE_PROOF') {
            await generateProof(data);
        } else {
            throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: {
                message: error.message,
                stack: error.stack
            }
        });
    }
};

/**
 * Generate a Groth16 proof using snarkjs
 *
 * @param {Object} data - Proof generation parameters
 * @param {Object} data.input - Circuit inputs (code and requiredCodeHash)
 * @param {string} data.wasmUrl - URL to circuit WASM file
 * @param {string} data.zkeyUrl - URL to proving key file
 */
async function generateProof(data) {
    const { input, wasmUrl, zkeyUrl } = data;

    // Send progress update: Starting
    self.postMessage({
        type: 'PROGRESS',
        progress: 0,
        message: 'Loading circuit files...'
    });

    // Load WASM file
    const wasmResponse = await fetch(wasmUrl);
    if (!wasmResponse.ok) {
        throw new Error(`Failed to load WASM: ${wasmResponse.statusText}`);
    }
    const wasmBuffer = await wasmResponse.arrayBuffer();

    self.postMessage({
        type: 'PROGRESS',
        progress: 20,
        message: 'Loading proving key...'
    });

    // Load zkey file
    const zkeyResponse = await fetch(zkeyUrl);
    if (!zkeyResponse.ok) {
        throw new Error(`Failed to load zkey: ${zkeyResponse.statusText}`);
    }
    const zkeyBuffer = await zkeyResponse.arrayBuffer();

    self.postMessage({
        type: 'PROGRESS',
        progress: 40,
        message: 'Generating witness...'
    });

    // Generate witness
    const witnessCalculator = await snarkjs.wtns.calculate(
        input,
        new Uint8Array(wasmBuffer)
    );

    self.postMessage({
        type: 'PROGRESS',
        progress: 60,
        message: 'Generating proof... (this takes ~10-15s)'
    });

    // Generate proof using Groth16
    const startTime = Date.now();
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        new Uint8Array(wasmBuffer),
        new Uint8Array(zkeyBuffer)
    );
    const duration = (Date.now() - startTime) / 1000;

    self.postMessage({
        type: 'PROGRESS',
        progress: 90,
        message: 'Formatting proof for Solidity...'
    });

    // Format proof for Solidity verifier
    const solidityCalldata = await snarkjs.groth16.exportSolidityCallData(
        proof,
        publicSignals
    );

    // Parse the calldata (it's a string in the format: "a,b,c,inputs")
    const calldataParts = solidityCalldata.split(',');

    // Extract components for Solidity verifier
    // Format: verifyProof(uint[2] a, uint[2][2] b, uint[2] c, uint[1] input)
    const proofFormatted = {
        a: [calldataParts[0], calldataParts[1]],
        b: [
            [calldataParts[2], calldataParts[3]],
            [calldataParts[4], calldataParts[5]]
        ],
        c: [calldataParts[6], calldataParts[7]],
        input: [calldataParts[8]]
    };

    self.postMessage({
        type: 'PROGRESS',
        progress: 100,
        message: 'Proof generated!'
    });

    // Send successful result
    self.postMessage({
        type: 'SUCCESS',
        result: {
            proof: proofFormatted,
            publicSignals,
            duration,
            rawProof: proof
        }
    });
}
