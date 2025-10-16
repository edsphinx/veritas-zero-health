// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";
import { IStudyParticipationSBT } from "./IStudyParticipationSBT.sol";

/**
 * @title ComplianceScore
 * @author edsphinx
 * @notice Read-only contract that calculates a "Compliance Score" for study participants.
 * @dev Serves as a Sybil resistance and on-chain reputation mechanism. It reads data from the
 * StudyParticipationSBT (SBT registry) and StudyEnrollmentData (enrollment data) contracts to generate a score
 * based on a participant's verified participation in scientific protocols.
 */
contract ComplianceScore {
    /**
     * @notice The instance of the IStudyParticipationSBT contract interface.
     */
    IStudyParticipationSBT public participationSBTContract;
    /**
     * @notice The instance of the IStudyEnrollmentData contract interface.
     */
    IStudyEnrollmentData public enrollmentDataContract;

    /**
     * @dev On deployment, links the addresses of the contracts this scoring module depends on.
     */
    constructor(address _participationSBTAddress, address _enrollmentDataAddress) {
        participationSBTContract = IStudyParticipationSBT(_participationSBTAddress);
        enrollmentDataContract = IStudyEnrollmentData(_enrollmentDataAddress);
    }

    /**
     * @notice Calculates the Compliance Score for a given participant address.
     * @dev It fetches all of the participant's Study Participation SBTs, gets the details for each
     * associated enrollment (including the compliance level), and applies a formula to generate the final score.
     * @param participant The address of the participant to query.
     * @return score The calculated Compliance Score.
     */
    function getComplianceScore(address participant) public view returns (uint256) {
        uint256 score = 0;

        uint256[] memory tokens = participationSBTContract.getTokensOfOwner(participant);

        for (uint i = 0; i < tokens.length; i++) {
            uint256 enrollmentId = participationSBTContract.tokenToEnrollmentId(tokens[i]);

            IStudyEnrollmentData.Enrollment memory enrollment = enrollmentDataContract.getEnrollmentDetails(enrollmentId);

            if (enrollment.complianceLevel == 1) {
                score += 10;
            } else if (enrollment.complianceLevel == 2) {
                score += 25;
            } else if (enrollment.complianceLevel >= 3) {
                score += 50;
            }
        }

        return score;
    }
}
