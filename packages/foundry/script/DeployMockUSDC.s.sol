// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/mocks/MockUSDC.sol";

/**
 * @title DeployMockUSDC
 * @notice Deploys Mock USDC and funds test accounts for MVP
 * @dev Funds sponsors and researchers with test USDC on Optimism Sepolia
 */
contract DeployMockUSDC is Script {

    MockUSDC public mockUSDC;

    function run() external {
        console.log("\n=============================================================");
        console.log("           Deploying Mock USDC on Optimism Sepolia");
        console.log("=============================================================\n");

        vm.startBroadcast();

        // 1. Deploy MockUSDC
        console.log(">>> Deploying MockUSDC...");
        mockUSDC = new MockUSDC();
        console.log("MockUSDC deployed at:", address(mockUSDC));
        console.log("Initial supply (deployer):", mockUSDC.balanceOf(msg.sender) / 1e6, "USDC");

        // 2. Fund test accounts
        console.log("\n>>> Funding test accounts...");
        fundTestAccounts();

        vm.stopBroadcast();

        console.log("\n=============================================================");
        console.log("           Mock USDC Deployment Complete!");
        console.log("=============================================================");
        console.log("MockUSDC Address:", address(mockUSDC));
        console.log("Total Distributed: 120,000 USDC");
        console.log("Ready for study funding!");
        console.log("=============================================================\n");
    }

    /**
     * @notice Fund all test accounts according to plan
     * @dev Uses batchMint for efficiency
     *
     * Distribution:
     * - SPONSOR_1: 50,000 USDC
     * - SPONSOR_2: 50,000 USDC
     * - RESEARCHER_1: 10,000 USDC
     * - RESEARCHER_2: 10,000 USDC
     * Total: 120,000 USDC
     */
    function fundTestAccounts() internal {
        // Get addresses from .env
        address sponsor1 = vm.envAddress("SPONSOR_1_ADDRESS");
        address sponsor2 = vm.envAddress("SPONSOR_2_ADDRESS");
        address researcher1 = vm.envAddress("RESEARCHER_1_ADDRESS");
        address researcher2 = vm.envAddress("RESEARCHER_2_ADDRESS");

        // Prepare batch mint arrays
        address[] memory recipients = new address[](4);
        uint256[] memory amounts = new uint256[](4);

        recipients[0] = sponsor1;
        amounts[0] = 50_000 * 1e6; // 50,000 USDC

        recipients[1] = sponsor2;
        amounts[1] = 50_000 * 1e6; // 50,000 USDC

        recipients[2] = researcher1;
        amounts[2] = 10_000 * 1e6; // 10,000 USDC

        recipients[3] = researcher2;
        amounts[3] = 10_000 * 1e6; // 10,000 USDC

        // Batch mint
        mockUSDC.batchMint(recipients, amounts);

        // Log distribution
        console.log("\nFunding Distribution:");
        console.log("- Sponsor 1:", sponsor1, "-> 50,000 USDC");
        console.log("- Sponsor 2:", sponsor2, "-> 50,000 USDC");
        console.log("- Researcher 1:", researcher1, "-> 10,000 USDC");
        console.log("- Researcher 2:", researcher2, "-> 10,000 USDC");
        console.log("\nTotal distributed: 120,000 USDC");
    }
}
