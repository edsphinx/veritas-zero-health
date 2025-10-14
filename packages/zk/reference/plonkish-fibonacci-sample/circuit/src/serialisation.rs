use std::collections::HashMap;
use std::fmt;
use std::str::FromStr;

use crate::FibonacciError;
use halo2_proofs::halo2curves::{bn256::Fr, ff::PrimeField};
use serde::de::{SeqAccess, Visitor};
use serde::ser::SerializeSeq;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

pub struct InputsSerialisationWrapper(pub Vec<Fr>);

pub fn deserialize_circuit_inputs(
    ser_inputs: HashMap<String, Vec<String>>,
) -> Result<HashMap<String, Vec<Fr>>, FibonacciError> {
    ser_inputs
        .iter()
        .map(|(k, v)| {
            let fp_vec: Result<Vec<Fr>, FibonacciError> = v
                .iter()
                .map(|s| {
                    // TODO - support big integers full range, not just u128
                    let int = u128::from_str(s).map_err(|e| {
                        FibonacciError(format!("Failed to parse input as u128: {}", e))
                    });

                    int.map(|i| Fr::from_u128(i))
                })
                .collect();
            fp_vec.map(|v| (k.clone(), v))
        })
        .collect()
}

impl Serialize for InputsSerialisationWrapper {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut seq = serializer.serialize_seq(Some(self.0.len()))?;
        for fp in &self.0 {
            seq.serialize_element(&fp.to_bytes())?;
        }
        seq.end()
    }
}

impl<'de> Deserialize<'de> for InputsSerialisationWrapper {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct SerializableInputsVisitor;

        impl<'de> Visitor<'de> for SerializableInputsVisitor {
            type Value = InputsSerialisationWrapper;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a sequence of byte arrays of length 32")
            }

            fn visit_seq<A>(self, mut seq: A) -> Result<InputsSerialisationWrapper, A::Error>
            where
                A: SeqAccess<'de>,
            {
                let mut vec = Vec::new();
                while let Some(bytes) = seq.next_element::<[u8; 32]>()? {
                    vec.push(Fr::from_bytes(&bytes).expect("Invalid bytes"));
                }
                Ok(InputsSerialisationWrapper(vec))
            }
        }

        deserializer.deserialize_seq(SerializableInputsVisitor)
    }
}

// Tests for serialization and deserialization
#[cfg(test)]
mod tests {
    use serde_json;

    use super::*;

    #[test]
    fn test_serialization() {
        let fp1 = Fr::from(1);
        let fp2 = Fr::from(2);
        let inputs = InputsSerialisationWrapper(vec![fp1, fp2]);

        let serialized = serde_json::to_string(&inputs).unwrap();
        println!("Serialized: {}", serialized);

        let deserialized: InputsSerialisationWrapper = serde_json::from_str(&serialized).unwrap();
        assert_eq!(inputs.0.len(), deserialized.0.len());
        for (original, deserialized_fp) in inputs.0.iter().zip(deserialized.0.iter()) {
            assert_eq!(original.to_bytes(), deserialized_fp.to_bytes());
        }
    }

    #[test]
    fn test_circuit_inputs_deserialization() {
        let mut serialized = HashMap::new();
        serialized.insert("out".to_string(), vec!["1".to_string(), "2".to_string()]);
        let deserialized = deserialize_circuit_inputs(serialized).unwrap();
        assert_eq!(deserialized.len(), 1);
        assert_eq!(deserialized.get("out").unwrap().len(), 2);
        assert_eq!(deserialized.get("out").unwrap()[0], Fr::from(1));
        assert_eq!(deserialized.get("out").unwrap()[1], Fr::from(2));
    }
}
