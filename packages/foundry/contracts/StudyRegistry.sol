// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStudyRegistry Interface
 * @notice Defines the interface for the on-chain registry of clinical trials.
 */
interface IStudyRegistry {
    struct Study {
        uint256 studyId;
        address researcher;
        uint8 status; // e.g., 0: Recruiting, 1: Closed
        string region;
        string compensationDetails;
        string criteriaURI; // Link to off-chain criteria (IPFS)
    }

    /**
     * @notice Emitted when a new study is published to the registry.
     * @param studyId The unique ID of the new study.
     * @param researcher The address of the researcher or institution.
     * @param region The geographical region for the study.
     */
    event StudyPublished(uint256 indexed studyId, address indexed researcher, string region);

    /**
     * @notice Allows a researcher to publish a new study.
     * @param _region The geographical region for recruitment.
     * @param _compensationDetails A description of the participant compensation.
     * @param _criteriaURI An IPFS URI pointing to a JSON file with detailed clinical criteria.
     */
    function publishStudy(
        string calldata _region,
        string calldata _compensationDetails,
        string calldata _criteriaURI
    ) external returns (uint256 studyId);

    /**
     * @notice Returns the details for a specific study.
     * @param _studyId The ID of the study to query.
     * @return The complete Study struct.
     */
    function getStudyDetails(uint256 _studyId) external view returns (Study memory);
}
