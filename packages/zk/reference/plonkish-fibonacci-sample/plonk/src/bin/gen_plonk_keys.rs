use std::{env, fs::File, path::Path};

use halo2_proofs::{
    halo2curves::bn256::{Bn256, G1Affine},
    plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey},
    poly::{commitment::Params, kzg::commitment::ParamsKZG},
    SerdeFormat::RawBytes,
};

use fibonacci_circuit::FibonacciCircuit;

pub fn main() {
    // This key generator is based on halo2
    let filename_prefix = "plonk";

    // Get the project's root directory from the `CARGO_MANIFEST_DIR` environment variable
    let project_root = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is not set");

    // Read SRS from file
    let srs_filename = env::args().nth(1).expect("Please specify SRS file path");
    let srs_path = Path::new(&project_root).join(srs_filename);
    let mut params_fs = File::open(srs_path.clone()).expect("Couldn't load params from SRS file");
    let params =
        ParamsKZG::<Bn256>::read(&mut params_fs).expect("Failed to read params from SRS file");

    // Create the path to the `out` directory under the project's root directory
    let out_dir = Path::new(&project_root).join("out");

    // Check if the `out` directory exists, if not, create it
    if !out_dir.exists() {
        std::fs::create_dir(&out_dir).expect("Unable to create out directory");
    }

    // Use empty value on public input for only for getting proving / verifying keys
    let circuit = FibonacciCircuit {
        public_input: vec![vec![]],
    };

    let verifying_key = keygen_vk::<_, _, _, false>(&params, &circuit)
        .expect("verifying key generation should not fail");
    let proving_key = keygen_pk::<_, _, _, false>(&params, verifying_key.clone(), &circuit)
        .expect("proving key generation should not fail");

    let pk_path = out_dir.join(format!("{}_fibonacci_pk.bin", filename_prefix));
    println!("pk_path: {:?}", pk_path);
    let mut pk_file =
        File::create(pk_path.clone()).expect("Writing proving key file should not fail");
    let _ = ProvingKey::<G1Affine>::write(&proving_key, &mut pk_file, RawBytes);

    let vk_path = out_dir.join(format!("{}_fibonacci_vk.bin", filename_prefix));
    let mut vk_file =
        File::create(vk_path.clone()).expect("Writing verifying key file should not fail");
    let _ = VerifyingKey::<G1Affine>::write(&verifying_key, &mut vk_file, RawBytes);

    println!("Preparation finished successfully.");
    println!("SRS readed from {}", srs_path.display());
    println!("Proving key stored in {}", pk_path.display());
    println!("Verification key stored in {}", vk_path.display());
}
