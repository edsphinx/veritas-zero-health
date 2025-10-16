use std::{
    error::Error,
    fs::File,
    io::{BufReader, Read, Write},
    path::Path,
};

use plonkish_backend::backend::PlonkishBackend;
use serde::{Deserialize, Serialize};

use crate::PlonkishComponents;

/// Read SRS from file.
pub fn read_srs_path<PC: PlonkishComponents>(path: &Path) -> PC::Param {
    let filename = path.as_os_str().to_str().unwrap();
    let mut reader = File::open(filename).unwrap();
    PC::ProvingBackend::setup_custom(&mut reader).unwrap()
}

pub fn read_srs_bytes<PC: PlonkishComponents>(bytes: &[u8]) -> PC::Param {
    let mut reader = BufReader::new(bytes);
    PC::ProvingBackend::setup_custom(&mut reader).unwrap()
}

// This method only for prover/verifier params
pub fn save_to_file<P: AsRef<Path>, T: Serialize>(
    path: &P,
    data: &T,
) -> Result<(), Box<dyn Error>> {
    let serialized_data = bincode::serialize(data)?;
    let mut file = File::create(path)?;
    file.write_all(&serialized_data)?;
    Ok(())
}

// Read proving/verifying key from file
pub fn load_from_file<P: AsRef<Path> + ?Sized, T: for<'de> Deserialize<'de>>(
    path: &P,
) -> Result<T, Box<dyn Error>> {
    let mut file = File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;
    let deserialized_data = bincode::deserialize(&buffer)?;
    Ok(deserialized_data)
}

// Read proving/verifying key from bytes
pub fn load_from_bytes<T: for<'de> Deserialize<'de>>(bytes: &[u8]) -> Result<T, Box<dyn Error>> {
    let deserialized_data = bincode::deserialize(&bytes)?;
    Ok(deserialized_data)
}
