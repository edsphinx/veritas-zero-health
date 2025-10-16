// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/zk/EligibilityCodeVerifier.sol";

/**
 * @title Deploy ZK Verifiers
 * @notice Deploys Zero-Knowledge proof verifiers for privacy-preserving eligibility checks
 * @dev Multi-network compatible
 *
 * NOTE: Age verification is done client-side using Halo2/Mopro WASM (33-60ms)
 * Only medical eligibility code verification is done on-chain using Circom/Groth16
 */
contract DeployZK is Script {

    // Deployed contract
    Groth16Verifier public eligibilityVerifier;

    /**
     * @notice Main deployment function
     * @return _ageVerifier Address placeholder (0x0 - age verification is client-side)
     * @return _eligibilityVerifier Address of EligibilityCodeVerifier
     */
    function run() external returns (
        address _ageVerifier,
        address _eligibilityVerifier
    ) {
        if (block.chainid == 31337) {
            vm.startBroadcast();
        } else {
            uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
            vm.startBroadcast(deployerPrivateKey);
        }

        // ============ 1. Deploy EligibilityCodeVerifier (Groth16) ============
        console.log("\n=== Step 1: Deploying EligibilityCodeVerifier ===");
        eligibilityVerifier = new Groth16Verifier();
        console.log("EligibilityCodeVerifier:", address(eligibilityVerifier));

        vm.stopBroadcast();

        // ============ 2. Print Summary ============
        printDeploymentSummary();

        return (
            address(0), // Age verification is client-side
            address(eligibilityVerifier)
        );
    }

    /**
     * @notice Print deployment summary
     */
    function printDeploymentSummary() internal view {
        console.log("\n");
        console.log("=============================================================");
        console.log("         DASHI ZK Verifiers - Deployment Summary");
        console.log("=============================================================");
        console.log("Network:", getNetworkName(block.chainid));
        console.log("Chain ID:", block.chainid);
        console.log("-------------------------------------------------------------");
        console.log("EligibilityCodeVerifier:    ", address(eligibilityVerifier));
        console.log("-------------------------------------------------------------");
        console.log("NOTE: Age verification is done client-side using Halo2/Mopro");
        console.log("      Medical eligibility verification is done on-chain");
        console.log("=============================================================");
        console.log("\nThese verifiers enable privacy-preserving eligibility checks.");
        console.log("Patients can prove they meet criteria without revealing");
        console.log("their actual medical data.");
        console.log("=============================================================");
    }

    /**
     * @notice Get network name from chain ID
     */
    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 8453) return "Base";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 42220) return "Celo";
        if (chainId == 44787) return "Celo Alfajores";
        if (chainId == 31337) return "Localhost";
        return "Unknown";
    }
}
