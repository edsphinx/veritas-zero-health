// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/zk/EligibilityCodeVerifier.sol";
import "../contracts/studies/StudyRegistry.sol";

/**
 * @title DeployVeritasSystem
 * @notice Deployment script for the Veritas Zero Health system
 * @dev Deploys EligibilityCodeVerifier (Groth16) and StudyRegistry
 *
 * NOTE: Age verification is done client-side using Halo2/Mopro WASM
 * Only medical eligibility code verification is done on-chain
 */
contract DeployVeritasSystem is Script {
    function run() external {
        // Determine which account to use based on network
        if (block.chainid == 31337) {
            // Localhost: Use ENV variable or use vm.startBroadcast() which picks up the keystore from Makefile
            console.log("Deploying on localhost...");
            vm.startBroadcast();
        } else {
            // Testnet/Mainnet: Use DEPLOYER_PRIVATE_KEY from ENV or keystore (handled by Makefile)
            console.log("Deploying on testnet/mainnet...");
            console.log("Network:", getNetworkName(block.chainid));
            console.log("Chain ID:", block.chainid);

            vm.startBroadcast();
        }

        // 1. Deploy EligibilityCodeVerifier (Groth16)
        console.log("Deploying EligibilityCodeVerifier (Groth16)...");
        Groth16Verifier eligibilityVerifier = new Groth16Verifier();
        console.log("EligibilityCodeVerifier deployed at:", address(eligibilityVerifier));

        // 2. Deploy StudyRegistry with EligibilityCodeVerifier reference
        console.log("Deploying StudyRegistry...");
        StudyRegistry studyRegistry = new StudyRegistry(
            address(eligibilityVerifier)
        );
        console.log("StudyRegistry deployed at:", address(studyRegistry));

        // 3. Verify deployment
        console.log("\n=== Deployment Summary ===");
        console.log("EligibilityCodeVerifier:", address(eligibilityVerifier));
        console.log("StudyRegistry:", address(studyRegistry));
        console.log("NOTE: Age verification is client-side (Halo2/Mopro WASM)");
        console.log("========================\n");

        vm.stopBroadcast();

        // Export addresses for frontend
        string memory json = string(
            abi.encodePacked(
                '{"EligibilityCodeVerifier":"',
                vm.toString(address(eligibilityVerifier)),
                '","StudyRegistry":"',
                vm.toString(address(studyRegistry)),
                '"}'
            )
        );

        vm.writeFile("deployments/latest.json", json);
        console.log("Deployment addresses saved to deployments/latest.json");
    }

    /**
     * @notice Get network name from chain ID
     */
    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia Testnet";
        if (chainId == 8453) return "Base";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 10) return "Optimism";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 42220) return "Celo";
        if (chainId == 44787) return "Celo Alfajores";
        if (chainId == 31337) return "Localhost";
        return "Unknown";
    }
}
