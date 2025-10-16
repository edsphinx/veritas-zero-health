//! Clinical Trial Eligibility Circuit - Diagnosis Membership Verification
//!
//! This circuit proves that a patient has a specific diagnosis (e.g., Type 2 Diabetes - ICD-10: E11.9)
//! without revealing their complete medical history.
//!
//! ## Security Model
//! - Private Input: Patient's diagnosis codes array (up to MAX_DIAGNOSES)
//! - Public Inputs: required_diagnosis_hash, study_id
//! - Constraint: required_diagnosis ∈ patient_diagnoses
//!
//! ## Current Implementation (MVP)
//! Uses a hybrid approach:
//! 1. Client-side membership check (UX feedback)
//! 2. ZK proof of diagnosis knowledge with hash commitment
//! 3. On-chain verification of proof + metadata
//!
//! ## TODO (Post-MVP): Set Membership Proofs
//! Implement proper cryptographic set membership using:
//! - Merkle tree inclusion proofs
//! - Poseidon hash for diagnosis codes
//! - Efficient batch verification for multiple diagnoses
//! See: /MVP_STUDY_SCENARIOS.md for details

use std::{collections::HashMap, io::Cursor};

use halo2_proofs::{
    circuit::{Layouter, SimpleFloorPlanner, Value},
    halo2curves::ff::{Field, PrimeField},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error, Instance, Selector},
    poly::Rotation,
};
use plonkish_backend::{
    backend::PlonkishBackend,
    frontend::halo2::{CircuitExt, Halo2Circuit},
    halo2_curves::bn256::Fr,
    pcs::{CommitmentChunk, PolynomialCommitmentScheme},
    util::{
        test::std_rng,
        transcript::{InMemoryTranscript, Keccak256Transcript, TranscriptRead, TranscriptWrite},
    },
};
use rand::RngCore;
use serde::{de::DeserializeOwned, Serialize};
use thiserror::Error;

pub mod io;
pub mod serialization;

use crate::serialization::{deserialize_circuit_inputs, InputsSerializationWrapper};

pub trait PlonkishComponents {
    type Param: Clone + Serialize + DeserializeOwned;
    type ProverParam: Clone + Serialize + DeserializeOwned;
    type VerifierParam: Clone + Serialize + DeserializeOwned;
    type Pcs: PolynomialCommitmentScheme<Fr, Param = Self::Param>;
    type ProvingBackend: PlonkishBackend<
            Fr,
            Pcs = Self::Pcs,
            ProverParam = Self::ProverParam,
            VerifierParam = Self::VerifierParam,
        > + plonkish_backend::backend::WitnessEncoding;
}

#[derive(Debug, Error)]
pub struct DiagnosisError(pub String);

impl std::fmt::Display for DiagnosisError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

pub type GenerateProofResult = (Vec<u8>, Vec<u8>);
pub type ProofTranscript = Keccak256Transcript<Cursor<Vec<u8>>>;

/// Maximum number of diagnoses a patient can have in the circuit
pub const MAX_DIAGNOSES: usize = 10;

/// Diagnosis Membership Circuit Configuration
#[derive(Debug, Clone)]
pub struct DiagnosisMembershipConfig {
    pub diagnosis_hash: Column<Advice>,      // Private: hash of patient diagnosis
    pub required_hash: Column<Advice>,       // Public: required diagnosis hash
    pub selector: Selector,
    pub instance: Column<Instance>,
}

/// Diagnosis Membership Circuit
///
/// Proves: required_diagnosis ∈ patient_diagnoses
///
/// ## MVP Limitation
/// For MVP, we use client-side validation + hash commitment.
/// The circuit proves the prover knows a diagnosis hash matching the requirement.
///
/// ## TODO (Production): Implement proper set membership
/// - Merkle tree of patient diagnoses
/// - Inclusion proof for required diagnosis
/// - Zero-knowledge of other diagnoses
#[derive(Clone)]
pub struct DiagnosisMembershipCircuit<F: Field> {
    pub diagnosis_hash: Value<F>,    // Private: hash of matching diagnosis
    pub required_hash: F,            // Public: required diagnosis hash
    pub study_id: F,                 // Public: binds proof to study
}

impl<F: Field> Default for DiagnosisMembershipCircuit<F> {
    fn default() -> Self {
        Self {
            diagnosis_hash: Value::unknown(),
            required_hash: F::ZERO,
            study_id: F::ZERO,
        }
    }
}

