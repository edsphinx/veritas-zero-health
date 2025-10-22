// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/HealthIdentitySBT.sol";
import "../contracts/core/PatientAccountFactory.sol";
import "../contracts/core/MedicalProviderRegistry.sol";
import "../contracts/funding/ResearchFundingEscrow.sol";
import "../contracts/funding/CommitmentVaultFactory.sol";
import "../contracts/studies/StudyRegistry.sol";
import "../contracts/studies/StudyParticipationSBT.sol";
import "../contracts/studies/StudyEnrollmentData.sol";
import "../contracts/studies/ComplianceScore.sol";
import "../contracts/nft/StudyAccessNFT.sol";
import "../contracts/zk/EligibilityCodeVerifier.sol";
import "../contracts/mocks/MockHumanPassport.sol";
import "../contracts/mocks/MockUSDC.sol";

/**
 * @title DeployComplete
 * @notice Complete deployment script for ALL Veritas Zero Health / DASHI contracts
 * @dev Deploys all 13 contracts in correct dependency order across multiple testnets
 *
 * Usage:
 * Optimism Sepolia:
 *   forge script script/DeployComplete.s.sol:DeployComplete --rpc-url optimism_sepolia --broadcast --verify
 *
 * Celo Alfajores:
 *   forge script script/DeployComplete.s.sol:DeployComplete --rpc-url celo_alfajores --broadcast --verify
 *
 * Celo Sepolia:
 *   forge script script/DeployComplete.s.sol:DeployComplete --rpc-url celo_sepolia --broadcast --verify
 */
