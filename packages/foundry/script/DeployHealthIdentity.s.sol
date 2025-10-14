// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/HealthIdentitySBT.sol";

/**
 * @title Deploy Health Identity SBT
 * @notice Deploy script para el sistema de identidad de salud
 */
contract DeployHealthIdentity is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address humanPassportAddress = vm.envAddress("HUMAN_PASSPORT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy HealthIdentitySBT
        HealthIdentitySBT healthIdentity = new HealthIdentitySBT(humanPassportAddress);

        console.log("HealthIdentitySBT deployed at:", address(healthIdentity));

        // Setup: Certificar providers de ejemplo (opcional, comentar en producción)
        if (block.chainid == 31337) { // Solo en local/testnet
            healthIdentity.certifyProvider(
                0x70997970C51812dc3A010C7d01b50e0d17dc79C8, // Ejemplo
                "Mayo Clinic Laboratory",
                "did:provider:mayo-clinic"
            );

            healthIdentity.certifyProvider(
                0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, // Ejemplo
                "Johns Hopkins Hospital",
                "did:provider:hopkins"
            );

            console.log("Example providers certified");
        }

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("HealthIdentitySBT:", address(healthIdentity));
        console.log("Human Passport:", humanPassportAddress);
    }
}
