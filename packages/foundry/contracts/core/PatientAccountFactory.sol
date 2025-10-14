// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PatientSmartAccount.sol";

/**
 * @title PatientAccountFactory
 * @author edsphinx
 * @notice Factory for creating DASHI Patient Smart Accounts using CREATE2
 * @dev Allows creating smart accounts with the SAME address across all chains,
 *      as long as the factory is deployed at the same address on each chain.
 *
 * Multi-chain Strategy:
 * - Deploy factory to same address on all EVM chains (via CREATE2 or deterministic deployer)
 * - Use same salt to generate same patient address everywhere
 * - Patient can use their health identity on any supported chain
 */
contract PatientAccountFactory {

    // --- Events ---

    event AccountCreated(
        address indexed account,
        address indexed owner,
        uint256 salt
    );

    event AccountDeployed(
        address indexed account,
        address indexed owner,
        string metadata
    );

    // --- State Variables ---

    // Mapeo: owner → array de cuentas creadas
    mapping(address => address[]) private _accountsByOwner;

    // Mapeo: account address → owner
    mapping(address => address) private _accountOwner;

    // --- Core Functions ---

    /**
     * @notice Crear una Smart Account para un usuario
     * @dev Usa CREATE2 para deterministic address
     * @param owner EOA del paciente que controlará la account
     * @param salt Salt único para CREATE2 (recomendado: usar contador o timestamp)
     * @return account Address de la smart account creada
     */
    function createAccount(
        address owner,
        uint256 salt
    ) external returns (address account) {
        require(owner != address(0), "PatientAccountFactory: owner cannot be zero address");

        // Construir el bytecode del contrato
        bytes memory bytecode = type(PatientSmartAccount).creationCode;
        bytes memory deployCode = abi.encodePacked(
            bytecode,
            abi.encode(owner)
        );

        // Salt final: combina owner + salt proporcionado
        // Esto permite que el mismo owner cree múltiples accounts si quiere
        bytes32 finalSalt = keccak256(abi.encodePacked(owner, salt));

        // Deploy usando CREATE2
        assembly {
            account := create2(
                0,                              // value (ETH a enviar)
                add(deployCode, 0x20),          // código después del length prefix
                mload(deployCode),              // length del código
                finalSalt                       // salt
            )
        }

        require(account != address(0), "PatientAccountFactory: deploy failed");

        // Registrar la cuenta
        _accountsByOwner[owner].push(account);
        _accountOwner[account] = owner;

        emit AccountCreated(account, owner, salt);
        return account;
    }

    /**
     * @notice Crear Smart Account con metadata adicional
     * @dev Útil para registrar DID o info adicional del paciente
     * @param owner EOA del paciente
     * @param salt Salt para CREATE2
     * @param metadata String con info adicional (ej: DID, email hash, etc)
     * @return account Address de la smart account creada
     */
    function createAccountWithMetadata(
        address owner,
        uint256 salt,
        string calldata metadata
    ) external returns (address account) {
        account = this.createAccount(owner, salt);
        emit AccountDeployed(account, owner, metadata);
        return account;
    }

    /**
     * @notice Predecir la dirección de una account ANTES de crearla
     * @dev Crítico para multichain: puedes saber la dirección en todas las chains
     * @param owner EOA del owner
     * @param salt Salt que se usará
     * @return predicted Dirección que tendrá la smart account
     */
    function getAddress(
        address owner,
        uint256 salt
    ) public view returns (address predicted) {
        // Construir el bytecode
        bytes memory bytecode = type(PatientSmartAccount).creationCode;
        bytes memory deployCode = abi.encodePacked(
            bytecode,
            abi.encode(owner)
        );

        // Calcular el salt final
        bytes32 finalSalt = keccak256(abi.encodePacked(owner, salt));

        // Calcular el hash según la fórmula de CREATE2
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),                    // Prefix de CREATE2
                address(this),                   // Address del factory
                finalSalt,                       // Salt usado
                keccak256(deployCode)            // Init code hash
            )
        );

        // Los últimos 20 bytes del hash son la dirección
        return address(uint160(uint256(hash)));
    }

    /**
     * @notice Verificar si una account ya existe en esta chain
     * @param owner Owner de la potential account
     * @param salt Salt usado
     * @return exists True si el contrato ya está deployed
     */
    function accountExists(
        address owner,
        uint256 salt
    ) external view returns (bool exists) {
        address predicted = getAddress(owner, salt);

        // Verificar si hay código en esa dirección
        uint256 size;
        assembly {
            size := extcodesize(predicted)
        }

        return size > 0;
    }

    /**
     * @notice Obtener todas las accounts de un owner
     * @param owner Address del owner
     * @return accounts Array de addresses de smart accounts
     */
    function getAccountsOf(address owner) external view returns (address[] memory accounts) {
        return _accountsByOwner[owner];
    }

    /**
     * @notice Obtener el owner de una smart account
     * @param account Address de la smart account
     * @return owner Address del owner (puede ser address(0) si no fue creada por este factory)
     */
    function getOwnerOf(address account) external view returns (address owner) {
        return _accountOwner[account];
    }

    /**
     * @notice Calcular salt recomendado basado en timestamp
     * @dev Helper function para generar salts únicos
     * @param owner Owner de la account
     * @return salt Salt único basado en block.timestamp
     */
    function generateSalt(address owner) external view returns (uint256 salt) {
        return uint256(keccak256(abi.encodePacked(owner, block.timestamp, block.prevrandao)));
    }

    /**
     * @notice Batch deploy de accounts (para deploy inicial en múltiples chains)
     * @dev Útil para desplegar múltiples accounts a la vez
     * @param owners Array de owners
     * @param salts Array de salts (debe tener mismo length que owners)
     * @return accounts Array de addresses de las accounts creadas
     */
    function batchCreateAccounts(
        address[] calldata owners,
        uint256[] calldata salts
    ) external returns (address[] memory accounts) {
        require(owners.length == salts.length, "PatientAccountFactory: array length mismatch");

        accounts = new address[](owners.length);

        for (uint256 i = 0; i < owners.length; i++) {
            accounts[i] = this.createAccount(owners[i], salts[i]);
        }

        return accounts;
    }

    // --- View/Pure Helpers ---

    /**
     * @notice Verificar si dos factories en diferentes chains generarán la misma dirección
     * @dev Útil para debugging multichain
     * @param factoryAddress Address del factory en otra chain
     * @param owner Owner de la account
     * @param salt Salt a usar
     * @return predicted Dirección que se generaría con ese factory
     */
    function predictAddressOnOtherChain(
        address factoryAddress,
        address owner,
        uint256 salt
    ) external pure returns (address predicted) {
        bytes memory bytecode = type(PatientSmartAccount).creationCode;
        bytes memory deployCode = abi.encodePacked(
            bytecode,
            abi.encode(owner)
        );

        bytes32 finalSalt = keccak256(abi.encodePacked(owner, salt));

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                factoryAddress,              // Factory en la otra chain
                finalSalt,
                keccak256(deployCode)
            )
        );

        return address(uint160(uint256(hash)));
    }
}
