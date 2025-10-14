// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IProviderTypes
 * @notice Tipos compartidos para Medical Providers en DASHI
 * @dev Usado por MedicalProviderRegistry, HealthIdentitySBT, ResearchFundingEscrow
 */
interface IProviderTypes {

    /**
     * @notice Niveles de certificación de providers
     */
    enum CertificationLevel {
        None,                   // 0 - No certificado
        Individual,             // 1 - Practicante individual (doctor, enfermera)
        Clinic,                 // 2 - Clínica o laboratorio pequeño
        Hospital,               // 3 - Hospital o centro de investigación
        GovernmentAuthority     // 4 - Autoridad de salud gubernamental
    }

    /**
     * @notice Provider médico certificado
     */
    struct Provider {
        string name;                        // Nombre o institución
        string licenseNumber;               // Número de licencia médica
        bytes32 licenseHash;                // Hash del documento de licencia
        CertificationLevel level;           // Nivel de certificación (1-4)
        uint256 certifiedAt;                // Timestamp de certificación
        uint256 expiresAt;                  // Expiración (0 = nunca expira)
        address certifiedBy;                // Quién lo certificó
        bool isActive;                      // Si está activo
        string country;                     // Código ISO país
        string[] specializations;           // Especialidades médicas
    }

    /**
     * @notice Attestation de dato médico
     * @dev Solo almacena hash + metadata, NO el dato real
     */
    struct Attestation {
        bytes32 dataHash;                   // Hash del dato médico
        address provider;                   // Provider que certificó
        address patient;                    // Paciente dueño del dato
        uint256 timestamp;                  // Cuándo fue certificado
        bool revoked;                       // Si fue revocado
    }

    /**
     * @notice Revocación de provider
     */
    struct Revocation {
        uint256 revokedAt;
        address revokedBy;
        string reason;
    }

    // ============ Events ============

    event ProviderCertified(
        address indexed provider,
        string name,
        CertificationLevel level,
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
        CertificationLevel level
    );
}
