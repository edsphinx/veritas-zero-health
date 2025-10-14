// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStudyParticipationSBT Interface
 * @author edsphinx
 * @notice Defines the public interface for the ProofOfMatch contract.
 * @dev In the DeSci context, this contract is the core registry for "Proof of Protocol" SBTs.
 * It establishes the functions and events needed for other contracts, like the Compliance Score contract,
 * to interact with the SBT data.
 */
interface IStudyParticipationSBT {
    /**
     * @notice Emitted when a new on-chain interaction is verified and two "Proof of Protocol" SBTs are minted.
     * @param matchId The unique ID for the on-chain interaction.
     * @param tokenIdA The ID of the SBT minted to the patient (userA).
     * @param tokenIdB The ID of the SBT minted to the clinic/institution (userB).
     * @param userA The address of the patient.
     * @param userB The address of the clinic or institution.
     */
    event MatchCreated(uint256 indexed matchId, uint256 tokenIdA, uint256 tokenIdB, address userA, address userB);

    /**
     * @notice Returns the interaction ID (`matchId`) associated with a specific SBT.
     * @param tokenId The ID of the SBT to query.
     * @return The unique ID of the on-chain interaction.
     */
    function tokenToMatchId(uint256 tokenId) external view returns (uint256);

    /**
     * @notice Returns an array of all "Proof of Protocol" SBT IDs owned by an address.
     * @param owner The address of the token owner (patient or clinic).
     * @return An array of token IDs.
     */
    function getTokensOfOwner(address owner) external view returns (uint256[] memory);
}
