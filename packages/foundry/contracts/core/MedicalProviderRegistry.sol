// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MedicalProviderRegistry
 * @author edsphinx
 * @notice Registry of certified medical providers for DASHI (Decentralized Anonymous Sovereign Health Identity)
 * @dev Manages certification, verification, and revocation of medical providers
 *
 * Certification Levels:
 * - Level 1: Individual Practitioners (doctors, nurses with verified licenses)
 * - Level 2: Clinics & Labs (small practices)
 * - Level 3: Hospitals & Research Centers (large institutions)
 * - Level 4: Government Health Authorities (national registries)
 */
contract MedicalProviderRegistry is AccessControl, Pausable, ReentrancyGuard {

    // ============ Roles ============

    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ Structs ============

    /**
     * @dev Represents a certified medical provider
     */
    struct Provider {
        string name;                    // Provider's name or institution name
        string licenseNumber;           // Medical license ID or registration number
        bytes32 licenseHash;            // Hash of license document (for verification)
        uint8 certificationLevel;       // 1-4 (see above)
        uint256 certifiedAt;            // Timestamp when certified
        uint256 expiresAt;              // Expiration timestamp (0 = never expires)
        address certifiedBy;            // Address of certifier who approved
        bool isActive;                  // Can be revoked
        string country;                 // ISO country code (e.g., "US", "MX")
        string[] specializations;       // Medical specialties (e.g., ["cardiology", "oncology"])
    }

    /**
     * @dev Revocation record
     */
    struct Revocation {
        uint256 revokedAt;
        address revokedBy;
        string reason;
    }

    // ============ State Variables ============

    // Provider address => Provider details
    mapping(address => Provider) public providers;

    // Provider address => Revocation details (if revoked)
    mapping(address => Revocation) public revocations;

    // Track total number of providers
    uint256 public totalProviders;

    // Track providers by certification level
    mapping(uint8 => uint256) public providersByLevel;

    // Minimum certification duration (default: 1 year)
    uint256 public minCertificationDuration = 365 days;

    // Maximum certification duration (default: 5 years)
    uint256 public maxCertificationDuration = 5 * 365 days;

    // ============ Events ============

    event ProviderCertified(
        address indexed provider,
        string name,
        uint8 certificationLevel,
        address indexed certifiedBy,
        uint256 expiresAt
    );

    event ProviderRevoked(
        address indexed provider,
        address indexed revokedBy,
        string reason,
        uint256 revokedAt
    );

    event ProviderRenewed(
        address indexed provider,
        uint256 newExpiresAt,
        address indexed renewedBy
    );

    event ProviderUpdated(
        address indexed provider,
        string name,
        uint8 certificationLevel
    );

    event CertifierAdded(address indexed certifier, address indexed addedBy);
    event CertifierRemoved(address indexed certifier, address indexed removedBy);

    // ============ Modifiers ============

    modifier onlyCertifier() {
        require(
            hasRole(CERTIFIER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "MedicalProviderRegistry: caller is not a certifier"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "MedicalProviderRegistry: caller is not an admin"
        );
        _;
    }

    modifier providerExists(address provider) {
        require(
            providers[provider].certifiedAt > 0,
            "MedicalProviderRegistry: provider not found"
        );
        _;
    }

    // ============ Constructor ============

    constructor() {
        // Grant deployer admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(CERTIFIER_ROLE, msg.sender);
    }

    // ============ External Functions ============

    /**
     * @notice Certify a new medical provider
     * @param provider Address of the provider to certify
     * @param name Provider's name or institution name
     * @param licenseNumber Medical license ID
     * @param licenseHash Hash of license document (for off-chain verification)
     * @param certificationLevel Level 1-4 (see contract docs)
     * @param duration Certification duration in seconds
     * @param country ISO country code
     * @param specializations Array of medical specialties
     */
    function certifyProvider(
        address provider,
        string memory name,
        string memory licenseNumber,
        bytes32 licenseHash,
        uint8 certificationLevel,
        uint256 duration,
        string memory country,
        string[] memory specializations
    ) external onlyCertifier whenNotPaused {
        require(provider != address(0), "MedicalProviderRegistry: invalid provider address");
        require(bytes(name).length > 0, "MedicalProviderRegistry: name required");
        require(bytes(licenseNumber).length > 0, "MedicalProviderRegistry: license number required");
        require(certificationLevel >= 1 && certificationLevel <= 4, "MedicalProviderRegistry: invalid level");
        require(
            duration >= minCertificationDuration && duration <= maxCertificationDuration,
            "MedicalProviderRegistry: invalid duration"
        );
        require(
            providers[provider].certifiedAt == 0,
            "MedicalProviderRegistry: provider already certified (use renew or update)"
        );

        uint256 expiresAt = block.timestamp + duration;

        providers[provider] = Provider({
            name: name,
            licenseNumber: licenseNumber,
            licenseHash: licenseHash,
            certificationLevel: certificationLevel,
            certifiedAt: block.timestamp,
            expiresAt: expiresAt,
            certifiedBy: msg.sender,
            isActive: true,
            country: country,
            specializations: specializations
        });

        totalProviders++;
        providersByLevel[certificationLevel]++;

        emit ProviderCertified(
            provider,
            name,
            certificationLevel,
            msg.sender,
            expiresAt
        );
    }

    /**
     * @notice Revoke a provider's certification
     * @param provider Address of the provider to revoke
     * @param reason Reason for revocation
     */
    function revokeProvider(
        address provider,
        string memory reason
    ) external onlyCertifier providerExists(provider) {
        require(providers[provider].isActive, "MedicalProviderRegistry: provider already revoked");
        require(bytes(reason).length > 0, "MedicalProviderRegistry: reason required");

        providers[provider].isActive = false;

        revocations[provider] = Revocation({
            revokedAt: block.timestamp,
            revokedBy: msg.sender,
            reason: reason
        });

        providersByLevel[providers[provider].certificationLevel]--;

        emit ProviderRevoked(provider, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Renew a provider's certification
     * @param provider Address of the provider to renew
     * @param duration New certification duration in seconds
     */
    function renewProvider(
        address provider,
        uint256 duration
    ) external onlyCertifier providerExists(provider) {
        require(providers[provider].isActive, "MedicalProviderRegistry: cannot renew revoked provider");
        require(
            duration >= minCertificationDuration && duration <= maxCertificationDuration,
            "MedicalProviderRegistry: invalid duration"
        );

        uint256 newExpiresAt = block.timestamp + duration;
        providers[provider].expiresAt = newExpiresAt;

        emit ProviderRenewed(provider, newExpiresAt, msg.sender);
    }

    /**
     * @notice Update a provider's information
     * @param provider Address of the provider to update
     * @param name New name (empty string to keep current)
     * @param certificationLevel New level (0 to keep current)
     * @param specializations New specializations (empty array to keep current)
     */
    function updateProvider(
        address provider,
        string memory name,
        uint8 certificationLevel,
        string[] memory specializations
    ) external onlyCertifier providerExists(provider) {
        Provider storage p = providers[provider];

        if (bytes(name).length > 0) {
            p.name = name;
        }

        if (certificationLevel > 0 && certificationLevel <= 4 && certificationLevel != p.certificationLevel) {
            providersByLevel[p.certificationLevel]--;
            p.certificationLevel = certificationLevel;
            providersByLevel[certificationLevel]++;
        }

        if (specializations.length > 0) {
            p.specializations = specializations;
        }

        emit ProviderUpdated(provider, p.name, p.certificationLevel);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a provider is currently active and certified
     * @param provider Address of the provider
     * @return bool True if provider is active and not expired
     */
    function isProviderActive(address provider) external view returns (bool) {
        Provider memory p = providers[provider];

        if (p.certifiedAt == 0) return false;
        if (!p.isActive) return false;
        if (p.expiresAt > 0 && block.timestamp > p.expiresAt) return false;

        return true;
    }

    /**
     * @notice Get full provider details
     * @param provider Address of the provider
     * @return Provider struct
     */
    function getProvider(address provider) external view providerExists(provider) returns (Provider memory) {
        return providers[provider];
    }

    /**
     * @notice Get provider's specializations
     * @param provider Address of the provider
     * @return Array of specialization strings
     */
    function getProviderSpecializations(address provider) external view providerExists(provider) returns (string[] memory) {
        return providers[provider].specializations;
    }

    /**
     * @notice Get revocation details for a provider
     * @param provider Address of the provider
     * @return Revocation struct (returns empty struct if not revoked)
     */
    function getRevocation(address provider) external view returns (Revocation memory) {
        return revocations[provider];
    }

    /**
     * @notice Check if provider can issue DASHI SBTs
     * @dev Provider must be active, not expired, and at least level 1
     * @param provider Address of the provider
     * @return bool True if provider can issue SBTs
     */
    function canIssueHealthIdentity(address provider) external view returns (bool) {
        Provider memory p = providers[provider];

        if (p.certifiedAt == 0) return false;
        if (!p.isActive) return false;
        if (p.expiresAt > 0 && block.timestamp > p.expiresAt) return false;
        if (p.certificationLevel < 1) return false;

        return true;
    }

    /**
     * @notice Get total count of active providers
     * @return uint256 Number of active providers
     */
    function getActiveProvidersCount() external view returns (uint256) {
        // Note: This is an approximation as it doesn't account for expired certifications
        // For exact count, use an off-chain indexer
        uint256 count = 0;
        for (uint8 i = 1; i <= 4; i++) {
            count += providersByLevel[i];
        }
        return count;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a new certifier
     * @param certifier Address to grant certifier role
     */
    function addCertifier(address certifier) external onlyAdmin {
        require(certifier != address(0), "MedicalProviderRegistry: invalid certifier address");
        grantRole(CERTIFIER_ROLE, certifier);
        emit CertifierAdded(certifier, msg.sender);
    }

    /**
     * @notice Remove a certifier
     * @param certifier Address to revoke certifier role
     */
    function removeCertifier(address certifier) external onlyAdmin {
        revokeRole(CERTIFIER_ROLE, certifier);
        emit CertifierRemoved(certifier, msg.sender);
    }

    /**
     * @notice Update minimum certification duration
     * @param duration New minimum duration in seconds
     */
    function setMinCertificationDuration(uint256 duration) external onlyAdmin {
        require(duration > 0, "MedicalProviderRegistry: invalid duration");
        minCertificationDuration = duration;
    }

    /**
     * @notice Update maximum certification duration
     * @param duration New maximum duration in seconds
     */
    function setMaxCertificationDuration(uint256 duration) external onlyAdmin {
        require(duration > minCertificationDuration, "MedicalProviderRegistry: must be > min duration");
        maxCertificationDuration = duration;
    }

    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
}
