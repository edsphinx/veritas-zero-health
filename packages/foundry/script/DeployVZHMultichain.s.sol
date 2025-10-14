// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {VZHAccountFactory} from "../contracts/VZHAccountFactory.sol";
import {VZHSmartAccount} from "../contracts/VZHSmartAccount.sol";
import {HealthIdentitySBT} from "../contracts/HealthIdentitySBT.sol";
import {MockHumanPassport} from "../contracts/mocks/MockHumanPassport.sol";

/**
 * @title DeployVZHMultichain
 * @notice Script para desplegar VZH Smart Account Factory en múltiples chains
 * @dev Usa CREATE2 para garantizar misma dirección en todas las chains
 *
 * Uso:
 * 1. Deploy en una chain:
 *    forge script script/DeployVZHMultichain.s.sol:DeployVZHMultichain --rpc-url <RPC_URL> --broadcast
 *
 * 2. Predecir dirección antes de deploy:
 *    forge script script/DeployVZHMultichain.s.sol:DeployVZHMultichain --rpc-url <RPC_URL>
 *
 * 3. Deploy en múltiples chains (ejecutar para cada una):
 *    - Sepolia: forge script ... --rpc-url $SEPOLIA_RPC_URL --broadcast
 *    - Polygon: forge script ... --rpc-url $POLYGON_RPC_URL --broadcast
 *    - Arbitrum: forge script ... --rpc-url $ARBITRUM_RPC_URL --broadcast
 *    - Base: forge script ... --rpc-url $BASE_RPC_URL --broadcast
 */
contract DeployVZHMultichain is Script {

    // Salt para CREATE2 - USAR EL MISMO EN TODAS LAS CHAINS
    bytes32 constant FACTORY_SALT = keccak256("VZH_FACTORY_V1");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("====================================");
        console2.log("VZH Multichain Deployment");
        console2.log("====================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Human Passport (solo en testnets)
        address humanPassportAddress;
        if (isTestnet()) {
            console2.log("Deploying MockHumanPassport...");
            MockHumanPassport humanPassport = new MockHumanPassport();
            humanPassportAddress = address(humanPassport);
            console2.log("MockHumanPassport deployed at:", humanPassportAddress);
        } else {
            // En mainnet, usar el contrato real de Human Passport
            humanPassportAddress = getHumanPassportAddress();
            console2.log("Using existing HumanPassport at:", humanPassportAddress);
        }

        console2.log("");

        // 2. Deploy Factory usando CREATE2 para dirección determinística
        console2.log("Deploying VZHAccountFactory with CREATE2...");
        VZHAccountFactory factory = deployFactoryDeterministic(FACTORY_SALT);
        console2.log("VZHAccountFactory deployed at:", address(factory));
        console2.log("");

        // 3. Deploy Health Identity SBT
        console2.log("Deploying HealthIdentitySBT...");
        HealthIdentitySBT healthSBT = new HealthIdentitySBT(humanPassportAddress);
        console2.log("HealthIdentitySBT deployed at:", address(healthSBT));
        console2.log("");

        // 4. Certify deployer as a provider (for testing)
        if (isTestnet()) {
            console2.log("Certifying deployer as test provider...");
            healthSBT.certifyProvider(
                deployer,
                "Test Medical Provider",
                string(abi.encodePacked("did:vzh:provider:", toHexString(deployer)))
            );
            console2.log("Deployer certified as provider");
            console2.log("");
        }

        vm.stopBroadcast();

        // 5. Print deployment summary
        console2.log("====================================");
        console2.log("DEPLOYMENT SUMMARY");
        console2.log("====================================");
        console2.log("Network:", getNetworkName());
        console2.log("Chain ID:", block.chainid);
        console2.log("");
        console2.log("Contracts:");
        console2.log("  VZHAccountFactory:", address(factory));
        console2.log("  HealthIdentitySBT:", address(healthSBT));
        console2.log("  HumanPassport:", humanPassportAddress);
        console2.log("");
        console2.log("IMPORTANT:");
        console2.log("  Save these addresses and deploy Factory with SAME SALT");
        console2.log("  on other chains for identical addresses!");
        console2.log("");

        // 6. Test: Predict a smart account address
        address testOwner = deployer;
        uint256 testSalt = 12345;
        address predictedAccount = factory.getAddress(testOwner, testSalt);
        console2.log("Example Smart Account (not deployed):");
        console2.log("  Owner:", testOwner);
        console2.log("  Salt:", testSalt);
        console2.log("  Predicted Address:", predictedAccount);
        console2.log("  This address will be THE SAME on all chains!");
        console2.log("====================================");
    }

    /**
     * @dev Deploy Factory usando CREATE2 para dirección determinística
     */
    function deployFactoryDeterministic(bytes32 salt) internal returns (VZHAccountFactory) {
        bytes memory bytecode = type(VZHAccountFactory).creationCode;

        address factoryAddress;
        assembly {
            factoryAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(factoryAddress != address(0), "Factory deployment failed");
        return VZHAccountFactory(factoryAddress);
    }

    /**
     * @dev Predecir la dirección del Factory antes de deploy
     */
    function predictFactoryAddress(address deployer, bytes32 salt) public pure returns (address) {
        bytes memory bytecode = type(VZHAccountFactory).creationCode;
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                deployer,
                salt,
                keccak256(bytecode)
            )
        );
        return address(uint160(uint256(hash)));
    }

    /**
     * @dev Check if current chain is a testnet
     */
    function isTestnet() internal view returns (bool) {
        uint256 chainId = block.chainid;
        return chainId == 11155111 || // Sepolia
               chainId == 80001 ||     // Mumbai (Polygon testnet)
               chainId == 421614 ||    // Arbitrum Sepolia
               chainId == 84532 ||     // Base Sepolia
               chainId == 31337;       // Localhost
    }

    /**
     * @dev Get Human Passport address for mainnet chains
     */
    function getHumanPassportAddress() internal view returns (address) {
        uint256 chainId = block.chainid;

        if (chainId == 1) {
            // Ethereum Mainnet
            return address(0); // TODO: Add real Human Passport address
        } else if (chainId == 137) {
            // Polygon Mainnet
            return address(0); // TODO: Add real Human Passport address
        } else if (chainId == 42161) {
            // Arbitrum One
            return address(0); // TODO: Add real Human Passport address
        } else if (chainId == 8453) {
            // Base
            return address(0); // TODO: Add real Human Passport address
        }

        revert("Human Passport address not configured for this chain");
    }

    /**
     * @dev Get network name for logging
     */
    function getNetworkName() internal view returns (string memory) {
        uint256 chainId = block.chainid;

        if (chainId == 1) return "Ethereum Mainnet";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 137) return "Polygon";
        if (chainId == 80001) return "Mumbai";
        if (chainId == 42161) return "Arbitrum One";
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 8453) return "Base";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 31337) return "Localhost";

        return string(abi.encodePacked("Unknown (", vm.toString(chainId), ")"));
    }

    /**
     * @dev Convert address to hex string
     */
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint160(addr) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) % 16);
            buffer[2 * i] = char(hi);
            buffer[2 * i + 1] = char(lo);
        }
        return string(buffer);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
