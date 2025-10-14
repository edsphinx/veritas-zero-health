// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HealthIdentitySBT.sol";

/**
 * @title PatientSmartAccount
 * @author edsphinx
 * @notice Simple Smart Account for DASHI patients
 * @dev Contract-based wallet that enables:
 *      - Same address across all chains (via CREATE2)
 *      - Social recovery mechanism
 *      - Direct claim of Health Identity SBT
 *      - Execute arbitrary transactions
 *      - Multi-chain identity portability
 */
contract PatientSmartAccount {

    // --- State Variables ---

    address public owner;
    address public recoveryAddress;

    uint256 public nonce; // Para replay protection

    // Mapeo: hash de transacción ejecutada → bool
    mapping(bytes32 => bool) private _executedTxs;

    // --- Events ---

    event Executed(
        address indexed target,
        uint256 value,
        bytes data,
        uint256 nonce
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event RecoveryAddressSet(
        address indexed recoveryAddress
    );

    event HealthIdentityClaimed(
        address indexed sbtContract,
        uint256 tokenId
    );

    event FundsReceived(
        address indexed from,
        uint256 amount
    );

    // --- Modifiers ---

    modifier onlyOwner() {
        require(msg.sender == owner, "PatientSmartAccount: caller is not the owner");
        _;
    }

    modifier onlyOwnerOrRecovery() {
        require(
            msg.sender == owner || msg.sender == recoveryAddress,
            "PatientSmartAccount: caller is not authorized"
        );
        _;
    }

    // --- Constructor ---

    /**
     * @notice Inicializar la smart account
     * @param _owner EOA del paciente que controla esta wallet
     */
    constructor(address _owner) {
        require(_owner != address(0), "PatientSmartAccount: owner cannot be zero address");
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    // --- Core Functions ---

    /**
     * @notice Ejecutar transacción arbitraria
     * @dev Solo el owner puede ejecutar
     * @param target Contrato a llamar
     * @param value ETH a enviar (si aplica)
     * @param data Calldata de la función
     * @return result Resultado de la llamada
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory result) {
        require(target != address(0), "PatientSmartAccount: target cannot be zero address");

        // Prevenir replay usando nonce
        bytes32 txHash = keccak256(abi.encodePacked(target, value, data, nonce));
        require(!_executedTxs[txHash], "PatientSmartAccount: transaction already executed");
        _executedTxs[txHash] = true;

        // Ejecutar la transacción
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        require(success, "PatientSmartAccount: transaction failed");

        emit Executed(target, value, data, nonce);
        nonce++;

        return returnData;
    }

    /**
     * @notice Batch de múltiples transacciones
     * @dev Ejecuta múltiples calls en una sola transacción
     * @param targets Array de contratos a llamar
     * @param values Array de valores ETH
     * @param datas Array de calldatas
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwner {
        require(
            targets.length == values.length && values.length == datas.length,
            "PatientSmartAccount: array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            require(targets[i] != address(0), "PatientSmartAccount: target cannot be zero address");

            (bool success, ) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "PatientSmartAccount: batch transaction failed");

            emit Executed(targets[i], values[i], datas[i], nonce + i);
        }

        nonce += targets.length;
    }

    /**
     * @notice Claim Health Identity SBT (wrapper conveniente)
     * @dev Llama a HealthIdentitySBT.claimHealthIdentity()
     *      El SBT se minted a ESTA smart account (address(this))
     * @param sbtContract Address del contrato HealthIdentitySBT
     * @param nillionDID DID del paciente en Nillion
     * @param expiresAt Timestamp de expiración del voucher
     * @param voucherNonce Nonce del voucher firmado por el provider
     * @param signature Firma del provider certificado
     * @return tokenId El ID del SBT minted
     */
    function claimHealthIdentitySBT(
        address sbtContract,
        string calldata nillionDID,
        uint256 expiresAt,
        uint256 voucherNonce,
        bytes calldata signature
    ) external onlyOwner returns (uint256 tokenId) {
        require(sbtContract != address(0), "PatientSmartAccount: SBT contract cannot be zero address");

        // Llamar a la función de claim del SBT
        // El SBT será minted a address(this) - esta smart account
        tokenId = HealthIdentitySBT(sbtContract).claimHealthIdentity(
            address(this),  // patientAddress = esta smart account
            nillionDID,
            expiresAt,
            voucherNonce,
            signature
        );

        emit HealthIdentityClaimed(sbtContract, tokenId);
        return tokenId;
    }

    /**
     * @notice Verificar si esta account tiene Health Identity SBT
     * @param sbtContract Address del contrato HealthIdentitySBT
     * @return hasIdentity True si tiene SBT
     */
    function hasHealthIdentity(address sbtContract) external view returns (bool hasIdentity) {
        return HealthIdentitySBT(sbtContract).hasHealthIdentity(address(this));
    }

    /**
     * @notice Obtener Health Identity de esta account
     * @param sbtContract Address del contrato HealthIdentitySBT
     * @return identity Struct con los datos del Health Identity
     */
    function getHealthIdentity(address sbtContract)
        external
        view
        returns (HealthIdentitySBT.HealthIdentity memory identity)
    {
        return HealthIdentitySBT(sbtContract).getHealthIdentity(address(this));
    }

    // --- Recovery Functions ---

    /**
     * @notice Configurar dirección de recovery
     * @dev Solo el owner puede establecer recovery
     * @param _recoveryAddress Address que puede recuperar la cuenta
     */
    function setRecoveryAddress(address _recoveryAddress) external onlyOwner {
        require(_recoveryAddress != address(0), "PatientSmartAccount: recovery address cannot be zero");
        require(_recoveryAddress != owner, "PatientSmartAccount: recovery cannot be owner");

        recoveryAddress = _recoveryAddress;
        emit RecoveryAddressSet(_recoveryAddress);
    }

    /**
     * @notice Transferir ownership (para recovery o cambio de EOA)
     * @dev Solo owner o recovery address pueden ejecutar
     * @param newOwner Nueva address owner
     */
    function transferOwnership(address newOwner) external onlyOwnerOrRecovery {
        require(newOwner != address(0), "PatientSmartAccount: new owner cannot be zero address");
        require(newOwner != owner, "PatientSmartAccount: new owner is same as current");

        address oldOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // --- Receive Functions ---

    /**
     * @notice Recibir ETH
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @notice Fallback para recibir ETH
     */
    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    // --- View Functions ---

    /**
     * @notice Obtener balance de ETH de la account
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Verificar si una transacción ya fue ejecutada
     * @param target Contrato target
     * @param value Valor ETH
     * @param data Calldata
     * @param txNonce Nonce de la transacción
     */
    function isExecuted(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 txNonce
    ) external view returns (bool) {
        bytes32 txHash = keccak256(abi.encodePacked(target, value, data, txNonce));
        return _executedTxs[txHash];
    }
}
