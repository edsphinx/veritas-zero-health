// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "./DeployCore.s.sol";
import "./DeployStudies.s.sol";
import "./DeployZK.s.sol";

/**
 * @title DASHI Complete Deployment
 * @notice Orchestrates deployment of all DASHI contracts in the correct order
 * @dev Multi-network: Works on localhost, testnets, and mainnets
 *
 * Usage:
 *   Local:   yarn deploy
 *   Sepolia: yarn deploy --network sepolia
 *   Celo:    yarn deploy --network alfajores
 */
contract Deploy is Script {

    // All deployed contract addresses
    struct DeploymentAddresses {
        // Core
        address humanPassport;
        address providerRegistry;
        address healthIdentity;
        address accountFactory;
        address researchEscrow;
        // Studies
        address studyRegistry;
        address participationSBT;
        address enrollmentData;
        address vaultFactory;
        // ZK Verifiers
        address ageVerifier;
        address eligibilityVerifier;
    }

    DeploymentAddresses public addresses;

    function run() external {
        console.log("\n");
        console.log("=============================================================");
        console.log("           DASHI COMPLETE SYSTEM DEPLOYMENT");
        console.log("=============================================================");
        console.log("Network:", getNetworkName(block.chainid));
        console.log("Chain ID:", block.chainid);
        console.log("Timestamp:", block.timestamp);
        console.log("=============================================================");

        // ============ Phase 1: Core Infrastructure ============
        console.log("\n>>> PHASE 1: Deploying Core Infrastructure...");
        DeployCore coreDeployer = new DeployCore();
        (
            addresses.humanPassport,
            addresses.providerRegistry,
            addresses.healthIdentity,
            addresses.accountFactory,
            addresses.researchEscrow
        ) = coreDeployer.run();

        // ============ Phase 2: ZK Verifiers (needed for StudyRegistry) ============
        console.log("\n>>> PHASE 2: Deploying ZK Verifiers...");
        DeployZK zkDeployer = new DeployZK();
        (
            addresses.ageVerifier,
            addresses.eligibilityVerifier
        ) = zkDeployer.run();

        // ============ Phase 3: Clinical Trials ============
        console.log("\n>>> PHASE 3: Deploying Clinical Trials System...");
        DeployStudies studiesDeployer = new DeployStudies();
        (
            addresses.studyRegistry,
            addresses.participationSBT,
            addresses.enrollmentData,
            addresses.vaultFactory
        ) = studiesDeployer.run(
            addresses.ageVerifier
        );

        // ============ Final Summary ============
        printCompleteSummary();

        // ============ Save to JSON ============
        saveDeployment();
    }

    /**
     * @notice Print complete deployment summary
     */
    function printCompleteSummary() internal view {
        console.log("\n");
        console.log("=============================================================");
        console.log("           DASHI DEPLOYMENT COMPLETE - ALL ADDRESSES");
        console.log("=============================================================");
        console.log("Network:", getNetworkName(block.chainid));
        console.log("Chain ID:", block.chainid);
        console.log("=============================================================");
        console.log("\nCORE CONTRACTS:");
        console.log("  Human Passport:           ", addresses.humanPassport);
        console.log("  MedicalProviderRegistry:  ", addresses.providerRegistry);
        console.log("  HealthIdentitySBT:        ", addresses.healthIdentity);
        console.log("  PatientAccountFactory:    ", addresses.accountFactory);
        console.log("  ResearchFundingEscrow:    ", addresses.researchEscrow);
        console.log("\nCLINICAL TRIALS:");
        console.log("  StudyRegistryImpl:        ", addresses.studyRegistry);
        console.log("  StudyParticipationSBT:    ", addresses.participationSBT);
        console.log("  StudyEnrollmentData:      ", addresses.enrollmentData);
        console.log("  CommitmentVaultFactory:   ", addresses.vaultFactory);
        console.log("\nZK VERIFIERS:");
        console.log("  AgeVerifier:              ", addresses.ageVerifier);
        console.log("  EligibilityCodeVerifier:  ", addresses.eligibilityVerifier);
        console.log("=============================================================");
        console.log("\nNEXT STEPS:");
        console.log("1. Update packages/nextjs/contracts/deployedContracts.ts");
        console.log("2. Verify contracts on block explorer (if not localhost)");
        console.log("3. Test frontend integration with deployed contracts");
        console.log("4. Grant necessary roles to admin/operator addresses");
        console.log("=============================================================\n");
    }

    /**
     * @notice Save deployment addresses to JSON file
     */
    function saveDeployment() internal {
        console.log("Saving deployment to JSON...");

        string memory obj = "deployment";
        vm.serializeUint(obj, "chainId", block.chainid);
        vm.serializeString(obj, "network", getNetworkName(block.chainid));
        vm.serializeUint(obj, "timestamp", block.timestamp);

        // Core
        vm.serializeAddress(obj, "humanPassport", addresses.humanPassport);
        vm.serializeAddress(obj, "providerRegistry", addresses.providerRegistry);
        vm.serializeAddress(obj, "healthIdentity", addresses.healthIdentity);
        vm.serializeAddress(obj, "accountFactory", addresses.accountFactory);
        vm.serializeAddress(obj, "researchEscrow", addresses.researchEscrow);

        // Studies
        vm.serializeAddress(obj, "studyRegistry", addresses.studyRegistry);
        vm.serializeAddress(obj, "participationSBT", addresses.participationSBT);
        vm.serializeAddress(obj, "enrollmentData", addresses.enrollmentData);
        vm.serializeAddress(obj, "vaultFactory", addresses.vaultFactory);

        // ZK
        vm.serializeAddress(obj, "ageVerifier", addresses.ageVerifier);
        string memory finalJson = vm.serializeAddress(obj, "eligibilityVerifier", addresses.eligibilityVerifier);

        string memory filename = string.concat(
            "./deployments/",
            vm.toString(block.chainid),
            "_latest.json"
        );

        vm.writeJson(finalJson, filename);
        console.log("Deployment saved to:", filename);
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
