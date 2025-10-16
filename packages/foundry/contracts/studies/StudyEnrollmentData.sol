// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";

/**
 * @title StudyEnrollmentData
 * @author edsphinx
 * @notice Contract to store and manage dynamic data for study participant enrollments.
 * @dev This contract separates the enrollment data logic (e.g., compliance levels)
 * from the SBT token logic for greater security and flexibility.
 */
contract StudyEnrollmentData is IStudyEnrollmentData {
    /**
     * @notice The address of the StudyParticipationSBT contract.
     */
    address public participationSBTContract;

    /**
     * @notice The address of the protocol owner (backend/oracle), authorized to log new interactions.
     */
    address public owner;

    /**
     * @notice Mapping from an enrollment ID to its detailed data.
     */
    mapping(uint256 => Enrollment) public enrollments;

    /**
     * @dev Modifier to restrict functions to only the protocol owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    /**
     * @dev On deployment, sets the addresses of the SBT contract and the protocol owner.
     */
    constructor(address _participationSBTAddress, address _ownerAddress) {
        participationSBTContract = _participationSBTAddress;
        owner = _ownerAddress;
    }

    /**
     * @inheritdoc IStudyEnrollmentData
     * @dev Security is enforced by requiring `msg.sender` to be the StudyParticipationSBT contract,
     * ensuring data entries are only created when an SBT is minted.
     */
    function createEnrollmentEntry(
        uint256 _enrollmentId,
        address _participant,
        address _institution,
        string memory _locationHint
    ) external override {
        require(msg.sender == participationSBTContract, "Only StudyParticipationSBT can create entries");

        enrollments[_enrollmentId] = Enrollment({
            participant: _participant,
            institution: _institution,
            timestamp: block.timestamp,
            locationHint: _locationHint,
            complianceLevel: 1,
            interactionCount: 1
        });
    }

    /**
     * @inheritdoc IStudyEnrollmentData
     * @dev Security is enforced by the onlyOwner modifier. The compliance leveling
     * logic can be adjusted here in future versions.
     */
    function recordInteraction(uint256 _enrollmentId) external override onlyOwner {
        Enrollment storage enrollment = enrollments[_enrollmentId];
        require(enrollment.timestamp != 0, "Enrollment does not exist");

        enrollment.interactionCount++;

        uint8 oldLevel = enrollment.complianceLevel;
        if (enrollment.interactionCount >= 5) {
            enrollment.complianceLevel = 3;
        } else if (enrollment.interactionCount >= 3) {
            enrollment.complianceLevel = 2;
        }

        if (oldLevel != enrollment.complianceLevel) {
            emit EnrollmentLevelUpgraded(_enrollmentId, enrollment.complianceLevel);
        }
    }

    /**
     * @inheritdoc IStudyEnrollmentData
     */
    function getEnrollmentDetails(uint256 _enrollmentId) external view override returns (Enrollment memory) {
        return enrollments[_enrollmentId];
    }
}
