#[cfg(not(target_arch = "wasm32"))]
use std::fs::File;
#[cfg(target_arch = "wasm32")]
use std::io::BufReader;
use std::{collections::HashMap, error::Error};

use fibonacci_circuit::{serialisation::*, FibonacciCircuit, FibonacciError, GenerateProofResult};
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

pub fn generate_halo2_proof(
    params: &ParamsKZG<Bn256>,
    pk: &ProvingKey<G1Affine>,
    circuit: FibonacciCircuit<Fr>,
    public_inputs: Vec<Fr>,
) -> Result<(Vec<u8>, Vec<Fr>), Box<dyn Error>> {
    let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);
    let _result = create_proof::<
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
) -> Result<bool, FibonacciError> {
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
    params: ParamsKZG<Bn256>,
    proving_key: ProvingKey<G1Affine>,
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn Error>> {
    let circuit = FibonacciCircuit::<Fr>::default();

    let circuit_inputs = deserialize_circuit_inputs(input)
        .map_err(|e| FibonacciError(format!("Failed to deserialize circuit inputs: {}", e)))?;

    let out = circuit_inputs
        .get("out")
        .ok_or_else(|| FibonacciError("Failed to get `out` value".to_string()))?
        .get(0)
        .ok_or_else(|| FibonacciError("Failed to get `out` value".to_string()))?
        .clone();

    // The public input followed fibonacci circuit
    let public_input = vec![Fr::from(1), Fr::from(1), out];

    let (proof, unserialized_inputs) =
        generate_halo2_proof(&params, &proving_key, circuit, public_input).unwrap();
    let serialized_inputs = bincode::serialize(&InputsSerialisationWrapper(unserialized_inputs))
        .map_err(|e| FibonacciError(format!("Serialization of Inputs failed: {}", e)))?;

    Ok((proof, serialized_inputs))
}

#[cfg(not(target_arch = "wasm32"))]
pub fn prove(
    srs_key_path: &str,
    proving_key_path: &str,
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn Error>> {
    let mut param_fs =
        File::open(srs_key_path).expect(&format!("Couldn't load params from '{}'", srs_key_path));
    let params = ParamsKZG::<Bn256>::read(&mut param_fs)
        .expect(&format!("Failed to read params from '{}'", srs_key_path));

    let mut pk_fs = File::open(proving_key_path).expect("Couldn't load proving key");
    let proving_key =
        ProvingKey::read::<_, FibonacciCircuit<Fr>, false>(&mut pk_fs, RawBytes).unwrap();

    prove_with_params(params, proving_key, input)
}

#[cfg(target_arch = "wasm32")]
pub fn prove(
    srs_key: &[u8],
    proving_key: &[u8],
    input: HashMap<String, Vec<String>>,
) -> Result<GenerateProofResult, Box<dyn Error>> {
    let mut params_reader = BufReader::new(srs_key);
    let params =
        ParamsKZG::<Bn256>::read(&mut params_reader).expect("Failed to read params from bytes");

    let mut pk_reader = BufReader::new(proving_key);
    let proving_key =
        ProvingKey::read::<_, FibonacciCircuit<Fr>, false>(&mut pk_reader, RawBytes).unwrap();

    prove_with_params(params, proving_key, input)
}

fn verify_with_params(
    params: ParamsKZG<Bn256>,
    verifying_key: VerifyingKey<G1Affine>,
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn Error>> {
    let deserialized_inputs: Vec<Fr> =
        bincode::deserialize::<InputsSerialisationWrapper>(&public_inputs)
            .map_err(|e| FibonacciError(e.to_string()))?
            .0;

    let result = verify_halo2_proof(&params, &verifying_key, proof, deserialized_inputs)
        .map_err(|e| FibonacciError(format!("Verification failed: {}", e)))?;

    Ok(result)
}

#[cfg(not(target_arch = "wasm32"))]
pub fn verify(
    srs_key_path: &str,
    verifying_key_path: &str,
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn Error>> {
    let mut param_fs =
        File::open(srs_key_path).expect(&format!("Couldn't load params from '{}'", srs_key_path));
    let params = ParamsKZG::<Bn256>::read(&mut param_fs)
        .expect(&format!("Failed to read params from '{}'", srs_key_path));

    let mut vk_fs = File::open(verifying_key_path).expect("Couldn't load verifying key");
    let verifying_key =
        VerifyingKey::read::<_, FibonacciCircuit<Fr>, false>(&mut vk_fs, RawBytes).unwrap();

    verify_with_params(params, verifying_key, proof, public_inputs)
}

#[cfg(target_arch = "wasm32")]
pub fn verify(
    srs_key: &[u8],
    verifying_key: &[u8],
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<bool, Box<dyn Error>> {
    let mut params_reader = BufReader::new(srs_key);
    let params = ParamsKZG::<Bn256>::read(&mut params_reader).expect("Failed to read params");

    let mut vk_reader = BufReader::new(verifying_key);
    let verifying_key =
        VerifyingKey::read::<_, FibonacciCircuit<Fr>, false>(&mut vk_reader, RawBytes).unwrap();

    verify_with_params(params, verifying_key, proof, public_inputs)
}

#[cfg(test)]
mod tests {
    use halo2_proofs::plonk::{keygen_pk, keygen_vk};

    use super::*;

    fn initialize_params_and_circuit() -> (FibonacciCircuit<Fr>, ParamsKZG<Bn256>) {
        let params = ParamsKZG::<Bn256>::setup(4, OsRng);

        let circuit = FibonacciCircuit::<Fr>::default();

        (circuit, params)
    }

    fn generate_and_verify_proof(public_inputs: Vec<Fr>) -> bool {
        let (circuit, params) = initialize_params_and_circuit();

        let verifying_key = keygen_vk::<_, _, _, false>(&params, &circuit)
            .expect("Verifying Key generation should not fail");
        let proving_key = keygen_pk::<_, _, _, false>(&params, verifying_key.clone(), &circuit)
            .expect("Proving Key generation should not fail");

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
            &proving_key,
            &[circuit.clone()],
            &[&[&public_inputs]],
            OsRng,
            &mut transcript,
        )
        .expect("prover should not fail");

        let proof = transcript.finalize();

        // Verifying Proof
        let strategy = SingleStrategy::new(&params);
        let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(&proof[..]);

        verify_proof::<
            KZGCommitmentScheme<Bn256>,
            VerifierSHPLONK<'_, Bn256>,
            Challenge255<G1Affine>,
            Blake2bRead<&[u8], G1Affine, Challenge255<G1Affine>>,
            SingleStrategy<'_, Bn256>,
            false,
        >(
            &params,
            &verifying_key,
            strategy,
            &[&[&public_inputs]],
            &mut transcript,
        )
        .is_ok()
    }

    #[test]
    fn test_fibonacci_circuit() {
        let public_inputs = vec![Fr::from(1), Fr::from(1), Fr::from(55)];
        let valid_result = generate_and_verify_proof(public_inputs);

        assert_eq!(valid_result, true);

        // Ensures verification fails with incorrect public input
        let wrong_public_inputs = vec![Fr::from(1), Fr::from(1), Fr::from(56)];
        let invalid_result = generate_and_verify_proof(wrong_public_inputs);

        assert_eq!(invalid_result, false)
    }

    #[test]
    fn test_helper_functions() {
        // Initialize circuit with zero values
        let (circuit, params) = initialize_params_and_circuit();

        let verifying_key = keygen_vk::<_, _, _, false>(&params, &circuit)
            .expect("Verifying Key generation should not fail");
        let proving_key = keygen_pk::<_, _, _, false>(&params, verifying_key.clone(), &circuit)
            .expect("Proving Key generation should not fail");

        let public_input = vec![Fr::from(1), Fr::from(1), Fr::from(55)];

        let (proof, serialized_inputs) =
            generate_halo2_proof(&params, &proving_key, circuit.clone(), public_input).unwrap();

        assert_eq!(
            verify_halo2_proof(&params, &verifying_key, proof, serialized_inputs).unwrap(),
            true
        );

        // Ensures verification fails with incorrect public input
        let wrong_public_input = vec![Fr::from(1), Fr::from(1), Fr::from(56)];
        let (bad_proof, serialized_inputs) =
            generate_halo2_proof(&params, &proving_key, circuit, wrong_public_input).unwrap();

        assert_eq!(
            verify_halo2_proof(&params, &verifying_key, bad_proof, serialized_inputs).unwrap(),
            false
        );
    }
}
