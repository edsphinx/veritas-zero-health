// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/studies/StudyRegistry.sol";

/**
 * @title InitializeStudies
 * @notice Creates 3 test studies on Optimism Sepolia for MVP testing
 * @dev Uses researcher addresses from .env
 */
contract InitializeStudies is Script {

    StudyRegistry public studyRegistry;

    function run() external {
        // Get deployed StudyRegistry address
        address studyRegistryAddress = vm.envAddress("STUDY_REGISTRY_ADDRESS");
        studyRegistry = StudyRegistry(studyRegistryAddress);

        // Get researcher addresses
        address researcher1 = vm.envAddress("RESEARCHER_1_ADDRESS");
        address researcher2 = vm.envAddress("RESEARCHER_2_ADDRESS");

        console.log("\n=============================================================");
        console.log("           Initializing Test Studies on Optimism Sepolia");
        console.log("=============================================================");
        console.log("StudyRegistry:", address(studyRegistry));
        console.log("Researcher 1:", researcher1);
        console.log("Researcher 2:", researcher2);
        console.log("=============================================================\n");

        vm.startBroadcast();

        // Study 1: Diabetes Research (Researcher 1)
        createStudy1(researcher1);

        // Study 2: Hypertension Treatment (Researcher 2)
        createStudy2(researcher2);

        // Study 3: General Health Study (Researcher 1)
        createStudy3(researcher1);

        vm.stopBroadcast();

        console.log("\n=============================================================");
        console.log("           Study Initialization Complete!");
        console.log("=============================================================");
        console.log("3 studies created successfully");
        console.log("Ready for patient applications");
        console.log("=============================================================\n");
    }

    /**
     * @notice Study 1: Type 2 Diabetes Management Study
     * @dev Researcher 1, Ages 35-65, Diabetes diagnosis required
     */
    function createStudy1(address researcher) internal {
        console.log("\n>>> Creating Study 1: Diabetes Research");

        // Publish study
        uint256 studyId = studyRegistry.publishStudy(
            "North America",
            "250 USDC per participant + free medical monitoring",
            "ipfs://QmDiabetesStudyCriteria"
        );

        // Set eligibility criteria
        uint256 eligibilityCodeHash = uint256(keccak256("E11")); // Type 2 Diabetes ICD-10 code
        studyRegistry.setStudyCriteria(
            studyId,
            35, // minAge
            65, // maxAge
            eligibilityCodeHash
        );

        console.log("Study 1 ID:", studyId);
        console.log("Researcher:", researcher);
        console.log("Diagnosis Code: E11 (Type 2 Diabetes)");
        console.log("Age Range: 35-65");
        console.log("Reward: 250 USDC per participant");
    }

    /**
     * @notice Study 2: Hypertension Treatment Study
     * @dev Researcher 2, Ages 40-75, Hypertension diagnosis required
     */
    function createStudy2(address researcher) internal {
        console.log("\n>>> Creating Study 2: Hypertension Treatment");

        // Publish study
        uint256 studyId = studyRegistry.publishStudy(
            "North America",
            "300 USDC per participant + free blood pressure monitoring",
            "ipfs://QmHypertensionStudyCriteria"
        );

        // Set eligibility criteria
        uint256 eligibilityCodeHash = uint256(keccak256("I10")); // Essential Hypertension ICD-10 code
        studyRegistry.setStudyCriteria(
            studyId,
            40, // minAge
            75, // maxAge
            eligibilityCodeHash
        );

        console.log("Study 2 ID:", studyId);
        console.log("Researcher:", researcher);
        console.log("Diagnosis Code: I10 (Essential Hypertension)");
        console.log("Age Range: 40-75");
        console.log("Reward: 300 USDC per participant");
    }

    /**
     * @notice Study 3: General Wellness Study
     * @dev Researcher 1, Ages 21-60, Any diagnosis code
     */
    function createStudy3(address researcher) internal {
        console.log("\n>>> Creating Study 3: General Wellness Study");

        // Publish study
        uint256 studyId = studyRegistry.publishStudy(
            "North America",
            "150 USDC per participant + health monitoring",
            "ipfs://QmWellnessStudyCriteria"
        );

        // Set eligibility criteria
        uint256 eligibilityCodeHash = uint256(keccak256("Z00.00")); // General health examination ICD-10 code
        studyRegistry.setStudyCriteria(
            studyId,
            21, // minAge
            60, // maxAge
            eligibilityCodeHash
        );

        console.log("Study 3 ID:", studyId);
        console.log("Researcher:", researcher);
        console.log("Diagnosis Code: Z00.00 (General examination)");
        console.log("Age Range: 21-60");
        console.log("Reward: 150 USDC per participant");
    }
}
