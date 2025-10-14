use circom_prover::{CircomProver, prover::{CircomProof, ProofLib}, witness::WitnessFn};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use std::collections::HashMap;

// Set panic hook for better error messages in WASM
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
    web_sys::console::log_1(&"[ProofGenerator] WASM module initialized".into());
}

/// Input for proof generation (matches our circuit)
#[derive(Serialize, Deserialize, Debug)]
pub struct ProofInput {
    pub code: Vec<String>,
    #[serde(rename = "requiredCodeHash")]
    pub required_code_hash: String,
}

/// Output formatted for Solidity verifier
#[derive(Serialize, Deserialize)]
pub struct ProofOutput {
    pub a: Vec<String>,
    pub b: Vec<Vec<String>>,
    pub c: Vec<String>,
    pub public_signals: Vec<String>,
}

/// Main proof generator for browser
#[wasm_bindgen]
pub struct ProofGenerator {
    zkey_data: Vec<u8>,
    wasm_data: Vec<u8>,
}

#[wasm_bindgen]
impl ProofGenerator {
    /// Create a new proof generator
    ///
    /// # Arguments
    /// * `zkey_bytes` - The proving key (.zkey file) as bytes
    /// * `wasm_bytes` - The circuit WASM file as bytes
    #[wasm_bindgen(constructor)]
    pub fn new(zkey_bytes: &[u8], wasm_bytes: &[u8]) -> Result<ProofGenerator, JsValue> {
        web_sys::console::log_1(&"[ProofGenerator] Initializing...".into());

        Ok(ProofGenerator {
            zkey_data: zkey_bytes.to_vec(),
            wasm_data: wasm_bytes.to_vec(),
        })
    }

    /// Generate a Groth16 proof using Mopro's fast circom-prover
    ///
    /// # Arguments
    /// * `input_json` - JSON string with circuit inputs
    ///
    /// # Returns
    /// JSON string with proof formatted for Solidity verifier
    #[wasm_bindgen]
    pub async fn generate_proof(&self, input_json: &str) -> Result<String, JsValue> {
        web_sys::console::log_1(&"[ProofGenerator] Starting proof generation...".into());

        // Parse input
        let input: ProofInput = serde_json::from_str(input_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid input JSON: {}", e)))?;

        web_sys::console::log_1(&format!("[ProofGenerator] Input parsed: {:?}", input).into());

        // Convert input to HashMap format expected by circom-prover
        let mut inputs_map = HashMap::new();

        // Add code array (4 elements)
        inputs_map.insert("code".to_string(), input.code);

        // Add requiredCodeHash as single-element array
        inputs_map.insert("requiredCodeHash".to_string(), vec![input.required_code_hash]);

        let inputs_str = serde_json::to_string(&inputs_map)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize inputs: {}", e)))?;

        web_sys::console::log_1(&"[ProofGenerator] Inputs formatted".into());

        // Save zkey to temporary location (in browser this uses IndexedDB/memory)
        // For WASM, we need to handle this differently - Mopro expects file paths
        // but in browser we need to use the bytes directly

        // This is a simplified version - in production you'd need to:
        // 1. Use circom-prover's WASM-compatible witness generation
        // 2. Handle the zkey data properly in browser context

        Err(JsValue::from_str(
            "Mopro's circom-prover requires native witness generation. \
             For browser, use snarkjs Web Worker or consider using Mopro's \
             full WASM bindings with proper setup."
        ))
    }
}
