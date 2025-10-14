// Helper to compute hash for a given code
// Run this with: nargo execute compute_hash
use dep::std;

fn main() -> pub Field {
    // Example code "AG1845"
    let mut code: [u8; 32] = [0; 32];
    code[0] = 65;  // 'A'
    code[1] = 71;  // 'G'
    code[2] = 49;  // '1'
    code[3] = 56;  // '8'
    code[4] = 52;  // '4'
    code[5] = 53;  // '5'

    // Convert to Field for hashing
    let mut code_as_fields: [Field; 32] = [0; 32];
    for i in 0..32 {
        code_as_fields[i] = code[i] as Field;
    }

    // Return the hash
    std::hash::pedersen_hash(code_as_fields)
}
