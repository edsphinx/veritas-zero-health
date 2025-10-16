// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/studies/StudyRegistry.sol";
import "../contracts/studies/StudyParticipationSBT.sol";
import "../contracts/studies/StudyEnrollmentData.sol";
import "../contracts/funding/CommitmentVault.sol";
import "../contracts/funding/CommitmentVaultFactory.sol";

/**
 * @title Deploy Clinical Trials Contracts
 * @notice Deploys contracts for clinical trial management and patient participation
 * @dev Multi-network compatible
 */
contract DeployStudies is Script {

    // Deployed contracts
    StudyRegistry public studyRegistry;
    StudyParticipationSBT public participationSBT;
    StudyEnrollmentData public enrollmentData;
    CommitmentVaultFactory public vaultFactory;

    /**
     * @notice Main deployment function
     * @param eligibilityVerifierAddress Address of EligibilityCodeVerifier (Groth16 from DeployZK)
     * @return _studyRegistry Address of StudyRegistry
     * @return _participationSBT Address of StudyParticipationSBT
     * @return _enrollmentData Address of StudyEnrollmentData
     * @return _vaultFactory Address of CommitmentVaultFactory
     */
    function run(
        address eligibilityVerifierAddress
    ) external returns (
        address _studyRegistry,
        address _participationSBT,
        address _enrollmentData,
        address _vaultFactory
    ) {
        require(eligibilityVerifierAddress != address(0), "EligibilityVerifier address required");

        address deployer;

        if (block.chainid == 31337) {
            deployer = msg.sender;
            vm.startBroadcast();
        } else {
            uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
            deployer = vm.addr(deployerPrivateKey);
            vm.startBroadcast(deployerPrivateKey);
        }

        // ============ 1. Deploy StudyRegistry ============
        console.log("\n=== Step 1: Deploying StudyRegistry ===");
        studyRegistry = new StudyRegistry(eligibilityVerifierAddress);
        console.log("StudyRegistry:", address(studyRegistry));

        // ============ 2. Deploy StudyParticipationSBT ============
        console.log("\n=== Step 2: Deploying StudyParticipationSBT ===");
        participationSBT = new StudyParticipationSBT();
        console.log("StudyParticipationSBT:", address(participationSBT));

        // ============ 3. Deploy StudyEnrollmentData ============
        console.log("\n=== Step 3: Deploying StudyEnrollmentData ===");
        enrollmentData = new StudyEnrollmentData(address(participationSBT), deployer);
        console.log("StudyEnrollmentData:", address(enrollmentData));

        // ============ 4. Set EnrollmentDataContract in StudyParticipationSBT ============
        console.log("\n=== Step 4: Setting EnrollmentDataContract ===");
        participationSBT.setEnrollmentDataContract(address(enrollmentData));
        console.log("EnrollmentDataContract set in StudyParticipationSBT");

        // ============ 5. Deploy CommitmentVaultFactory ============
        console.log("\n=== Step 5: Deploying CommitmentVaultFactory ===");
        vaultFactory = new CommitmentVaultFactory(address(enrollmentData));
        console.log("CommitmentVaultFactory:", address(vaultFactory));

        // ============ 5. Setup Example Studies ============
        if (block.chainid == 31337 || block.chainid == 11155111) {
            console.log("\n=== Step 5: Creating Example Studies ===");
            createExampleStudies();
        }

        vm.stopBroadcast();

        // ============ 6. Print Summary ============
        printDeploymentSummary();

        return (
            address(studyRegistry),
            address(participationSBT),
            address(enrollmentData),
            address(vaultFactory)
        );
    }

    /**
     * @notice Create example clinical trials for testing
     */
    function createExampleStudies() internal {
        // Study 1: Diabetes Study
        studyRegistry.publishStudy(
            "North America",
            "0.5 ETH per milestone",
            "ipfs://QmDiabetesStudyCriteria"
        );
        console.log("Created: Diabetes Study (ID: 1)");

        // Study 2: Heart Disease Study
        studyRegistry.publishStudy(
            "Europe",
            "0.3 ETH per milestone",
            "ipfs://QmHeartDiseaseStudyCriteria"
        );
        console.log("Created: Heart Disease Study (ID: 2)");

        // Study 3: Cancer Research
        studyRegistry.publishStudy(
            "Asia",
            "1.0 ETH per milestone",
            "ipfs://QmCancerResearchCriteria"
        );
        console.log("Created: Cancer Research Study (ID: 3)");
    }

    /**
     * @notice Print deployment summary
     */
    function printDeploymentSummary() internal view {
        console.log("\n");
        console.log("=============================================================");
        console.log("      DASHI Clinical Trials - Deployment Summary");
        console.log("=============================================================");
        console.log("Network:", getNetworkName(block.chainid));
        console.log("Chain ID:", block.chainid);
        console.log("-------------------------------------------------------------");
        console.log("StudyRegistry:              ", address(studyRegistry));
        console.log("StudyParticipationSBT:      ", address(participationSBT));
        console.log("StudyEnrollmentData:        ", address(enrollmentData));
        console.log("CommitmentVaultFactory:     ", address(vaultFactory));
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
