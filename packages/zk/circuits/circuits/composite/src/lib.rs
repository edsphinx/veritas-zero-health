//! Simplified Composite Clinical Trial Eligibility Circuit
//!
//! Demonstrates multi-criteria eligibility checking for clinical trials.
//! This is a simplified educational version showing the pattern.

use std::{collections::HashMap, io::Cursor};

use halo2_proofs::{
    circuit::{Layouter, SimpleFloorPlanner},
    halo2curves::ff::Field,
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
pub struct EligibilityError(pub String);

impl std::fmt::Display for EligibilityError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

pub type GenerateProofResult = (Vec<u8>, Vec<u8>);
pub type ProofTranscript = Keccak256Transcript<Cursor<Vec<u8>>>;

/// Simplified circuit configuration
#[derive(Debug, Clone)]
pub struct CompositeEligibilityConfig {
    pub data: Column<Advice>,
    pub selector: Selector,
    pub instance: Column<Instance>,
}

/// Composite Eligibility Circuit - Simplified Version
///
/// This proves eligibility based on a simple sum check (like Fibonacci example)
/// In production, you would add proper range checks and boolean constraints
#[derive(Clone, Default)]
pub struct CompositeEligibilityCircuit<F> {
    pub public_input: Vec<Vec<F>>,
}

impl<F: Field> Circuit<F> for CompositeEligibilityCircuit<F> {
    type Config = CompositeEligibilityConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        Self::default()
    }

    fn configure(meta: &mut ConstraintSystem<F>) -> Self::Config {
        let data = meta.advice_column();
        let selector = meta.selector();
        let instance = meta.instance_column();

        meta.enable_equality(data);
        meta.enable_equality(instance);

        // Simple constraint: data value equals expected
        meta.create_gate("eligibility check", |meta| {
            let s = meta.query_selector(selector);
            let data_val = meta.query_advice(data, Rotation::cur());
            let expected = meta.query_instance(instance, Rotation::cur());

            vec![s * (data_val - expected)]
        });

        CompositeEligibilityConfig {
            data,
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
            || "eligibility",
            |mut region| {
                config.selector.enable(&mut region, 0)?;

                region.assign_advice_from_instance(
                    || "data",
                    config.instance,
                    0,
                    config.data,
                    0,
                )?;

                Ok(())
            },
        )?;

        Ok(())
    }
}

impl<F: Field> CircuitExt<F> for CompositeEligibilityCircuit<F> {
    fn rand(_: usize, _: impl RngCore) -> Self {
        unimplemented!()
    }

    fn instances(&self) -> Vec<Vec<F>> {
        self.public_input.clone()
    }
}

/// Generate proof
pub fn generate_proof<PC>(
    _srs: &<PC::Pcs as PolynomialCommitmentScheme<Fr>>::Param,
    prover_parameters: &PC::ProverParam,
    inputs: HashMap<String, Vec<Fr>>,
) -> Result<(Vec<u8>, Vec<Fr>), EligibilityError>
where
    PC: PlonkishComponents,
    Keccak256Transcript<Cursor<Vec<u8>>>: TranscriptWrite<CommitmentChunk<Fr, PC::Pcs>, Fr>,
{
    let k = 4usize;

    let eligibility_code: Fr = inputs
        .get("code")
        .ok_or(EligibilityError("Missing code".to_string()))?
        .get(0)
        .ok_or(EligibilityError("Invalid code".to_string()))?
        .clone();

    let public_input = vec![eligibility_code];
    let circuit = CompositeEligibilityCircuit::<Fr> {
        public_input: vec![public_input.clone()],
    };

    let halo2_circuit =
        Halo2Circuit::<Fr, CompositeEligibilityCircuit<Fr>>::new::<PC::ProvingBackend>(k, circuit);

    let proof_transcript = {
        let mut proof_transcript = Keccak256Transcript::new(());

        PC::ProvingBackend::prove(
            &prover_parameters,
            &halo2_circuit,
            &mut proof_transcript,
            std_rng(),
        )
        .map_err(|e| EligibilityError(format!("Proof generation failed: {:?}", e)))?;

        proof_transcript
    };

    let proof = proof_transcript.into_proof();
    Ok((proof, public_input))
}

/// Verify proof
pub fn verify_proof<PC>(
    _srs: &<PC::Pcs as PolynomialCommitmentScheme<Fr>>::Param,
    verifier_parameters: &PC::VerifierParam,
    proof: Vec<u8>,
    inputs: Vec<Fr>,
) -> Result<bool, EligibilityError>
where
    PC: PlonkishComponents,
    Keccak256Transcript<Cursor<Vec<u8>>>: TranscriptRead<CommitmentChunk<Fr, PC::Pcs>, Fr>,
{
    let mut transcript = Keccak256Transcript::from_proof((), proof.as_slice());
    let result = PC::ProvingBackend::verify(&verifier_parameters, &[inputs], &mut transcript, std_rng());

    result
        .map(|_| true)
        .map_err(|e| EligibilityError(format!("Verification failed: {:?}", e)))
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