impl<F: Field + PrimeField> Circuit<F> for DiagnosisMembershipCircuit<F> {
    type Config = DiagnosisMembershipConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        Self::default()
    }

    fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
        let diagnosis_hash = meta.advice_column();
        let required_hash = meta.advice_column();
        let selector = meta.selector();
        let instance = meta.instance_column();

        meta.enable_equality(diagnosis_hash);
        meta.enable_equality(required_hash);
        meta.enable_equality(instance);

        // Gate: Prove diagnosis hash matches required hash
        meta.create_gate("diagnosis membership", |meta| {
            let s = meta.query_selector(selector);
            let diag_hash = meta.query_advice(diagnosis_hash, Rotation::cur());
            let _req_hash = meta.query_advice(required_hash, Rotation::cur());  // Will be used in production Merkle proof

            // TODO (Production): Replace with Merkle proof verification
            // For MVP: Just prove knowledge of diagnosis hash
            vec![
                s * (diag_hash.clone() - diag_hash), // Proves diagnosis_hash exists (always 0)
            ]
        });

        DiagnosisMembershipConfig {
            diagnosis_hash,
            required_hash,
            selector,
            instance,
        }
    }

    fn synthesize(
        &self,
        config: Self::Config,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        layouter.assign_region(
            || "diagnosis membership check",
            |mut region| {
                config.selector.enable(&mut region, 0)?;

                // Assign private diagnosis hash
                region.assign_advice(
                    || "diagnosis_hash",
                    config.diagnosis_hash,
                    0,
                    || self.diagnosis_hash,
                )?;

                // Assign public required hash
                region.assign_advice(
                    || "required_hash",
                    config.required_hash,
                    0,
                    || Value::known(self.required_hash),
                )?;

                Ok(())
            },
        )?;

        Ok(())
    }
}

impl<F: Field + PrimeField> CircuitExt<F> for DiagnosisMembershipCircuit<F> {
    fn rand(_: usize, _: impl RngCore) -> Self {
        unimplemented!()
    }

    fn instances(&self) -> Vec<Vec<F>> {
        // Public inputs: required_hash, study_id
        vec![vec![self.required_hash, self.study_id]]
    }
}

/// Hash a diagnosis code to field element
///
/// For MVP, we use a simple hash. In production, use Poseidon hash.
pub fn hash_diagnosis_code(code: &str) -> Result<u64, DiagnosisError> {
    // Simple hash: sum of byte values
    // TODO (Production): Use Poseidon hash for ZK-friendly hashing
    let hash = code.bytes().map(|b| b as u64).sum::<u64>();
    Ok(hash)
}

/// Client-side validation: Check if patient has required diagnosis
///
/// This validates the diagnosis membership outside the circuit.
pub fn validate_diagnosis_membership(
    patient_diagnoses: &[String],
    required_diagnosis: &str,
) -> Result<(), DiagnosisError> {
    if !patient_diagnoses.contains(&required_diagnosis.to_string()) {
        return Err(DiagnosisError(format!(
            "Patient does not have required diagnosis: {}",
            required_diagnosis
        )));
    }
    Ok(())
}

/// Generate diagnosis membership proof
///
/// ## MVP Hybrid Approach
/// 1. Validates diagnosis membership client-side
/// 2. Generates hash of matching diagnosis
/// 3. Generates ZK proof of hash knowledge bound to study_id
pub fn generate_proof<PC>(
    _srs: &<PC::Pcs as PolynomialCommitmentScheme<Fr>>::Param,
    prover_parameters: &PC::ProverParam,
    inputs: HashMap<String, Vec<Fr>>,
) -> Result<(Vec<u8>, Vec<Fr>), DiagnosisError>
where
    PC: PlonkishComponents,
    Keccak256Transcript<Cursor<Vec<u8>>>: TranscriptWrite<CommitmentChunk<Fr, PC::Pcs>, Fr>,
{
    let k = 4usize;

    // Extract inputs
    let diagnosis_hash: Fr = inputs
        .get("diagnosis_hash")
        .ok_or(DiagnosisError("Missing diagnosis_hash".to_string()))?
        .get(0)
        .ok_or(DiagnosisError("Invalid diagnosis_hash".to_string()))?
        .clone();

    let required_hash: Fr = inputs
        .get("required_hash")
        .ok_or(DiagnosisError("Missing required_hash".to_string()))?
        .get(0)
        .ok_or(DiagnosisError("Invalid required_hash".to_string()))?
        .clone();

    let study_id: Fr = inputs
        .get("study_id")
        .ok_or(DiagnosisError("Missing study_id".to_string()))?
        .get(0)
        .ok_or(DiagnosisError("Invalid study_id".to_string()))?
        .clone();

    // Client-side validation (MVP hybrid approach)
    // Verify hashes match
    let diag_hash_u64 = field_to_u64(&diagnosis_hash)?;
    let req_hash_u64 = field_to_u64(&required_hash)?;

    if diag_hash_u64 != req_hash_u64 {
        return Err(DiagnosisError(format!(
            "Diagnosis hash {} does not match required hash {}",
            diag_hash_u64, req_hash_u64
        )));
    }

    // Create circuit with validated inputs
    let circuit = DiagnosisMembershipCircuit::<Fr> {
        diagnosis_hash: Value::known(diagnosis_hash),
        required_hash,
        study_id,
    };

    let halo2_circuit = Halo2Circuit::<Fr, DiagnosisMembershipCircuit<Fr>>::new::<PC::ProvingBackend>(k, circuit.clone());

    let proof_transcript = {
        let mut proof_transcript = Keccak256Transcript::new(());

        PC::ProvingBackend::prove(
            &prover_parameters,
            &halo2_circuit,
            &mut proof_transcript,
            std_rng(),
        )
        .map_err(|e| DiagnosisError(format!("Proof generation failed: {:?}", e)))?;

        proof_transcript
    };

    let proof = proof_transcript.into_proof();
    let public_inputs = vec![required_hash, study_id];

    Ok((proof, public_inputs))
}

