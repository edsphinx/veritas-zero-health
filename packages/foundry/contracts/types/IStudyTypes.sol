// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStudyTypes
 * @notice Tipos compartidos para estudios de investigación en DASHI
 * @dev Usado por ResearchFundingEscrow, StudyRegistry, etc.
 */
interface IStudyTypes {

    /**
     * @notice Estados de un estudio
     */
    enum StudyStatus {
        Created,        // 0 - Creado pero no iniciado
        Funding,        // 1 - En fase de funding
        Active,         // 2 - Activo, reclutando participantes
        Paused,         // 3 - Pausado temporalmente
        Completed,      // 4 - Completado exitosamente
        Cancelled       // 5 - Cancelado
    }

    /**
     * @notice Tipos de milestone
     */
    enum MilestoneType {
        Enrollment,         // 0 - Inscripción de participante
        DataSubmission,     // 1 - Envío de datos
        FollowUpVisit,      // 2 - Visita de seguimiento
        StudyCompletion,    // 3 - Completar estudio completo
        Custom              // 4 - Milestone personalizado
    }

    /**
     * @notice Estado de milestone
     */
    enum MilestoneStatus {
        Pending,        // 0 - Pendiente
        InProgress,     // 1 - En progreso
        Completed,      // 2 - Completado
        Verified,       // 3 - Verificado por provider
        Paid            // 4 - Pago liberado
    }

    /**
     * @notice Estudio de investigación
     */
    struct Study {
        uint256 id;
        string title;
        string description;
        address sponsor;                    // Patrocinador del estudio
        address[] certifiedProviders;       // Providers autorizados
        StudyStatus status;
        uint256 totalFunding;               // Funding total depositado
        uint256 remainingFunding;           // Funding restante
        uint256 participantCount;           // Número de participantes
        uint256 maxParticipants;            // Máximo de participantes
        uint256 createdAt;
        uint256 startedAt;
        uint256 completedAt;
    }

    /**
     * @notice Milestone de un estudio
     */
    struct Milestone {
        uint256 id;
        uint256 studyId;
        MilestoneType milestoneType;
        string description;
        uint256 rewardAmount;               // Recompensa en wei/tokens
        MilestoneStatus status;
        bytes32 verificationDataHash;       // Hash de datos de verificación
        uint256 createdAt;
        uint256 completedAt;
        uint256 verifiedAt;
    }

    /**
     * @notice Participación de un paciente en un estudio
     */
    struct Participation {
        uint256 studyId;
        address participant;                // DASHI Smart Account del paciente
        uint256 enrolledAt;
        uint256[] completedMilestones;      // IDs de milestones completados
        uint256 totalEarned;                // Total ganado en wei/tokens
        bool active;
    }

    /**
     * @notice Pago a participante
     */
    struct Payment {
        uint256 id;
        uint256 studyId;
        uint256 milestoneId;
        address participant;
        uint256 amount;
        address token;                      // address(0) para ETH
        uint256 paidAt;
        bytes32 txHash;                     // Hash de la transacción
    }

    // ============ Events ============

    event StudyCreated(
        uint256 indexed studyId,
        address indexed sponsor,
        string title,
        uint256 totalFunding
    );

    event StudyFunded(
        uint256 indexed studyId,
        address indexed funder,
        uint256 amount,
        address token
    );

    event ParticipantEnrolled(
        uint256 indexed studyId,
        address indexed participant,
        uint256 enrolledAt
    );

    event MilestoneCompleted(
        uint256 indexed studyId,
        uint256 indexed milestoneId,
        address indexed participant,
        uint256 completedAt
    );

    event MilestoneVerified(
        uint256 indexed studyId,
        uint256 indexed milestoneId,
        address indexed verifier,
        uint256 verifiedAt
    );

    event PaymentReleased(
        uint256 indexed studyId,
        uint256 indexed milestoneId,
        address indexed participant,
        uint256 amount,
        address token
    );

    event StudyCompleted(
        uint256 indexed studyId,
        uint256 completedAt,
        uint256 totalParticipants,
        uint256 totalPaid
    );

    event StudyCancelled(
        uint256 indexed studyId,
        string reason,
        uint256 refundedAmount
    );
}
