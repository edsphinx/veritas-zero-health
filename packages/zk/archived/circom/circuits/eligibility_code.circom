pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/**
 * EligibilityCode Circuit
 *
 * Proves that a patient knows an eligibility code that hashes to a required value
 * WITHOUT revealing the actual code.
 *
 * This is much simpler than range proofs and more flexible:
 * - One proof for multiple criteria
 * - Better privacy (doesn't reveal which criteria)
 * - Extensible to any combination of medical data
 *
 * Example codes:
 * - "AG1845" = Age 18-45
 * - "AG1845-HTN_NO-DM2_YES" = Age 18-45, No Hypertension, Has Diabetes Type 2
 */
template EligibilityCode() {
    // Private input: The eligibility code (32 bytes as 4 field elements)
    // We use 4 field elements to represent 32 bytes (8 bytes per field)
    signal input code[4];

    // Public input: Hash of the required eligibility code
    // This is published by the researcher on-chain
    signal input requiredCodeHash;

    // Compute Poseidon hash of the code
    // Poseidon is a ZK-friendly hash function designed for circuits
    component hasher = Poseidon(4);
    for (var i = 0; i < 4; i++) {
        hasher.inputs[i] <== code[i];
    }

    // Verify that computed hash equals required hash
    component eq = IsEqual();
    eq.in[0] <== hasher.out;
    eq.in[1] <== requiredCodeHash;

    // Constrain that they must be equal
    eq.out === 1;
}

// Main component
component main {public [requiredCodeHash]} = EligibilityCode();
