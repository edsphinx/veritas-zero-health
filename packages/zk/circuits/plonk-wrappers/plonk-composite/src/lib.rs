//! Plonk wrapper for Composite Eligibility Circuit
//! Uses Halo2 directly for simplicity

#[cfg(not(target_arch = "wasm32"))]
use std::fs::File;
#[cfg(target_arch = "wasm32")]
use std::io::BufReader;
use std::{collections::HashMap, error::Error};

use composite_eligibility_circuit::{
    serialization::*, CompositeEligibilityCircuit, EligibilityError,
};
use halo2_proofs::{
    halo2curves::bn256::{Bn256, Fr, G1Affine},
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
    circuit: CompositeEligibilityCircuit<Fr>,
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
    let circuit = CompositeEligibilityCircuit::<Fr>::default();

    let circuit_inputs = deserialize_circuit_inputs(input)
        .map_err(|e| EligibilityError(format!("Failed to deserialize inputs: {}", e)))?;

    let code = circuit_inputs
        .get("code")
        .ok_or_else(|| EligibilityError("Missing 'code' input".to_string()))?
        .get(0)
        .ok_or_else(|| EligibilityError("Invalid 'code' value".to_string()))?
        .clone();

    let public_input = vec![code];

    let (proof, unserialized_inputs) =
        generate_halo2_proof(&params, &proving_key, circuit, public_input)?;

    let serialized_inputs = bincode::serialize(&InputsSerializationWrapper(unserialized_inputs))
        .map_err(|e| EligibilityError(format!("Serialization failed: {}", e)))?;

    Ok((proof, serialized_inputs))
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
    let proving_key = ProvingKey::read::<_, CompositeEligibilityCircuit<Fr>, false>(&mut pk_fs, RawBytes)?;

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
    let proving_key = ProvingKey::read::<_, CompositeEligibilityCircuit<Fr>, false>(&mut pk_reader, RawBytes)?;

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
    let verifying_key = VerifyingKey::read::<_, CompositeEligibilityCircuit<Fr>, false>(&mut vk_fs, RawBytes)?;

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
    let verifying_key = VerifyingKey::read::<_, CompositeEligibilityCircuit<Fr>, false>(&mut vk_reader, RawBytes)?;

    verify_with_params(&params, &verifying_key, proof, public_inputs)
}