contract DeployComplete is Script {
    // Deployed contract references
    MockHumanPassport public humanPassport;
    MockUSDC public mockUSDC;
    MedicalProviderRegistry public providerRegistry;
    HealthIdentitySBT public healthIdentity;
    PatientAccountFactory public accountFactory;
    StudyParticipationSBT public participationSBT;
    StudyEnrollmentData public enrollmentData;
    Groth16Verifier public eligibilityVerifier;
    StudyRegistry public studyRegistry;
    ResearchFundingEscrow public researchEscrow;
    CommitmentVaultFactory public vaultFactory;
    StudyAccessNFT public studyAccessNFT;
    ComplianceScore public complianceScore;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=============================================================");
        console.log("       COMPLETE DASHI SYSTEM DEPLOYMENT");
        console.log("=============================================================");
        console.log("Network:        ", getNetworkName(block.chainid));
        console.log("Chain ID:       ", block.chainid);
        console.log("Deployer:       ", deployer);
        console.log("=============================================================");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ============ 1. MOCK CONTRACTS (Testnets only) ============
        console.log(">>> Deploying Mock Contracts...");

        humanPassport = new MockHumanPassport();
        console.log("  MockHumanPassport:        ", address(humanPassport));

        mockUSDC = new MockUSDC();
        console.log("  MockUSDC:                 ", address(mockUSDC));
        console.log("");

        // ============ 2. CORE IDENTITY & REGISTRY ============
        console.log(">>> Deploying Core Identity Contracts...");

        providerRegistry = new MedicalProviderRegistry();
        console.log("  MedicalProviderRegistry:  ", address(providerRegistry));

        healthIdentity = new HealthIdentitySBT(address(humanPassport));
        console.log("  HealthIdentitySBT:        ", address(healthIdentity));

        accountFactory = new PatientAccountFactory();
        console.log("  PatientAccountFactory:    ", address(accountFactory));
        console.log("");

        // ============ 3. STUDY PARTICIPATION & ENROLLMENT ============
        console.log(">>> Deploying Study Participation Contracts...");

        participationSBT = new StudyParticipationSBT();
        console.log("  StudyParticipationSBT:    ", address(participationSBT));

        enrollmentData = new StudyEnrollmentData(
            address(participationSBT),
            deployer // owner
        );
        console.log("  StudyEnrollmentData:      ", address(enrollmentData));
        console.log("");

        // ============ 4. ZK VERIFIER & STUDY REGISTRY ============
        console.log(">>> Deploying ZK & Registry Contracts...");

        eligibilityVerifier = new Groth16Verifier();
        console.log("  EligibilityCodeVerifier:  ", address(eligibilityVerifier));

        studyRegistry = new StudyRegistry(address(eligibilityVerifier));
        console.log("  StudyRegistry:            ", address(studyRegistry));
        console.log("");

        // ============ 5. FUNDING & ESCROW ============
        console.log(">>> Deploying Funding Contracts...");

        researchEscrow = new ResearchFundingEscrow(address(providerRegistry));
        console.log("  ResearchFundingEscrow:    ", address(researchEscrow));

        vaultFactory = new CommitmentVaultFactory(address(enrollmentData));
        console.log("  CommitmentVaultFactory:   ", address(vaultFactory));
        console.log("");

        // ============ 6. NFT & SCORING SYSTEMS ============
        console.log(">>> Deploying NFT & Scoring Contracts...");

        studyAccessNFT = new StudyAccessNFT(
            "DASHI Study Access",
            "DASHI-ACCESS",
            deployer // initial owner
        );
        console.log("  StudyAccessNFT:           ", address(studyAccessNFT));

        complianceScore = new ComplianceScore(
            address(participationSBT),
            address(enrollmentData)
        );
        console.log("  ComplianceScore:          ", address(complianceScore));
        console.log("");

        // ============ 7. POST-DEPLOYMENT CONFIGURATION ============
        console.log(">>> Configuring Contracts...");

        // Grant verifier role to deployer for testing
        researchEscrow.grantRole(researchEscrow.VERIFIER_ROLE(), deployer);
        console.log("  Granted VERIFIER_ROLE to deployer");

        // Setup ParticipationSBT in EnrollmentData
        participationSBT.setEnrollmentDataContract(address(enrollmentData));
        console.log("  Linked ParticipationSBT <-> EnrollmentData");

        console.log("");

        vm.stopBroadcast();

        // ============ 8. SAVE DEPLOYMENT TO JSON ============
        saveDeployment(deployer);

        // ============ 9. PRINT SUMMARY ============
        printDeploymentSummary();
    }

    /**
     * @notice Save deployment addresses to JSON file
     */
    function saveDeployment(address deployer) internal {
        console.log(">>> Saving deployment to JSON...");

        string memory obj = "deployment";
        vm.serializeUint(obj, "chainId", block.chainid);
        vm.serializeString(obj, "network", getNetworkName(block.chainid));
        vm.serializeUint(obj, "timestamp", block.timestamp);
        vm.serializeAddress(obj, "deployer", deployer);

        // Core contracts
        vm.serializeAddress(obj, "humanPassport", address(humanPassport));
        vm.serializeAddress(obj, "MockUSDC", address(mockUSDC));
        vm.serializeAddress(obj, "providerRegistry", address(providerRegistry));
        vm.serializeAddress(obj, "healthIdentity", address(healthIdentity));
        vm.serializeAddress(obj, "accountFactory", address(accountFactory));

        // Study contracts
        vm.serializeAddress(obj, "participationSBT", address(participationSBT));
        vm.serializeAddress(obj, "enrollmentData", address(enrollmentData));
        vm.serializeAddress(obj, "eligibilityVerifier", address(eligibilityVerifier));
        vm.serializeAddress(obj, "studyRegistry", address(studyRegistry));

        // Funding contracts
        vm.serializeAddress(obj, "researchEscrow", address(researchEscrow));
        vm.serializeAddress(obj, "vaultFactory", address(vaultFactory));

        // NFT & Scoring
        vm.serializeAddress(obj, "studyAccessNFT", address(studyAccessNFT));
        string memory finalJson = vm.serializeAddress(obj, "complianceScore", address(complianceScore));

        string memory filename = string.concat(
            "./deployments/",
            vm.toString(block.chainid),
            "_latest.json"
        );

        vm.writeJson(finalJson, filename);
        console.log("  Saved to:", filename);
        console.log("");
    }

    /**
     * @notice Print deployment summary
     */
    function printDeploymentSummary() internal view {
        console.log("=============================================================");
        console.log("       DEPLOYMENT SUMMARY - ALL CONTRACTS");
        console.log("=============================================================");
        console.log("Network:                  ", getNetworkName(block.chainid));
        console.log("Chain ID:                 ", block.chainid);
        console.log("");
        console.log("--- Mock Contracts ---");
        console.log("MockHumanPassport:        ", address(humanPassport));
        console.log("MockUSDC:                 ", address(mockUSDC));
        console.log("");
        console.log("--- Core Identity ---");
        console.log("MedicalProviderRegistry:  ", address(providerRegistry));
        console.log("HealthIdentitySBT:        ", address(healthIdentity));
        console.log("PatientAccountFactory:    ", address(accountFactory));
        console.log("");
        console.log("--- Study System ---");
        console.log("StudyParticipationSBT:    ", address(participationSBT));
        console.log("StudyEnrollmentData:      ", address(enrollmentData));
        console.log("EligibilityCodeVerifier:  ", address(eligibilityVerifier));
        console.log("StudyRegistry:            ", address(studyRegistry));
        console.log("");
        console.log("--- Funding ---");
        console.log("ResearchFundingEscrow:    ", address(researchEscrow));
        console.log("CommitmentVaultFactory:   ", address(vaultFactory));
        console.log("");
        console.log("--- NFT & Scoring ---");
        console.log("StudyAccessNFT:           ", address(studyAccessNFT));
        console.log("ComplianceScore:          ", address(complianceScore));
        console.log("=============================================================");
        console.log("");
        console.log("Total Contracts Deployed: 13");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Run 'pnpm generate' to generate TypeScript ABIs");
        console.log("2. Update nextjs config with new contract addresses");
        console.log("3. Test contract interactions on block explorer");
        console.log("4. Deploy to remaining testnets if needed");
        console.log("=============================================================");
    }

    /**
     * @notice Get network name from chain ID
     */
    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 8453) return "Base";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 10) return "Optimism";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 42220) return "Celo";
        if (chainId == 44787) return "Celo Alfajores";
        if (chainId == 62320) return "Celo Sepolia";
        if (chainId == 31337) return "Localhost";
        return string(abi.encodePacked("Unknown Chain ", vm.toString(chainId)));
    }
}
