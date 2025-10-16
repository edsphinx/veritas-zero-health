/**
 * Eligibility Proof Service
 *
 * Generates Groth16 zero-knowledge proofs for medical eligibility codes
 * using Circom circuits and snarkjs.
 *
 * This service complements the age verification (Halo2/Mopro) by providing
 * on-chain verification for sensitive medical data.
 */

import { groth16 } from "snarkjs";

/**
 * Groth16 proof structure for Solidity contract
 */
export interface Groth16Proof {
  pA: [string, string];
  pB: [[string, string], [string, string]];
  pC: [string, string];
  publicSignals: string[];
}

/**
 * Generates a Groth16 proof for an eligibility code
 *
 * @param eligibilityCode 4-element eligibility code [biomarker, vital, medAllergy, diagnosis]
 * @param requiredCodeHash Poseidon hash of the required eligibility code (public input)
 * @returns Groth16 proof formatted for Solidity contract
 */
export async function generateEligibilityProof(
  eligibilityCode: bigint[],
  requiredCodeHash: bigint
): Promise<Groth16Proof> {
  if (eligibilityCode.length !== 4) {
    throw new Error("Eligibility code must have exactly 4 elements");
  }

  console.log("🔐 Generating eligibility proof...");
  console.log("  Code:", eligibilityCode.map(c => c.toString()));
  console.log("  Required hash:", requiredCodeHash.toString());

  const startTime = performance.now();

  try {
    // Prepare circuit inputs
    const input = {
      code: eligibilityCode.map(c => c.toString()),
      requiredCodeHash: requiredCodeHash.toString()
    };

    // Generate proof
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      "/zk/eligibility_code.wasm",
      "/zk/eligibility_0000.zkey"
    );

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(0);

    console.log(`✅ Proof generated in ${duration}ms`);
    console.log("  Public signals:", publicSignals);

    // Format proof for Solidity contract
    // Groth16Verifier.sol expects: verifyProof(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint[1] _pubSignals)
    return {
      pA: [proof.pi_a[0], proof.pi_a[1]],
      pB: [
        [proof.pi_b[0][1], proof.pi_b[0][0]], // Note: reversed for bn128 pairing
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      pC: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals
    };
  } catch (error) {
    console.error("❌ Proof generation failed:", error);
    throw new Error(`Failed to generate eligibility proof: ${error}`);
  }
}

/**
 * Verifies an eligibility proof locally (for testing)
 *
 * @param proof Groth16 proof to verify
 * @param publicSignals Public signals (required code hash)
 * @returns True if proof is valid
 */
export async function verifyEligibilityProof(
  proof: Groth16Proof,
  publicSignals: string[]
): Promise<boolean> {
  console.log("🔍 Verifying eligibility proof locally...");

  const startTime = performance.now();

  try {
    // Load verification key from zkey file
    const vKeyResponse = await fetch("/zk/eligibility_0000.zkey");
    const vKeyBuffer = await vKeyResponse.arrayBuffer();

    // Convert proof back to snarkjs format
    const snarkjsProof = {
      pi_a: [proof.pA[0], proof.pA[1], "1"],
      pi_b: [
        [proof.pB[0][1], proof.pB[0][0], "1"], // Reverse back
        [proof.pB[1][1], proof.pB[1][0], "1"]
      ],
      pi_c: [proof.pC[0], proof.pC[1], "1"],
      protocol: "groth16",
      curve: "bn128"
    };

    const isValid = await groth16.verify(
      vKeyBuffer,
      publicSignals,
      snarkjsProof
    );

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(0);

    console.log(`${isValid ? "✅" : "❌"} Proof ${isValid ? "valid" : "invalid"} (verified in ${duration}ms)`);

    return isValid;
  } catch (error) {
    console.error("❌ Proof verification failed:", error);
    return false;
  }
}

/**
 * Example: Generate proof for a Type 2 Diabetes study
 */
export async function exampleDiabetesProof() {
  // Example eligibility code (from patient data)
  const eligibilityCode = [
    BigInt("12345678901234567890"), // Biomarker hash
    BigInt("98765432109876543210"), // Vital signs hash
    BigInt("11111111111111111111"), // Med/allergy hash
    BigInt("22222222222222222222")  // Diagnosis hash
  ];

  // Example required code hash (from study criteria)
  const requiredCodeHash = BigInt("33333333333333333333");

  try {
    // Generate proof
    const proof = await generateEligibilityProof(eligibilityCode, requiredCodeHash);

    // Verify locally
    const isValid = await verifyEligibilityProof(proof, proof.publicSignals);

    return { proof, isValid };
  } catch (error) {
    console.error("Example proof generation failed:", error);
    throw error;
  }
}

/**
 * Format proof for contract submission
 *
 * Converts proof to the format expected by StudyRegistryImpl.submitAnonymousApplication()
 */
export function formatProofForContract(proof: Groth16Proof): {
  pA: [string, string];
  pB: [[string, string], [string, string]];
  pC: [string, string];
} {
  return {
    pA: proof.pA,
    pB: proof.pB,
    pC: proof.pC
  };
}
