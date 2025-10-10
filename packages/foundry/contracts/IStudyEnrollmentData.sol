// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStudyEnrollmentData Interface
 * @author edsphinx
 * @dev Defines the interface for the contract that stores and manages data
 * for on-chain scientific interactions, such as compliance levels and event counts.
 */
interface IStudyEnrollmentData {
    /**
     * @dev Struct that stores all information for a verified on-chain interaction.
     */
    struct Match {
        address userA;
        address userB;
        uint256 timestamp;
        string locationHint;
        uint8 level;
        uint16 interactionCount;
    }

    /**
     * @notice Emitted when an interaction's compliance level increases.
     * @param matchId The ID of the interaction that was upgraded.
     * @param newLevel The new compliance level reached.
     */
    event MatchUpgraded(uint256 indexed matchId, uint8 newLevel);

    /**
     * @notice Creates the initial data entry for a new on-chain interaction.
     * @dev Must only be called by the ProofOfMatch contract.
     * @param _matchId The unique ID of the interaction to create.
     * @param _userA The patient's address.
     * @param _userB The clinic's or institution's address.
     * @param _locationHint A non-sensitive hint about the interaction (e.g., "Protocol Step A-1").
     */
    function createMatchEntry(uint256 _matchId, address _userA, address _userB, string memory _locationHint) external;

    /**
     * @notice Logs a new follow-up event for an existing interaction, potentially increasing its compliance level.
     * @dev Must only be called by the protocol owner (backend/oracle).
     * @param _matchId The ID of the interaction to update.
     */
    function recordInteraction(uint256 _matchId) external;

    /**
     * @notice Gets all details for a specific on-chain interaction.
     * @param _matchId The ID of the interaction to query.
     * @return The complete Match struct with all its data.
     */
    function getMatchDetails(uint256 _matchId) external view returns (Match memory);
}
