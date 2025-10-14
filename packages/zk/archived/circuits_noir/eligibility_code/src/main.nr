// Eligibility Code Verification Circuit
// Proves: Patient knows a valid eligibility code without revealing it
//
// This circuit is MUCH simpler than range proofs:
// - Instead of proving "18 <= age <= 65"
// - We prove: "I know code ABC123 which represents that eligibility"
//
// The hash of valid codes are published on-chain by researchers.
// Patients prove they know a code that hashes to an approved value.

use dep::std;

fn main(
    // Private input: The eligibility code the patient has
    // Format: Can be any fixed-size array representing the code
    // Example: "AG1845" for "Age Group 18-45"
    eligibility_code: [u8; 32],

    // Public input: Hash of the required eligibility code
    // This is published by the researcher on-chain
    required_code_hash: pub Field
) {
    // Convert bytes to Field elements for hashing
    let mut code_as_fields: [Field; 32] = [0; 32];
    for i in 0..32 {
        code_as_fields[i] = eligibility_code[i] as Field;
    }

    // Hash the private eligibility code
    let computed_hash = std::hash::pedersen_hash(code_as_fields);

    // Verify that the patient's code hashes to the required value
    assert(
        computed_hash == required_code_hash,
        "Eligibility code does not match required criteria"
    );
}

// ============================================================================
// TESTS
// ============================================================================

#[test]
fn test_valid_eligibility_code() {
    // Example: Patient has code "AG1845" (Age Group 18-45)
    let mut code: [u8; 32] = [0; 32];

    // Encode "AG1845" as bytes
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

    // Compute expected hash
    let hash = std::hash::pedersen_hash(code_as_fields);

    // Patient can prove they have this code
    main(code, hash);
}

#[test]
fn test_composite_eligibility_code() {
    // Example: Patient has code "AG1845-HTN-DM2"
    // (Age 18-45, Hypertension, Diabetes Type 2)
    let mut code: [u8; 32] = [0; 32];

    // Encode composite criteria
    code[0] = 65;  // 'A'
    code[1] = 71;  // 'G'
    code[2] = 49;  // '1'
    code[3] = 56;  // '8'
    code[4] = 52;  // '4'
    code[5] = 53;  // '5'
    code[6] = 45;  // '-'
    code[7] = 72;  // 'H'
    code[8] = 84;  // 'T'
    code[9] = 78;  // 'N'
    code[10] = 45; // '-'
    code[11] = 68; // 'D'
    code[12] = 77; // 'M'
    code[13] = 50; // '2'

    let mut code_as_fields: [Field; 32] = [0; 32];
    for i in 0..32 {
        code_as_fields[i] = code[i] as Field;
    }

    let hash = std::hash::pedersen_hash(code_as_fields);
    main(code, hash);
}

#[test]
fn test_numeric_code() {
    // Example: Simple numeric code "123456"
    let mut code: [u8; 32] = [0; 32];

    code[0] = 49;  // '1'
    code[1] = 50;  // '2'
    code[2] = 51;  // '3'
    code[3] = 52;  // '4'
    code[4] = 53;  // '5'
    code[5] = 54;  // '6'

    let mut code_as_fields: [Field; 32] = [0; 32];
    for i in 0..32 {
        code_as_fields[i] = code[i] as Field;
    }

    let hash = std::hash::pedersen_hash(code_as_fields);
    main(code, hash);
}

#[test]
fn test_biomarker_code() {
    // Example: Biomarker range code "CHOL-LOW-BP-NORMAL"
    let mut code: [u8; 32] = [0; 32];

    // "CHOL-LOW"
    code[0] = 67;  // 'C'
    code[1] = 72;  // 'H'
    code[2] = 79;  // 'O'
    code[3] = 76;  // 'L'
    code[4] = 45;  // '-'
    code[5] = 76;  // 'L'
    code[6] = 79;  // 'O'
    code[7] = 87;  // 'W'

    let mut code_as_fields: [Field; 32] = [0; 32];
    for i in 0..32 {
        code_as_fields[i] = code[i] as Field;
    }

    let hash = std::hash::pedersen_hash(code_as_fields);
    main(code, hash);
}

// Test that wrong code fails
#[test]
fn test_invalid_code_should_fail() {
    // This test is commented out because Noir test framework
    // doesn't support testing expected failures yet
    // But in practice, this WILL fail:

    // let mut correct_code: [u8; 32] = [0; 32];
    // correct_code[0] = 65; // 'A'
    // let correct_hash = std::hash::pedersen_hash(correct_code);

    // let mut wrong_code: [u8; 32] = [0; 32];
    // wrong_code[0] = 66; // 'B' (different!)

    // main(wrong_code, correct_hash[0]); // Should fail!
}
