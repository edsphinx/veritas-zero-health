// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/HealthIdentitySBT.sol";
import "../contracts/mocks/MockHumanPassport.sol";

/**
 * @title Deploy Health Identity with Mock Human Passport
 * @notice Deployment script for testing with MockHumanPassport
 * @dev This script deploys both MockHumanPassport and HealthIdentitySBT for local testing
 */
contract DeployHealthIdentityWithMock is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockHumanPassport
        MockHumanPassport mockPassport = new MockHumanPassport();
        console.log("MockHumanPassport deployed at:", address(mockPassport));

        // 2. Deploy HealthIdentitySBT
        HealthIdentitySBT healthIdentity = new HealthIdentitySBT(address(mockPassport));
        console.log("HealthIdentitySBT deployed at:", address(healthIdentity));

        // 3. Setup test data
        setupTestData(mockPassport, healthIdentity, deployer);

        vm.stopBroadcast();

        printSummary(address(mockPassport), address(healthIdentity));
    }

    function setupTestData(
        MockHumanPassport mockPassport,
        HealthIdentitySBT healthIdentity,
        address deployer
    ) internal {
        console.log("\n=== Setting up test data ===");

        // Example test accounts (Hardhat default accounts)
        address testUser1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address testUser2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        address testProvider1 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        address testProvider2 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

        // Issue passports with different stamp combinations

        // Test User 1: High score (Government ID + Biometrics + Phone + ETH Activity)
        MockHumanPassport.StampType[] memory user1Stamps = new MockHumanPassport.StampType[](5);
        user1Stamps[0] = MockHumanPassport.StampType.GOVERNMENT_ID;     // 25 points
        user1Stamps[1] = MockHumanPassport.StampType.BIOMETRICS;        // 20 points
        user1Stamps[2] = MockHumanPassport.StampType.PHONE_VERIFICATION; // 15 points
        user1Stamps[3] = MockHumanPassport.StampType.ETH_ACTIVE_50_DAYS; // 10 points
        user1Stamps[4] = MockHumanPassport.StampType.GITHUB_50_FOLLOWERS; // 8 points
        // Total: 78 points
        mockPassport.issuePassportWithStamps(testUser1, user1Stamps);
        console.log("Test User 1 passport issued (Score: 78)");

        // Test User 2: Medium score (Phone + Social + Web3)
        MockHumanPassport.StampType[] memory user2Stamps = new MockHumanPassport.StampType[](4);
        user2Stamps[0] = MockHumanPassport.StampType.PHONE_VERIFICATION; // 15 points
        user2Stamps[1] = MockHumanPassport.StampType.DISCORD;            // 5 points
        user2Stamps[2] = MockHumanPassport.StampType.GOOGLE;             // 3 points
        user2Stamps[3] = MockHumanPassport.StampType.NFT_HOLDER;         // 5 points
        // Total: 28 points
        mockPassport.issuePassportWithStamps(testUser2, user2Stamps);
        console.log("Test User 2 passport issued (Score: 28)");

        // Certify medical providers
        healthIdentity.certifyProvider(
            testProvider1,
            "Mayo Clinic Laboratory Services",
            "did:web:mayoclinic.org:labs"
        );
        console.log("Provider 1 certified: Mayo Clinic");

        healthIdentity.certifyProvider(
            testProvider2,
            "Johns Hopkins Hospital",
            "did:web:hopkinsmedicine.org:hospital"
        );
        console.log("Provider 2 certified: Johns Hopkins");

        console.log("\n=== Test accounts ready ===");
        console.log("Test User 1:", testUser1, "-> Score: 78 (High)");
        console.log("Test User 2:", testUser2, "-> Score: 28 (Medium)");
        console.log("Provider 1:", testProvider1);
        console.log("Provider 2:", testProvider2);
    }

    function printSummary(address mockPassportAddr, address healthIdentityAddr) internal view {
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("MockHumanPassport:", mockPassportAddr);
        console.log("HealthIdentitySBT:", healthIdentityAddr);
        console.log("\n=== Next Steps ===");
        console.log("1. Create Health Identity SBT for test users:");
        console.log("   cast send", healthIdentityAddr);
        console.log("   'createHealthIdentity(address,string)' <user_address> <nillion_did>");
        console.log("\n2. Attest health data:");
        console.log("   cast send", healthIdentityAddr);
        console.log("   'attestHealthData(address,bytes32)' <patient> <data_hash>");
        console.log("\n3. Query passport scores:");
        console.log("   cast call", mockPassportAddr);
        console.log("   'getPassportScore(address)' <user_address>");
    }
}
