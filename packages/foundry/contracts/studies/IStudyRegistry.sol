// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStudyRegistry Interface
 * @author edsphinx
 * @notice Defines the interface for the on-chain registry of clinical trials with ZK eligibility verification.
 */
interface IStudyRegistry {
    // ============ Structs ============

    struct Study {
        uint256 studyId;
        address researcher;
        uint8 status; // 0: Recruiting, 1: Closed
        string region;
        string compensationDetails;
        string criteriaURI; // Link to off-chain criteria (IPFS)
    }

    struct EligibilityCriteria {
        uint32 minAge;
        uint32 maxAge;
        bool requiresAgeProof;
        uint256 requiredEligibilityCodeHash;  // Poseidon hash of eligibility code
        bool requiresEligibilityProof;
    }

    // ============ Events ============

    /**
     * @notice Emitted when a new study is published to the registry.
     * @param studyId The unique ID of the new study.
     * @param researcher The address of the researcher or institution.
     * @param region The geographical region for the study.
     */
    event StudyPublished(uint256 indexed studyId, address indexed researcher, string region);

    /**
     * @notice Emitted when a patient submits an anonymous application with ZK proof.
     * @param studyId The study ID being applied to.
     * @param applicantCount The total count of verified applicants after this submission.
     */
    event AnonymousApplicationSubmitted(uint256 indexed studyId, uint256 applicantCount);

    /**
     * @notice Emitted when eligibility criteria are set for a study.
     * @param studyId The study ID.
     * @param minAge Minimum age requirement.
     * @param maxAge Maximum age requirement.
     * @param eligibilityCodeHash Poseidon hash of required eligibility code.
     */
    event StudyCriteriaSet(uint256 indexed studyId, uint32 minAge, uint32 maxAge, uint256 eligibilityCodeHash);

    // ============ Study Management Functions ============

    /**
     * @notice Publishes a new clinical trial study to the registry.
     * @param _region Geographic region for recruitment.
     * @param _compensationDetails Participant compensation description.
     * @param _criteriaURI IPFS URI with detailed eligibility criteria.
     * @return studyId The ID of the newly created study.
     */
    function publishStudy(
        string calldata _region,
        string calldata _compensationDetails,
        string calldata _criteriaURI
    ) external returns (uint256 studyId);

    /**
     * @notice Sets eligibility criteria for a study.
     * @param _studyId The study to configure.
     * @param _minAge Minimum age requirement.
     * @param _maxAge Maximum age requirement.
     * @param _eligibilityCodeHash Poseidon hash of required eligibility code (0 if not required).
     */
    function setStudyCriteria(
        uint256 _studyId,
        uint32 _minAge,
        uint32 _maxAge,
        uint256 _eligibilityCodeHash
    ) external;

    /**
     * @notice Closes recruitment for a study (researcher only).
     * @param _studyId The study to close.
     */
    function closeStudyRecruitment(uint256 _studyId) external;

    // ============ Application Functions ============

    /**
     * @notice Submit anonymous application with ZK proof of eligibility.
     * @param _studyId The study to apply to.
     * @param _pA Groth16 proof component A.
     * @param _pB Groth16 proof component B.
     * @param _pC Groth16 proof component C.
     */
    function submitAnonymousApplication(
        uint256 _studyId,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC
    ) external;

    // ============ View Functions ============

    /**
     * @notice Get details of a specific study.
     * @param _studyId The study ID to query.
     * @return Study struct with all details.
     */
    function getStudyDetails(uint256 _studyId) external view returns (Study memory);

    /**
     * @notice Get eligibility criteria for a study.
     * @param _studyId The study ID to query.
     * @return EligibilityCriteria struct.
     */
    function getStudyCriteria(uint256 _studyId) external view returns (EligibilityCriteria memory);

    /**
     * @notice Get count of verified anonymous applicants.
     * @param _studyId The study ID to query.
     * @return Number of verified applicants.
     */
    function getVerifiedApplicantsCount(uint256 _studyId) external view returns (uint256);

    /**
     * @notice Check if an address has already applied to a study.
     * @param _studyId The study ID.
     * @param _applicant The address to check.
     * @return True if already applied.
     */
    function hasAddressApplied(uint256 _studyId, address _applicant) external view returns (bool);

    /**
     * @notice Get the total number of studies published.
     * @return Total study count.
     */
    function getTotalStudies() external view returns (uint256);
}
