// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/zk/AgeVerifier.sol";
import "../contracts/zk/EligibilityCodeVerifier.sol";

/**
 * @title Deploy ZK Verifiers
 * @notice Deploys Zero-Knowledge proof verifiers for privacy-preserving eligibility checks
 * @dev Multi-network compatible
 */
contract DeployZK is Script {

    // Deployed contracts
    AgeVerifier public ageVerifier;
    EligibilityCodeVerifier public eligibilityVerifier;

    /**
     * @notice Main deployment function
     * @return _ageVerifier Address of AgeVerifier
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

        // ============ 1. Deploy AgeVerifier ============
        console.log("\n=== Step 1: Deploying AgeVerifier ===");
        ageVerifier = new AgeVerifier();
        console.log("AgeVerifier:", address(ageVerifier));

        // ============ 2. Deploy EligibilityCodeVerifier ============
        console.log("\n=== Step 2: Deploying EligibilityCodeVerifier ===");
        eligibilityVerifier = new EligibilityCodeVerifier();
        console.log("EligibilityCodeVerifier:", address(eligibilityVerifier));

        vm.stopBroadcast();

        // ============ 3. Print Summary ============
        printDeploymentSummary();

        return (
            address(ageVerifier),
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
        console.log("AgeVerifier:                ", address(ageVerifier));
        console.log("EligibilityCodeVerifier:    ", address(eligibilityVerifier));
        console.log("=============================================================");
        console.log("\nNote: These verifiers enable privacy-preserving eligibility");
        console.log("checks. Patients can prove they meet criteria without");
        console.log("revealing their actual medical data.");
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
