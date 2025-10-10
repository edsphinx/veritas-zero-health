// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";
import { IStudyParticipationSBT } from "./IStudyParticipationSBT.sol"; // Importamos el contrato, no una interfaz

/**
 * @title ComplianceScore
 * @author edsphinx
 * @notice Read-only contract that calculates a "Compliance Score" for a user (e.g., a patient).
 * @dev Serves as a Sybil resistance and on-chain reputation mechanism. It reads data from the
 * ProofOfMatch (SBT registry) and MatchData (interaction data) contracts to generate a score
 * based on a user's verified participation in scientific protocols.
 */
contract ComplianceScore {
    /**
     * @notice The instance of the IStudyParticipationSBT contract interface.
     */
    IStudyParticipationSBT public proofOfMatchContract;
    /**
     * @notice The instance of the IStudyEnrollmentData contract interface.
     */
    IStudyEnrollmentData public matchDataContract;

    /**
     * @dev On deployment, links the addresses of the contracts this scoring module depends on.
     */
    constructor(address _proofOfMatchAddress, address _matchDataAddress) {
        proofOfMatchContract = IStudyParticipationSBT(_proofOfMatchAddress);
        matchDataContract = IStudyEnrollmentData(_matchDataAddress);
    }

    /**
     * @notice Calculates the Compliance Score for a given user address.
     * @dev It fetches all of the user's "Proof of Protocol" SBTs, gets the details for each
     * associated interaction (including the compliance level), and applies a formula to generate the final score.
     * @param user The address of the user (e.g., patient) to query.
     * @return score The calculated Compliance Score.
     */
    function getPresenceScore(address user) public view returns (uint256) {
        uint256 score = 0;

        uint256[] memory tokens = proofOfMatchContract.getTokensOfOwner(user);

        for (uint i = 0; i < tokens.length; i++) {
            uint256 matchId = proofOfMatchContract.tokenToMatchId(tokens[i]);

            IStudyEnrollmentData.Match memory currentMatch = matchDataContract.getMatchDetails(matchId);

            if (currentMatch.level == 1) {
                score += 10;
            } else if (currentMatch.level == 2) {
                score += 25;
            } else if (currentMatch.level >= 3) {
                score += 50;
            }
        }

        return score;
    }
}