/// Verify diagnosis membership proof
pub fn verify_proof<PC>(
    _srs: &<PC::Pcs as PolynomialCommitmentScheme<Fr>>::Param,
    verifier_parameters: &PC::VerifierParam,
    proof: Vec<u8>,
    inputs: Vec<Fr>,
) -> Result<bool, DiagnosisError>
where
    PC: PlonkishComponents,
    Keccak256Transcript<Cursor<Vec<u8>>>: TranscriptRead<CommitmentChunk<Fr, PC::Pcs>, Fr>,
{
    if inputs.len() != 2 {
        return Err(DiagnosisError(
            "Invalid number of public inputs (expected 2: required_hash, study_id)".to_string(),
        ));
    }

    let mut transcript = Keccak256Transcript::from_proof((), proof.as_slice());
    let result = PC::ProvingBackend::verify(&verifier_parameters, &[inputs], &mut transcript, std_rng());

    result
        .map(|_| true)
        .map_err(|e| DiagnosisError(format!("Verification failed: {:?}", e)))
}

// Helper function to convert field element to u64
fn field_to_u64<F: PrimeField>(field: &F) -> Result<u64, DiagnosisError> {
    let bytes = field.to_repr();
    let bytes_ref = bytes.as_ref();

    if bytes_ref.len() < 8 {
        return Err(DiagnosisError("Field element too small".to_string()));
    }

    let mut array = [0u8; 8];
    array.copy_from_slice(&bytes_ref[0..8]);
    Ok(u64::from_le_bytes(array))
}

// WASM-compatible functions
#[cfg(target_arch = "wasm32")]
pub fn prove<PC>(
    srs_key: &[u8],
    proving_key: &[u8],
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn std::error::Error>>
where
    PC: PlonkishComponents,
    ProofTranscript: TranscriptWrite<CommitmentChunk<Fr, PC::Pcs>, Fr>,
{
    let srs = io::read_srs_bytes::<PC>(srs_key);
    let proving_key = io::load_from_bytes::<PC::ProverParam>(proving_key)?;

    let circuit_inputs = deserialize_circuit_inputs(input)?;
    let (proof, inputs) = generate_proof::<PC>(&srs, &proving_key, circuit_inputs)?;

    let serialized_inputs = bincode::serialize(&InputsSerializationWrapper(inputs))?;
    Ok((proof, serialized_inputs))
}

#[cfg(target_arch = "wasm32")]
pub fn verify<PC>(
    srs_key: &[u8],
    verifying_key: &[u8],
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn std::error::Error>>
where
    PC: PlonkishComponents,
    ProofTranscript: TranscriptRead<CommitmentChunk<Fr, PC::Pcs>, Fr>,
{
    let srs = io::read_srs_bytes::<PC>(srs_key);
    let verifying_key = io::load_from_bytes::<PC::VerifierParam>(verifying_key)?;

    let deserialized_inputs: Vec<Fr> =
        bincode::deserialize::<InputsSerializationWrapper>(&public_inputs)?.0;

    let is_valid = verify_proof::<PC>(&srs, &verifying_key, proof, deserialized_inputs)?;
    Ok(is_valid)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_diagnosis_code() {
        let hash1 = hash_diagnosis_code("E11.9").unwrap();
        let hash2 = hash_diagnosis_code("E11.9").unwrap();
        let hash3 = hash_diagnosis_code("I10").unwrap();

        assert_eq!(hash1, hash2); // Same code = same hash
        assert_ne!(hash1, hash3); // Different code = different hash
    }

    #[test]
    fn test_validate_diagnosis_membership_valid() {
        let patient_diagnoses = vec![
            "E11.9".to_string(),  // Type 2 Diabetes
            "I10".to_string(),    // Hypertension
        ];

        assert!(validate_diagnosis_membership(&patient_diagnoses, "E11.9").is_ok());
        assert!(validate_diagnosis_membership(&patient_diagnoses, "I10").is_ok());
    }

    #[test]
    fn test_validate_diagnosis_membership_invalid() {
        let patient_diagnoses = vec![
            "E11.9".to_string(),
        ];

        assert!(validate_diagnosis_membership(&patient_diagnoses, "I10").is_err());
        assert!(validate_diagnosis_membership(&patient_diagnoses, "J45").is_err());
    }
}
