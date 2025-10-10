// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgeVerifier.sol";
import "../contracts/StudyRegistryImpl.sol";

/**
 * @title DeployVeritasSystem
 * @notice Deployment script for the Veritas Zero Health system
 * @dev Deploys AgeVerifier and StudyRegistry in the correct order
 */
contract DeployVeritasSystem is Script {
    function run() external {
        // Read private key from environment or use default for local testing
        uint256 deployerPrivateKey = vm.envOr(
            "DEPLOYER_PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy AgeVerifier
        console.log("Deploying AgeVerifier...");
        AgeVerifier ageVerifier = new AgeVerifier();
        console.log("AgeVerifier deployed at:", address(ageVerifier));

        // 2. Deploy StudyRegistry with AgeVerifier reference
        console.log("Deploying StudyRegistryImpl...");
        StudyRegistryImpl studyRegistry = new StudyRegistryImpl(
            address(ageVerifier)
        );
        console.log("StudyRegistryImpl deployed at:", address(studyRegistry));

        // 3. Verify deployment
        console.log("\n=== Deployment Summary ===");
        console.log("AgeVerifier:", address(ageVerifier));
        console.log("StudyRegistryImpl:", address(studyRegistry));
        console.log("========================\n");

        vm.stopBroadcast();

        // Export addresses for frontend
        string memory json = string(
            abi.encodePacked(
                '{"AgeVerifier":"',
                vm.toString(address(ageVerifier)),
                '","StudyRegistry":"',
                vm.toString(address(studyRegistry)),
                '"}'
            )
        );

        vm.writeFile("deployments/latest.json", json);
        console.log("Deployment addresses saved to deployments/latest.json");
    }
}
