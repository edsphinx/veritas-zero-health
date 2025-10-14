// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/HealthIdentitySBT.sol";
import "../contracts/core/PatientAccountFactory.sol";
import "../contracts/core/MedicalProviderRegistry.sol";
import "../contracts/funding/ResearchFundingEscrow.sol";
import "../contracts/mocks/MockHumanPassport.sol";

/**
 * @title Deploy DASHI System
 * @notice Deploy script for complete DASHI (Decentralized Anonymous Sovereign Health Identity) system
 * @dev Deploys all core contracts in the correct order with proper initialization
 *
 * Components:
 * 1. MedicalProviderRegistry - Provider certification and management
 * 2. HealthIdentitySBT - Patient health identity SBT
 * 3. PatientAccountFactory - Smart account factory for multi-chain
 * 4. ResearchFundingEscrow - Research study funding and milestone payments
 */
contract DeployDASHI is Script {

    // Deployed contract addresses
    MedicalProviderRegistry public providerRegistry;
    HealthIdentitySBT public healthIdentity;
    PatientAccountFactory public accountFactory;
    ResearchFundingEscrow public researchEscrow;

    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // Human Passport address (deploy mock for local testnet)
        address humanPassportAddress;

        vm.startBroadcast(deployerPrivateKey);

        // ============ 0. Deploy MockHumanPassport (for local testing) ============
        if (block.chainid == 31337) {
            console.log("\n=== Deploying MockHumanPassport (local testnet) ===");
            MockHumanPassport mockPassport = new MockHumanPassport();
            humanPassportAddress = address(mockPassport);
            console.log("MockHumanPassport deployed at:", humanPassportAddress);
        } else {
            // For non-local chains, use env variable
            try vm.envAddress("HUMAN_PASSPORT_ADDRESS") returns (address addr) {
                humanPassportAddress = addr;
            } catch {
                revert("HUMAN_PASSPORT_ADDRESS required for non-local chains");
            }
        }

        // ============ 1. Deploy MedicalProviderRegistry ============
        console.log("\n=== Deploying MedicalProviderRegistry ===");
        providerRegistry = new MedicalProviderRegistry();
        console.log("MedicalProviderRegistry deployed at:", address(providerRegistry));

        // ============ 2. Deploy HealthIdentitySBT ============
        console.log("\n=== Deploying HealthIdentitySBT ===");
        require(humanPassportAddress != address(0), "Human Passport address required for HealthIdentitySBT");
        healthIdentity = new HealthIdentitySBT(humanPassportAddress);
        console.log("HealthIdentitySBT deployed at:", address(healthIdentity));

        // ============ 3. Deploy PatientAccountFactory ============
        console.log("\n=== Deploying PatientAccountFactory ===");
        accountFactory = new PatientAccountFactory();
        console.log("PatientAccountFactory deployed at:", address(accountFactory));

        // ============ 4. Deploy ResearchFundingEscrow ============
        console.log("\n=== Deploying ResearchFundingEscrow ===");
        researchEscrow = new ResearchFundingEscrow(address(providerRegistry));
        console.log("ResearchFundingEscrow deployed at:", address(researchEscrow));

        // ============ 5. Setup Initial Configuration ============
        console.log("\n=== Initial Configuration ===");

        // Set factory address in HealthIdentitySBT if needed
        // (Add setter function if not exists)

        // Setup example providers on local/testnet
        if (block.chainid == 31337 || block.chainid == 11155111) { // localhost or Sepolia
            setupExampleProviders();
        }

        vm.stopBroadcast();

        // ============ 6. Print Deployment Summary ============
        printDeploymentSummary(humanPassportAddress);

        // ============ 7. Save Deployment to JSON ============
        saveDeployment();
    }

    /**
     * @notice Setup example providers for testing (local/testnet only)
     */
    function setupExampleProviders() internal {
        console.log("\n=== Setting up example providers ===");

        // Provider 1: Mayo Clinic (Level 3 - Hospital)
        address provider1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        string[] memory specializations1 = new string[](3);
        specializations1[0] = "cardiology";
        specializations1[1] = "oncology";
        specializations1[2] = "neurology";

        providerRegistry.certifyProvider(
            provider1,
            "Mayo Clinic",
            "US-MED-2024-001",
            keccak256("mayo-clinic-license-doc"),
            3, // Hospital level
            365 days, // 1 year duration
            "US",
            specializations1
        );
        console.log("Certified provider 1 (Mayo Clinic):", provider1);

        // Provider 2: Johns Hopkins (Level 3 - Hospital & Research)
        address provider2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        string[] memory specializations2 = new string[](2);
        specializations2[0] = "research";
        specializations2[1] = "oncology";

        providerRegistry.certifyProvider(
            provider2,
            "Johns Hopkins Hospital",
            "US-MED-2024-002",
            keccak256("hopkins-license-doc"),
            3, // Hospital level
            365 days,
            "US",
            specializations2
        );
        console.log("Certified provider 2 (Johns Hopkins):", provider2);

        // Provider 3: Individual Doctor (Level 1)
        address provider3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        string[] memory specializations3 = new string[](1);
        specializations3[0] = "general-practice";

        providerRegistry.certifyProvider(
            provider3,
            "Dr. Jane Smith",
            "US-MED-2024-003",
            keccak256("smith-license-doc"),
            1, // Individual practitioner
            365 days,
            "US",
            specializations3
        );
        console.log("Certified provider 3 (Dr. Smith):", provider3);

        // Grant verifier role to providers in ResearchEscrow
        researchEscrow.addVerifier(provider1);
        researchEscrow.addVerifier(provider2);
        console.log("Granted verifier roles to providers");

        // Create example research study
        createExampleStudy(provider1, provider2);
    }

    /**
     * @notice Create an example research study for testing
     */
    function createExampleStudy(address provider1, address provider2) internal {
        console.log("\n=== Creating example research study ===");

        address[] memory certifiedProviders = new address[](2);
        certifiedProviders[0] = provider1;
        certifiedProviders[1] = provider2;

        // Create study
        uint256 studyId = researchEscrow.createStudy(
            "Type 2 Diabetes Longitudinal Study",
            "A 6-month study tracking glucose levels and lifestyle interventions in T2D patients",
            certifiedProviders,
            100 // max participants
        );
        console.log("Created study ID:", studyId);

        // Add milestones
        uint256 milestone1 = researchEscrow.addMilestone(
            studyId,
            IStudyTypes.MilestoneType.Enrollment,
            "Initial enrollment and baseline measurements",
            0.05 ether
        );
        console.log("Added milestone 1 (Enrollment):", milestone1);

        uint256 milestone2 = researchEscrow.addMilestone(
            studyId,
            IStudyTypes.MilestoneType.DataSubmission,
            "Weekly glucose readings (4 weeks)",
            0.1 ether
        );
        console.log("Added milestone 2 (Data Submission):", milestone2);

        uint256 milestone3 = researchEscrow.addMilestone(
            studyId,
            IStudyTypes.MilestoneType.FollowUpVisit,
            "3-month follow-up visit",
            0.15 ether
        );
        console.log("Added milestone 3 (Follow-up):", milestone3);

        uint256 milestone4 = researchEscrow.addMilestone(
            studyId,
            IStudyTypes.MilestoneType.StudyCompletion,
            "6-month completion with final assessment",
            0.2 ether
        );
        console.log("Added milestone 4 (Completion):", milestone4);

        // Fund the study (0.5 ETH per participant * 100 participants = 50 ETH)
        // For testing, fund with 5 ETH (enough for 10 participants)
        // COMMENTED OUT: Deployer account may not have enough funds
        // researchEscrow.fundStudyETH{value: 5 ether}(studyId);
        // console.log("Funded study with 5 ETH");

        // Start the study
        // COMMENTED OUT: Need to fund before starting
        // researchEscrow.startStudy(studyId);
        console.log("Study created (not funded/started yet - can be done later)");
    }

    /**
     * @notice Print deployment summary
     */
    function printDeploymentSummary(address humanPassportAddress) internal view {
        console.log("\n");
        console.log("=============================================================");
        console.log("       DASHI System Deployment Summary");
        console.log("=============================================================");
        console.log("Network:                    ", getNetworkName(block.chainid));
        console.log("Chain ID:                   ", block.chainid);
        console.log("Deployer:                   ", msg.sender);
        console.log("-------------------------------------------------------------");
        console.log("MedicalProviderRegistry:    ", address(providerRegistry));
        console.log("HealthIdentitySBT:          ", address(healthIdentity));
        console.log("PatientAccountFactory:      ", address(accountFactory));
        console.log("ResearchFundingEscrow:      ", address(researchEscrow));
        console.log("-------------------------------------------------------------");
        console.log("Human Passport:             ", humanPassportAddress);
        console.log("=============================================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Save contract addresses to deployments/latest.json");
        console.log("2. Verify contracts on block explorer");
        console.log("3. Update frontend configuration with new addresses");
        console.log("4. Grant necessary roles to admin addresses");
        console.log("5. Deploy to additional chains (multi-chain)");
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
        if (chainId == 10) return "Optimism";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 31337) return "Localhost";
        return "Unknown";
    }

    /**
     * @notice Save deployment addresses to JSON file
     */
    function saveDeployment() internal {
        console.log("\n=== Saving deployment to JSON ===");

        string memory obj = "deployment";
        vm.serializeUint(obj, "chainId", block.chainid);
        vm.serializeString(obj, "network", getNetworkName(block.chainid));
        vm.serializeAddress(obj, "deployer", msg.sender);
        vm.serializeAddress(obj, "providerRegistry", address(providerRegistry));
        vm.serializeAddress(obj, "healthIdentity", address(healthIdentity));
        vm.serializeAddress(obj, "accountFactory", address(accountFactory));
        string memory finalJson = vm.serializeAddress(obj, "researchEscrow", address(researchEscrow));

        string memory filename = string.concat(
            "./deployments/",
            vm.toString(block.chainid),
            "_latest.json"
        );

        vm.writeJson(finalJson, filename);
        console.log("Deployment saved to:", filename);
    }
}
