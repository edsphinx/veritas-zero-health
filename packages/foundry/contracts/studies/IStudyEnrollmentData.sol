// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStudyEnrollmentData Interface
 * @author edsphinx
 * @dev Defines the interface for the contract that stores and manages data
 * for study participant enrollments, such as compliance levels and interaction counts.
 */
interface IStudyEnrollmentData {
    /**
     * @dev Struct that stores all information for a verified study enrollment.
     */
    struct Enrollment {
        address participant;
        address institution;
        uint256 timestamp;
        string locationHint;
        uint8 complianceLevel;
        uint16 interactionCount;
    }

    /**
     * @notice Emitted when an enrollment's compliance level increases.
     * @param enrollmentId The ID of the enrollment that was upgraded.
     * @param newLevel The new compliance level reached.
     */
    event EnrollmentLevelUpgraded(uint256 indexed enrollmentId, uint8 newLevel);

    /**
     * @notice Creates the initial data entry for a new study enrollment.
     * @dev Must only be called by the StudyParticipationSBT contract.
     * @param _enrollmentId The unique ID of the enrollment to create.
     * @param _participant The participant's address.
     * @param _institution The clinic's or institution's address.
     * @param _locationHint A non-sensitive hint about the enrollment (e.g., "Protocol Step A-1").
     */
    function createEnrollmentEntry(uint256 _enrollmentId, address _participant, address _institution, string memory _locationHint) external;

    /**
     * @notice Logs a new follow-up interaction for an existing enrollment, potentially increasing its compliance level.
     * @dev Must only be called by the protocol owner (backend/oracle).
     * @param _enrollmentId The ID of the enrollment to update.
     */
    function recordInteraction(uint256 _enrollmentId) external;

    /**
     * @notice Gets all details for a specific enrollment.
     * @param _enrollmentId The ID of the enrollment to query.
     * @return The complete Enrollment struct with all its data.
     */
    function getEnrollmentDetails(uint256 _enrollmentId) external view returns (Enrollment memory);
}
