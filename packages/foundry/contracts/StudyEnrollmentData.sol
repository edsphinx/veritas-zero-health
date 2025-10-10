// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";

/**
 * @title Match Data
 * @author edsphinx
 * @notice Contract to store and manage dynamic data for on-chain scientific interactions.
 * @dev This contract separates the interaction data logic (e.g., compliance levels)
 * from the SBT token logic for greater security and flexibility.
 */
contract MatchData is IStudyEnrollmentData {
    /**
     * @notice The address of the main ProofOfMatch (SBT registry) contract.
     */
    address public proofOfMatchContract;
    /**
     * @notice The address of the protocol owner (backend/oracle), authorized to log new interactions.
     */
    address public owner;

    /**
     * @notice Mapping from an interaction ID (`matchId`) to its detailed data.
     */
    mapping(uint256 => Match) public matches;

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
    constructor(address _proofOfMatchAddress, address _ownerAddress) {
        proofOfMatchContract = _proofOfMatchAddress;
        owner = _ownerAddress;
    }

    /**
     * @inheritdoc IStudyEnrollmentData
     * @dev Security is enforced by requiring `msg.sender` to be the ProofOfMatch contract,
     * ensuring data entries are only created when an SBT is minted.
     */
    function createMatchEntry(
        uint256 _matchId,
        address _userA,
        address _userB,
        string memory _locationHint
    ) external override {
        require(msg.sender == proofOfMatchContract, "Only ProofOfMatch can create entries");

        matches[_matchId] = Match({
            userA: _userA,
            userB: _userB,
            timestamp: block.timestamp,
            locationHint: _locationHint,
            level: 1,
            interactionCount: 1
        });
    }

    /**
     * @inheritdoc IStudyEnrollmentData
     * @dev Security is enforced by the onlyOwner modifier. The compliance leveling
     * logic can be adjusted here in future versions.
     */
    function recordInteraction(uint256 _matchId) external override onlyOwner {
        Match storage matchToUpdate = matches[_matchId];
        require(matchToUpdate.timestamp != 0, "Match does not exist");

        matchToUpdate.interactionCount++;

        uint8 oldLevel = matchToUpdate.level;
        if (matchToUpdate.interactionCount >= 5) {
            matchToUpdate.level = 3;
        } else if (matchToUpdate.interactionCount >= 3) {
            matchToUpdate.level = 2;
        }

        if (oldLevel != matchToUpdate.level) {
            emit MatchUpgraded(_matchId, matchToUpdate.level);
        }
    }

    /**
     * @inheritdoc IStudyEnrollmentData
     */
    function getMatchDetails(uint256 _matchId) external view override returns (Match memory) {
        return matches[_matchId];
    }
}
