// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";

/**
 * @title IStudyParticipationSBT Interface
 * @author edsphinx
 * @notice Defines the public interface for the StudyParticipationSBT contract.
 * @dev This contract is the core registry for Study Participation Soulbound Tokens.
 * It establishes the functions and events needed for other contracts to interact with the SBT data.
 */
interface IStudyParticipationSBT {
    // ============ Events ============

    /**
     * @notice Emitted when a participant is enrolled in a study and SBTs are minted.
     * @param enrollmentId The unique ID for the study enrollment.
     * @param participantTokenId The ID of the SBT minted to the participant.
     * @param institutionTokenId The ID of the SBT minted to the institution.
     * @param participant The address of the participant.
     * @param institution The address of the clinic or institution.
     */
    event ParticipantEnrolled(
        uint256 indexed enrollmentId,
        uint256 participantTokenId,
        uint256 institutionTokenId,
        address participant,
        address institution
    );

    // ============ Admin Functions ============

    /**
     * @notice Sets the address of the EnrollmentData contract.
     * @dev Must be called by the owner before any enrollments can be created.
     * @param _contractAddress The address of the deployed EnrollmentData contract.
     */
    function setEnrollmentDataContract(address _contractAddress) external;

    // ============ Core Functions ============

    /**
     * @notice Enrolls a participant in a study, minting one SBT for each party.
     * @dev Calls the EnrollmentData contract to create the corresponding data entry.
     * Can only be called by the owner (backend/oracle).
     * @param _participant The address of the participant.
     * @param _institution The address of the clinic or institution.
     * @param _locationHint A hint describing the enrollment (e.g., "Week 4 Check-in").
     */
    function enrollParticipant(address _participant, address _institution, string memory _locationHint) external;

    // ============ View Functions ============

    /**
     * @notice Returns the EnrollmentData contract address.
     * @return The address of the EnrollmentData contract.
     */
    function enrollmentDataContract() external view returns (IStudyEnrollmentData);

    /**
     * @notice Returns whether an enrollment exists between two addresses.
     * @param _participant Participant address.
     * @param _institution Institution address.
     * @return True if an enrollment exists between the two addresses.
     */
    function enrollmentExists(address _participant, address _institution) external view returns (bool);

    /**
     * @notice Returns the enrollment ID associated with a specific SBT.
     * @param tokenId The ID of the SBT to query.
     * @return The unique ID of the enrollment.
     */
    function tokenToEnrollmentId(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Returns an array of all Study Participation SBT IDs owned by an address.
     * @param owner The address of the token owner (participant or institution).
     * @return An array of token IDs.
     */
    function getTokensOfOwner(address owner) external view returns (uint256[] memory);
}
