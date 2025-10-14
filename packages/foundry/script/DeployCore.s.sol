// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/HealthIdentitySBT.sol";
import "../contracts/VZHAccountFactory.sol";
import "../contracts/MedicalProviderRegistry.sol";
import "../contracts/ResearchFundingEscrow.sol";
import "../contracts/mocks/MockHumanPassport.sol";

/**
 * @title Deploy Core Contracts
 * @notice Deploys core DASHI infrastructure (Identity, Providers, Accounts, Escrow)
 * @dev Multi-network: Works on localhost (with mock) and live networks (with real Human Passport)
 */
contract DeployCore is Script {

    // Deployed contracts
    MedicalProviderRegistry public providerRegistry;
    HealthIdentitySBT public healthIdentity;
    VZHAccountFactory public accountFactory;
    ResearchFundingEscrow public researchEscrow;
    address public humanPassportAddress;

    /**
     * @notice Main deployment function
     * @return _humanPassport Address of Human Passport (or mock)
     * @return _providerRegistry Address of MedicalProviderRegistry
     * @return _healthIdentity Address of HealthIdentitySBT
     * @return _accountFactory Address of VZHAccountFactory
     * @return _researchEscrow Address of ResearchFundingEscrow
     */
    function run() external returns (
        address _humanPassport,
        address _providerRegistry,
        address _healthIdentity,
        address _accountFactory,
        address _researchEscrow
    ) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // ============ 1. Deploy/Get Human Passport ============
        console.log("\n=== Step 1: Human Passport Setup ===");
        humanPassportAddress = getOrDeployHumanPassport();
        console.log("Human Passport address:", humanPassportAddress);

        // ============ 2. Deploy MedicalProviderRegistry ============
        console.log("\n=== Step 2: Deploying MedicalProviderRegistry ===");
        providerRegistry = new MedicalProviderRegistry();
        console.log("MedicalProviderRegistry:", address(providerRegistry));

        // ============ 3. Deploy HealthIdentitySBT ============
        console.log("\n=== Step 3: Deploying HealthIdentitySBT ===");
        require(humanPassportAddress != address(0), "Human Passport required");
        healthIdentity = new HealthIdentitySBT(humanPassportAddress);
        console.log("HealthIdentitySBT:", address(healthIdentity));

        // ============ 4. Deploy VZHAccountFactory ============
        console.log("\n=== Step 4: Deploying VZHAccountFactory ===");
        accountFactory = new VZHAccountFactory();
        console.log("VZHAccountFactory:", address(accountFactory));

        // ============ 5. Deploy ResearchFundingEscrow ============
        console.log("\n=== Step 5: Deploying ResearchFundingEscrow ===");
        researchEscrow = new ResearchFundingEscrow(address(providerRegistry));
        console.log("ResearchFundingEscrow:", address(researchEscrow));

        // ============ 6. Initial Configuration ============
        console.log("\n=== Step 6: Initial Configuration ===");

        // Setup example providers on local/testnet
        if (block.chainid == 31337 || block.chainid == 11155111) {
            setupExampleProviders();
        }

        vm.stopBroadcast();

        // ============ 7. Print Summary ============
        printDeploymentSummary();

        return (
            humanPassportAddress,
            address(providerRegistry),
            address(healthIdentity),
            address(accountFactory),
            address(researchEscrow)
        );
    }

    /**
     * @notice Get Human Passport address based on network
     * @dev Localhost: Deploy mock | Other networks: Use env variable
     */
    function getOrDeployHumanPassport() internal returns (address) {
        if (block.chainid == 31337) {
            // Localhost: Deploy mock
            console.log("Deploying MockHumanPassport (localhost)");
            MockHumanPassport mockPassport = new MockHumanPassport();
            return address(mockPassport);
        } else {
            // Live networks: Use real address from .env
            try vm.envAddress("HUMAN_PASSPORT_ADDRESS") returns (address addr) {
                require(addr != address(0), "Invalid HUMAN_PASSPORT_ADDRESS");
                console.log("Using Human Passport from .env");
                return addr;
            } catch {
                revert("HUMAN_PASSPORT_ADDRESS required for live networks. Add to .env file.");
            }
        }
    }

    /**
     * @notice Setup example providers for testing
     * @dev Only runs on localhost and Sepolia
     */
    function setupExampleProviders() internal {
        console.log("Setting up example providers...");

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
            keccak256("mayo-clinic-license"),
            3, // Hospital level
            365 days,
            "US",
            specializations1
        );
        console.log("Certified: Mayo Clinic");

        // Provider 2: Johns Hopkins (Level 3)
        address provider2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        string[] memory specializations2 = new string[](2);
        specializations2[0] = "research";
        specializations2[1] = "oncology";

        providerRegistry.certifyProvider(
            provider2,
            "Johns Hopkins Hospital",
            "US-MED-2024-002",
            keccak256("hopkins-license"),
            3,
            365 days,
            "US",
            specializations2
        );
        console.log("Certified: Johns Hopkins");

        // Grant verifier roles
        researchEscrow.addVerifier(provider1);
        researchEscrow.addVerifier(provider2);
        console.log("Granted verifier roles");
    }

    /**
     * @notice Print deployment summary
     */
    function printDeploymentSummary() internal view {
        console.log("\n");
        console.log("=============================================================");
        console.log("         DASHI Core Contracts - Deployment Summary");
        console.log("=============================================================");
        console.log("Network:", getNetworkName(block.chainid));
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("-------------------------------------------------------------");
        console.log("Human Passport:             ", humanPassportAddress);
        console.log("MedicalProviderRegistry:    ", address(providerRegistry));
        console.log("HealthIdentitySBT:          ", address(healthIdentity));
        console.log("VZHAccountFactory:          ", address(accountFactory));
        console.log("ResearchFundingEscrow:      ", address(researchEscrow));
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
        if (chainId == 42220) return "Celo";
        if (chainId == 44787) return "Celo Alfajores";
        if (chainId == 31337) return "Localhost";
        return "Unknown";
    }
}
