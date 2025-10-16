//! Plonk wrapper for Composite Eligibility Circuit
//! Uses Halo2 directly for simplicity

#[cfg(not(target_arch = "wasm32"))]
use std::fs::File;
#[cfg(target_arch = "wasm32")]
use std::io::BufReader;
use std::{collections::HashMap, error::Error};

use composite_eligibility_circuit::{
    serialization::*, AgeRangeCircuit, EligibilityError, validate_age_range,
};
use halo2_proofs::{
    halo2curves::{bn256::{Bn256, Fr, G1Affine}, ff::PrimeField},
    plonk::{create_proof, verify_proof, ProvingKey, VerifyingKey},
    poly::{
        commitment::Params,
        kzg::{
            commitment::{KZGCommitmentScheme, ParamsKZG},
            multiopen::{ProverSHPLONK, VerifierSHPLONK},
            strategy::SingleStrategy,
        },
    },
    transcript::{
        Blake2bRead, Blake2bWrite, Challenge255, TranscriptReadBuffer, TranscriptWriterBuffer,
    },
    SerdeFormat::RawBytes,
};
use rand::rngs::OsRng;

pub type GenerateProofResult = (Vec<u8>, Vec<u8>);

pub fn generate_halo2_proof(
    params: &ParamsKZG<Bn256>,
    pk: &ProvingKey<G1Affine>,
    circuit: AgeRangeCircuit<Fr>,
    public_inputs: Vec<Fr>,
) -> Result<(Vec<u8>, Vec<Fr>), Box<dyn Error>> {
    let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);

    create_proof::<
        KZGCommitmentScheme<Bn256>,
        ProverSHPLONK<'_, Bn256>,
        Challenge255<G1Affine>,
        _,
        Blake2bWrite<Vec<u8>, G1Affine, Challenge255<G1Affine>>,
        _,
        false,
    >(
        &params,
        &pk,
        &[circuit],
        &[&[&public_inputs]],
        OsRng,
        &mut transcript,
    )
    .expect("prover should not fail");

    let proof = transcript.finalize();
    Ok((proof, public_inputs))
}

pub fn verify_halo2_proof(
    params: &ParamsKZG<Bn256>,
    vk: &VerifyingKey<G1Affine>,
    proof: Vec<u8>,
    public_inputs: Vec<Fr>,
) -> Result<bool, EligibilityError> {
    let strategy = SingleStrategy::new(&params);
    let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(&proof[..]);

    let result = verify_proof::<
        KZGCommitmentScheme<Bn256>,
        VerifierSHPLONK<'_, Bn256>,
        Challenge255<G1Affine>,
        Blake2bRead<&[u8], G1Affine, Challenge255<G1Affine>>,
        SingleStrategy<'_, Bn256>,
        false,
    >(
        &params,
        &vk,
        strategy,
        &[&[&public_inputs]],
        &mut transcript,
    )
    .is_ok();

    Ok(result)
}

