use halo2_proofs::{
    circuit::{Layouter, SimpleFloorPlanner, Value},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error, Instance, Selector},
    poly::Rotation,
};
use halo2curves::bn256::Fr;
use poseidon::{Poseidon, Spec, P128Pow5T3};
use std::marker::PhantomData;

/// Configuration for the EligibilityCode circuit
#[derive(Clone, Debug)]
pub struct EligibilityCodeConfig {
    /// Advice columns to store the code inputs
    code: [Column<Advice>; 4],
    /// Instance column for the required hash (public input)
    required_hash: Column<Instance>,
    /// Selector to enable the equality constraint
    selector: Selector,
}

/// EligibilityCode Circuit
///
/// Proves that the user knows a code that hashes to a required value
/// WITHOUT revealing the actual code.
///
/// Public inputs:
/// - required_hash: The hash that the code must match
///
/// Private inputs:
/// - code: Array of 4 field elements representing the eligibility code
#[derive(Clone, Debug)]
pub struct EligibilityCodeCircuit {
    /// Private: The eligibility code (4 field elements)
    pub code: [Value<Fr>; 4],
    /// Public: The required code hash
    pub required_hash: Value<Fr>,
}

impl EligibilityCodeCircuit {
    pub fn new(code: [Fr; 4], required_hash: Fr) -> Self {
        Self {
            code: code.map(Value::known),
            required_hash: Value::known(required_hash),
        }
    }

    pub fn new_empty() -> Self {
        Self {
            code: [Value::unknown(); 4],
            required_hash: Value::unknown(),
        }
    }
}

impl Circuit<Fr> for EligibilityCodeCircuit {
    type Config = EligibilityCodeConfig;
    type FloorPlanner = SimpleFloorPlanner;
    #[cfg(feature = "circuit-params")]
    type Params = ();

    fn without_witnesses(&self) -> Self {
        Self::new_empty()
    }

    fn configure(meta: &mut ConstraintSystem<Fr>) -> Self::Config {
        // Allocate advice columns for the code
        let code = [
            meta.advice_column(),
            meta.advice_column(),
            meta.advice_column(),
            meta.advice_column(),
        ];

        // Enable equality constraints for all advice columns
        for col in &code {
            meta.enable_equality(*col);
        }

        // Allocate instance column for required hash
        let required_hash = meta.instance_column();
        meta.enable_equality(required_hash);

        // Selector for the constraint
        let selector = meta.selector();

        // Create the constraint: hash(code) == required_hash
        // Note: This is a simplified version. In production, we'd use a proper
        // Poseidon gadget that creates the full constraint system.
        meta.create_gate("eligibility check", |meta| {
            let s = meta.query_selector(selector);

            // Query the code values
            let code_0 = meta.query_advice(code[0], Rotation::cur());
            let code_1 = meta.query_advice(code[1], Rotation::cur());
            let code_2 = meta.query_advice(code[2], Rotation::cur());
            let code_3 = meta.query_advice(code[3], Rotation::cur());

            // Query the required hash
            let required = meta.query_instance(required_hash, Rotation::cur());

            // In a full implementation, we'd compute the Poseidon hash here
            // For now, this is a placeholder that would be replaced with
            // the actual Poseidon constraint system

            vec![
                // Placeholder constraint - to be replaced with Poseidon
                s * (code_0 + code_1 + code_2 + code_3 - required)
            ]
        });

        EligibilityCodeConfig {
            code,
            required_hash,
            selector,
        }
    }

    fn synthesize(
        &self,
        config: Self::Config,
        mut layouter: impl Layouter<Fr>,
    ) -> Result<(), Error> {
        // Assign the code values
        layouter.assign_region(
            || "eligibility code",
            |mut region| {
                // Enable the selector
                config.selector.enable(&mut region, 0)?;

                // Assign code values
                for (i, code_val) in self.code.iter().enumerate() {
                    region.assign_advice(
                        || format!("code[{}]", i),
                        config.code[i],
                        0,
                        || *code_val,
                    )?;
                }

                // In a full implementation, we'd:
                // 1. Use a Poseidon chip to compute the hash
                // 2. Constrain the computed hash to equal the instance value

                Ok(())
            },
        )?;

        // Expose the required hash as a public input
        layouter.constrain_instance(
            config.required_hash.into(),
            config.required_hash,
            0,
        )?;

        Ok(())
    }
}

