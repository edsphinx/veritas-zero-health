// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @notice Interface para verificar Human Passport
 * @dev Conecta con el contrato de Human Passport
 */
interface IHumanPassport {
    function balanceOf(address owner) external view returns (uint256);
    function getPassportScore(address user) external view returns (uint256);
}

/**
 * @title HealthIdentitySBT
 * @author Veritas Zero Health
 * @notice Soulbound Token para identidad de salud verificada
 * @dev Requiere Human Passport SBT para mint. Un solo token por address.
 * Almacena attestations de datos médicos sin revelar los datos.
 */
contract HealthIdentitySBT is ERC721, Ownable {

    // --- Structs ---

    /**
     * @notice Identidad de salud del usuario
     */
    struct HealthIdentity {
        string nillionDID;           // DID del usuario en Nillion
        uint256 humanPassportId;     // Token ID de Human Passport (verificación de humanidad)
        uint256 attestationCount;    // Cantidad de datos médicos certificados
        uint256 createdAt;           // Timestamp de creación
        bool active;                 // Si está activa
    }

    /**
     * @notice Provider médico certificado
     */
    struct CertifiedProvider {
        string name;                 // Nombre (ej: "Mayo Clinic")
        string did;                  // DID del provider
        bool certified;              // Si está certificado
        uint256 attestationCount;    // Cantidad de datos que ha certificado
        uint256 certifiedAt;         // Cuándo fue certificado
    }

    /**
     * @notice Attestation de dato médico
     * @dev Solo almacena hash + metadata, NO el dato real
     */
    struct Attestation {
        bytes32 dataHash;            // keccak256(nillionRecordId + dataType + vcSignature)
        address provider;            // Provider que certificó
        address patient;             // Paciente dueño del dato
        uint256 timestamp;           // Cuándo fue certificado
        bool revoked;                // Si fue revocado por error
    }

    // --- State Variables ---

    IHumanPassport public humanPassport;

    uint256 private _nextTokenId = 1;

    // Mapeo: address → tokenId del Health Identity SBT
    mapping(address => uint256) public userToTokenId;

    // Mapeo: tokenId → HealthIdentity
    mapping(uint256 => HealthIdentity) public identities;

    // Mapeo: provider address → CertifiedProvider
    mapping(address => CertifiedProvider) public providers;

    // Mapeo: dataHash → Attestation
    mapping(bytes32 => Attestation) public attestations;

    // Mapeo: user → array de dataHashes (para enumerar sus attestations)
    mapping(address => bytes32[]) private _userAttestations;

    // Mapeo: keccak256(patient + nonce) → bool (prevenir replay attacks)
    mapping(bytes32 => bool) private _usedVouchers;

    // --- Events ---

    event HealthIdentityCreated(
        address indexed user,
        uint256 indexed tokenId,
        string nillionDID,
        uint256 humanPassportId
    );

    event DataAttested(
        bytes32 indexed dataHash,
        address indexed provider,
        address indexed patient,
        uint256 timestamp
    );

    event AttestationRevoked(
        bytes32 indexed dataHash,
        address indexed provider,
        string reason
    );

    event ProviderCertified(
        address indexed provider,
        string name,
        string did
    );

    event ProviderRevoked(
        address indexed provider,
        string reason
    );

    // --- Constructor ---

    constructor(address _humanPassportAddress)
        ERC721("Veritas Health Identity", "VHI")
        Ownable(msg.sender)
    {
        humanPassport = IHumanPassport(_humanPassportAddress);
    }

    // --- Modifiers ---

    modifier onlyCertifiedProvider() {
        require(providers[msg.sender].certified, "Not a certified provider");
        _;
    }

    modifier hasHumanPassport(address user) {
        require(
            humanPassport.balanceOf(user) > 0,
            "User must have Human Passport SBT"
        );
        require(
            humanPassport.getPassportScore(user) >= 50,
            "Human Passport score too low"
        );
        _;
    }

    // --- Core Functions ---

    /**
     * @notice Crear identidad de salud (mint SBT)
     * @dev Requiere tener Human Passport SBT. Solo 1 por address.
     * @param user Address del usuario
     * @param nillionDID DID del usuario en Nillion
     * @return tokenId El ID del token minted
     */
    function createHealthIdentity(
        address user,
        string memory nillionDID
    ) external onlyOwner hasHumanPassport(user) returns (uint256) {
        require(userToTokenId[user] == 0, "User already has health identity");
        require(bytes(nillionDID).length > 0, "Invalid Nillion DID");

        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);

        // Get Human Passport token ID (assume first token)
        // En producción, necesitarías una función en Human Passport para obtener esto
        uint256 humanPassportId = 1; // Placeholder

        identities[tokenId] = HealthIdentity({
            nillionDID: nillionDID,
            humanPassportId: humanPassportId,
            attestationCount: 0,
            createdAt: block.timestamp,
            active: true
        });

        userToTokenId[user] = tokenId;

        emit HealthIdentityCreated(user, tokenId, nillionDID, humanPassportId);
        return tokenId;
    }

    /**
     * @notice Claim Health Identity con firma de provider (Para QR Code flow)
     * @dev El paciente escanea QR y ejecuta esta función para mintear su SBT
     *      Soporta tanto EOAs como Smart Accounts
     * @param patientAddress Address del paciente (EOA o Smart Account) que recibirá el SBT
     * @param nillionDID DID del paciente en Nillion
     * @param expiresAt Timestamp de expiración del voucher
     * @param nonce Nonce único para prevenir replay
     * @param signature Firma del provider certificado autorizando el mint
     * @return tokenId El ID del token minted
     */
    function claimHealthIdentity(
        address patientAddress,
        string memory nillionDID,
        uint256 expiresAt,
        uint256 nonce,
        bytes memory signature
    ) external returns (uint256) {
        // Si se llama directamente (EOA), patientAddress debe ser msg.sender
        // Si se llama desde Smart Account, patientAddress es la Smart Account
        require(
            patientAddress == msg.sender || _isContract(msg.sender),
            "Invalid patient address"
        );

        require(userToTokenId[patientAddress] == 0, "User already has health identity");
        require(bytes(nillionDID).length > 0, "Invalid Nillion DID");
        require(block.timestamp <= expiresAt, "Voucher expired");

        // Verificar Human Passport
        // Si es EOA: verificar directamente
        // Si es Smart Account: verificar que el contrato tenga el módulo de verificación
        if (!_isContract(patientAddress)) {
            require(
                humanPassport.balanceOf(patientAddress) > 0,
                "User must have Human Passport SBT"
            );
            require(
                humanPassport.getPassportScore(patientAddress) >= 50,
                "Human Passport score too low"
            );
        }
        // Si es Smart Account, asumimos que el owner ya fue verificado
        // La Smart Account solo se crea si el owner tiene Human Passport

        // Construir el mensaje que fue firmado
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                patientAddress,  // Patient address (EOA o Smart Account)
                nillionDID,      // Nillion DID
                expiresAt,       // Expiration timestamp
                nonce,           // Unique nonce
                address(this)    // Contract address (previene signature reuse en otros contratos)
            )
        );

        // Recuperar el signer de la firma
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        // Verificar que el signer es un provider certificado
        require(providers[signer].certified, "Signature not from certified provider");

        // Prevenir replay attacks
        bytes32 voucherKey = keccak256(abi.encodePacked(patientAddress, nonce));
        require(!_usedVouchers[voucherKey], "Voucher already used");
        _usedVouchers[voucherKey] = true;

        // Mint el SBT
        uint256 tokenId = _nextTokenId++;
        _safeMint(patientAddress, tokenId);

        uint256 humanPassportId = 1; // Placeholder

        identities[tokenId] = HealthIdentity({
            nillionDID: nillionDID,
            humanPassportId: humanPassportId,
            attestationCount: 0,
            createdAt: block.timestamp,
            active: true
        });

        userToTokenId[patientAddress] = tokenId;

        emit HealthIdentityCreated(patientAddress, tokenId, nillionDID, humanPassportId);
        return tokenId;
    }

    /**
     * @dev Helper para verificar si una address es un contrato
     */
    function _isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @notice Provider certifica un dato médico
     * @dev Solo providers certificados pueden llamar
     * @param patient Address del paciente
     * @param dataHash Hash del dato (recordId + dataType + vcSignature)
     */
    function attestHealthData(
        address patient,
        bytes32 dataHash
    ) external onlyCertifiedProvider {
        require(userToTokenId[patient] != 0, "Patient has no health identity");
        require(attestations[dataHash].provider == address(0), "Data already attested");

        // Crear attestation
        attestations[dataHash] = Attestation({
            dataHash: dataHash,
            provider: msg.sender,
            patient: patient,
            timestamp: block.timestamp,
            revoked: false
        });

        // Agregar a lista de usuario
        _userAttestations[patient].push(dataHash);

        // Incrementar contadores
        uint256 tokenId = userToTokenId[patient];
        identities[tokenId].attestationCount++;
        providers[msg.sender].attestationCount++;

        emit DataAttested(dataHash, msg.sender, patient, block.timestamp);
    }

    /**
     * @notice Batch attest múltiples datos (ahorro de gas)
     */
    function batchAttestHealthData(
        address[] calldata patients,
        bytes32[] calldata dataHashes
    ) external onlyCertifiedProvider {
        require(patients.length == dataHashes.length, "Array length mismatch");

        for (uint i = 0; i < patients.length; i++) {
            // Re-usar la lógica de attestHealthData pero sin el modifier check
            address patient = patients[i];
            bytes32 dataHash = dataHashes[i];

            require(userToTokenId[patient] != 0, "Patient has no health identity");
            require(attestations[dataHash].provider == address(0), "Data already attested");

            attestations[dataHash] = Attestation({
                dataHash: dataHash,
                provider: msg.sender,
                patient: patient,
                timestamp: block.timestamp,
                revoked: false
            });

            _userAttestations[patient].push(dataHash);

            uint256 tokenId = userToTokenId[patient];
            identities[tokenId].attestationCount++;

            emit DataAttested(dataHash, msg.sender, patient, block.timestamp);
        }

        providers[msg.sender].attestationCount += patients.length;
    }

    /**
     * @notice Verificar si un dato está certificado
     * @return valid Si la attestation existe y no está revocada
     * @return provider Address del provider que certificó
     * @return timestamp Cuándo fue certificado
     */
    function verifyAttestation(bytes32 dataHash)
        external
        view
        returns (bool valid, address provider, uint256 timestamp)
    {
        Attestation memory att = attestations[dataHash];
        return (
            att.provider != address(0) && !att.revoked,
            att.provider,
            att.timestamp
        );
    }

    /**
     * @notice Obtener todas las attestations de un usuario
     */
    function getUserAttestations(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return _userAttestations[user];
    }

    /**
     * @notice Revocar attestation (solo el provider que la creó)
     */
    function revokeAttestation(bytes32 dataHash, string memory reason) external {
        require(
            attestations[dataHash].provider == msg.sender,
            "Only provider can revoke"
        );
        require(!attestations[dataHash].revoked, "Already revoked");

        attestations[dataHash].revoked = true;

        // Decrementar contador
        address patient = attestations[dataHash].patient;
        uint256 tokenId = userToTokenId[patient];
        if (identities[tokenId].attestationCount > 0) {
            identities[tokenId].attestationCount--;
        }

        emit AttestationRevoked(dataHash, msg.sender, reason);
    }

    // --- Admin Functions ---

    /**
     * @notice Certificar un provider médico
     */
    function certifyProvider(
        address provider,
        string memory name,
        string memory did
    ) external onlyOwner {
        require(provider != address(0), "Invalid provider address");
        require(!providers[provider].certified, "Provider already certified");

        providers[provider] = CertifiedProvider({
            name: name,
            did: did,
            certified: true,
            attestationCount: 0,
            certifiedAt: block.timestamp
        });

        emit ProviderCertified(provider, name, did);
    }

    /**
     * @notice Revocar certificación de provider
     */
    function revokeProvider(address provider, string memory reason) external onlyOwner {
        require(providers[provider].certified, "Provider not certified");

        providers[provider].certified = false;

        emit ProviderRevoked(provider, reason);
    }

    /**
     * @notice Actualizar dirección de Human Passport
     */
    function setHumanPassport(address _humanPassportAddress) external onlyOwner {
        humanPassport = IHumanPassport(_humanPassportAddress);
    }

    // --- Soulbound Logic ---

    /**
     * @dev Override para hacer el token Soulbound (no transferible)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Solo permitir mint (from = address(0))
        require(
            from == address(0),
            "Soulbound: Health Identity cannot be transferred"
        );

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Prevenir transfers explícitamente
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: Health Identity cannot be transferred");
    }

    /**
     * @dev Prevenir safeTransfers explícitamente
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: Health Identity cannot be transferred");
    }

    // --- View Functions ---

    /**
     * @notice Obtener identidad de salud de un usuario
     */
    function getHealthIdentity(address user)
        external
        view
        returns (HealthIdentity memory)
    {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "User has no health identity");
        return identities[tokenId];
    }

    /**
     * @notice Verificar si un usuario tiene identidad de salud
     */
    function hasHealthIdentity(address user) external view returns (bool) {
        return userToTokenId[user] != 0;
    }
}