fn prove_with_params(
    params: &ParamsKZG<Bn256>,
    proving_key: &ProvingKey<G1Affine>,
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn Error>> {
    let circuit_inputs = deserialize_circuit_inputs(input)
        .map_err(|e| EligibilityError(format!("Failed to deserialize inputs: {}", e)))?;

    // Extract age range inputs
    let age = circuit_inputs
        .get("age")
        .ok_or_else(|| EligibilityError("Missing 'age' input".to_string()))?
        .get(0)
        .ok_or_else(|| EligibilityError("Invalid 'age' value".to_string()))?
        .clone();

    let min_age = circuit_inputs
        .get("min_age")
        .ok_or_else(|| EligibilityError("Missing 'min_age' input".to_string()))?
        .get(0)
        .ok_or_else(|| EligibilityError("Invalid 'min_age' value".to_string()))?
        .clone();

    let max_age = circuit_inputs
        .get("max_age")
        .ok_or_else(|| EligibilityError("Missing 'max_age' input".to_string()))?
        .get(0)
        .ok_or_else(|| EligibilityError("Invalid 'max_age' value".to_string()))?
        .clone();

    let study_id = circuit_inputs
        .get("study_id")
        .ok_or_else(|| EligibilityError("Missing 'study_id' input".to_string()))?
        .get(0)
        .ok_or_else(|| EligibilityError("Invalid 'study_id' value".to_string()))?
        .clone();

    // Client-side validation (hybrid MVP approach)
    let age_u64 = field_to_u64(&age)?;
    let min_age_u64 = field_to_u64(&min_age)?;
    let max_age_u64 = field_to_u64(&max_age)?;

    validate_age_range(age_u64, min_age_u64, max_age_u64)
        .map_err(|e| Box::new(e) as Box<dyn Error>)?;

    // Create circuit with validated inputs
    use halo2_proofs::circuit::Value;
    let circuit = AgeRangeCircuit::<Fr> {
        age: Value::known(age),
        min_age,
        max_age,
        study_id,
    };

    let public_inputs = vec![min_age, max_age, study_id];

    let (proof, unserialized_inputs) =
        generate_halo2_proof(&params, &proving_key, circuit, public_inputs)?;

    let serialized_inputs = bincode::serialize(&InputsSerializationWrapper(unserialized_inputs))
        .map_err(|e| EligibilityError(format!("Serialization failed: {}", e)))?;

    Ok((proof, serialized_inputs))
}

// Helper function
fn field_to_u64<F: PrimeField>(field: &F) -> Result<u64, Box<dyn Error>> {
    let bytes = field.to_repr();
    let bytes_ref = bytes.as_ref();

    if bytes_ref.len() < 8 {
        return Err("Field element too small".into());
    }

    let mut array = [0u8; 8];
    array.copy_from_slice(&bytes_ref[0..8]);
    Ok(u64::from_le_bytes(array))
}

#[cfg(not(target_arch = "wasm32"))]
pub fn prove(
    srs_key_path: &str,
    proving_key_path: &str,
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn Error>> {
    let mut param_fs = File::open(srs_key_path)?;
    let params = ParamsKZG::<Bn256>::read(&mut param_fs)?;

    let mut pk_fs = File::open(proving_key_path)?;
    let proving_key = ProvingKey::read::<_, AgeRangeCircuit<Fr>, false>(&mut pk_fs, RawBytes)?;

    prove_with_params(&params, &proving_key, input)
}

#[cfg(target_arch = "wasm32")]
pub fn prove(
    srs_key: &[u8],
    proving_key: &[u8],
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn Error>> {
    let mut params_reader = BufReader::new(srs_key);
    let params = ParamsKZG::<Bn256>::read(&mut params_reader)?;

    let mut pk_reader = BufReader::new(proving_key);
    let proving_key = ProvingKey::read::<_, AgeRangeCircuit<Fr>, false>(&mut pk_reader, RawBytes)?;

    prove_with_params(&params, &proving_key, input)
}

fn verify_with_params(
    params: &ParamsKZG<Bn256>,
    verifying_key: &VerifyingKey<G1Affine>,
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn Error>> {
    let deserialized_inputs: Vec<Fr> =
        bincode::deserialize::<InputsSerializationWrapper>(&public_inputs)
            .map_err(|e| EligibilityError(e.to_string()))?
            .0;

    let result = verify_halo2_proof(params, verifying_key, proof, deserialized_inputs)?;
    Ok(result)
}

#[cfg(not(target_arch = "wasm32"))]
pub fn verify(
    srs_key_path: &str,
    verifying_key_path: &str,
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn Error>> {
    let mut param_fs = File::open(srs_key_path)?;
    let params = ParamsKZG::<Bn256>::read(&mut param_fs)?;

    let mut vk_fs = File::open(verifying_key_path)?;
    let verifying_key = VerifyingKey::read::<_, AgeRangeCircuit<Fr>, false>(&mut vk_fs, RawBytes)?;

    verify_with_params(&params, &verifying_key, proof, public_inputs)
}

#[cfg(target_arch = "wasm32")]
pub fn verify(
    srs_key: &[u8],
    verifying_key: &[u8],
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn Error>> {
    let mut params_reader = BufReader::new(srs_key);
    let params = ParamsKZG::<Bn256>::read(&mut params_reader)?;

    let mut vk_reader = BufReader::new(verifying_key);
    let verifying_key = VerifyingKey::read::<_, AgeRangeCircuit<Fr>, false>(&mut vk_reader, RawBytes)?;

    verify_with_params(&params, &verifying_key, proof, public_inputs)
}