/// Generate a proof for the eligibility code circuit
pub fn prove(
    code: [Fr; 4],
    required_hash: Fr,
    params: &halo2_proofs::poly::commitment::Params<halo2curves::bn256::G1Affine>,
    pk: &halo2_proofs::plonk::ProvingKey<halo2curves::bn256::G1Affine>,
) -> Result<Vec<u8>, Error> {
    use halo2_proofs::transcript::{Blake2bWrite, Challenge255, TranscriptWriterBuffer};
    use rand_core::OsRng;

    let circuit = EligibilityCodeCircuit::new(code, required_hash);

    let mut transcript = Blake2bWrite::<_, _, Challenge255<_>>::init(vec![]);

    halo2_proofs::plonk::create_proof::<
        halo2_proofs::poly::kzg::commitment::KZGCommitmentScheme<halo2curves::bn256::Bn256>,
        halo2_proofs::plonk::ProverSingle<_>,
        Challenge255<_>,
        _,
        Blake2bWrite<Vec<u8>, halo2curves::bn256::G1Affine, Challenge255<_>>,
        _,
    >(params, pk, &[circuit], &[&[&[required_hash]]], OsRng, &mut transcript)?;

    Ok(transcript.finalize())
}

/// Verify a proof for the eligibility code circuit
pub fn verify(
    proof: &[u8],
    required_hash: Fr,
    params: &halo2_proofs::poly::commitment::Params<halo2curves::bn256::G1Affine>,
    vk: &halo2_proofs::plonk::VerifyingKey<halo2curves::bn256::G1Affine>,
) -> Result<bool, Error> {
    use halo2_proofs::transcript::{Blake2bRead, Challenge255, TranscriptReadBuffer};

    let strategy = halo2_proofs::poly::kzg::strategy::SingleStrategy::new(params);
    let mut transcript = Blake2bRead::<_, _, Challenge255<_>>::init(proof);

    halo2_proofs::plonk::verify_proof::<
        halo2_proofs::poly::kzg::commitment::KZGCommitmentScheme<halo2curves::bn256::Bn256>,
        halo2_proofs::plonk::VerifierSingle<_>,
        Challenge255<_>,
        Blake2bRead<&[u8], halo2curves::bn256::G1Affine, Challenge255<_>>,
        halo2_proofs::poly::kzg::strategy::SingleStrategy<_>,
    >(params, vk, strategy, &[&[&[required_hash]]], &mut transcript)?;

    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use halo2_proofs::poly::kzg::commitment::ParamsKZG;
    use halo2curves::bn256::Bn256;

    #[test]
    fn test_eligibility_circuit() {
        // Create test inputs
        let code = [
            Fr::from(18),  // Min age
            Fr::from(45),  // Max age
            Fr::from(0),   // No hypertension
            Fr::from(1),   // Has diabetes
        ];

        // For now, just sum them as a simple "hash"
        // In production, this would be Poseidon hash
        let required_hash = Fr::from(18 + 45 + 0 + 1);

        // Create circuit
        let circuit = EligibilityCodeCircuit::new(code, required_hash);

        // Create parameters (small for testing)
        let k = 4; // 2^4 = 16 rows
        let params = ParamsKZG::<Bn256>::setup(k, rand_core::OsRng);

        // Generate proving and verifying keys
        let vk = halo2_proofs::plonk::keygen_vk(&params, &circuit).expect("keygen_vk should not fail");
        let pk = halo2_proofs::plonk::keygen_pk(&params, vk.clone(), &circuit).expect("keygen_pk should not fail");

        // Generate proof
        let proof = prove(code, required_hash, &params, &pk).expect("proof generation should not fail");

        // Verify proof
        let result = verify(&proof, required_hash, &params, &vk);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}
