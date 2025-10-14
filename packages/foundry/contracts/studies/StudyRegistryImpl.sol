// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StudyRegistry.sol";
import "../zk/AgeVerifier.sol";

/**
 * @title StudyRegistryImpl
 * @author edsphinx
 * @notice Implementation of the on-chain clinical trial registry with ZK proof verification
 * @dev Integrates zero-knowledge proofs for anonymous but verifiable eligibility.
 *      Researchers can publish studies and set age-based eligibility criteria.
 *      Patients can submit anonymous applications with ZK proofs of eligibility without revealing actual age.
 */
contract StudyRegistryImpl is IStudyRegistry {
    // State variables
    uint256 private nextStudyId;
    mapping(uint256 => Study) public studies;
    mapping(uint256 => EligibilityCriteria) public studyCriteria;
    mapping(uint256 => uint256) public verifiedApplicantsCount;
    mapping(uint256 => mapping(address => bool)) public hasApplied;

    // ZK Verifier reference
    AgeVerifier public immutable ageVerifier;

    // Eligibility criteria structure
    struct EligibilityCriteria {
        uint32 minAge;
        uint32 maxAge;
        bool requiresAgeProof;
    }

    event AnonymousApplicationSubmitted(
        uint256 indexed studyId,
        uint256 applicantCount
    );

    event StudyCriteriaSet(
        uint256 indexed studyId,
        uint32 minAge,
        uint32 maxAge
    );

    // Errors
    error InvalidStudyId();
    error StudyNotRecruiting();
    error AlreadyApplied();
    error ProofVerificationFailed();
    error Unauthorized();

    /**
     * @notice Constructor initializes the registry with an AgeVerifier
     * @param _ageVerifier Address of the deployed AgeVerifier contract
     */
    constructor(address _ageVerifier) {
        require(_ageVerifier != address(0), "Invalid verifier address");
        ageVerifier = AgeVerifier(_ageVerifier);
        nextStudyId = 1;
    }

    /**
     * @notice Publishes a new clinical trial study to the registry
     * @param _region Geographic region for recruitment
     * @param _compensationDetails Participant compensation description
     * @param _criteriaURI IPFS URI with detailed eligibility criteria
     * @return studyId The ID of the newly created study
     */
    function publishStudy(
        string calldata _region,
        string calldata _compensationDetails,
        string calldata _criteriaURI
    ) external returns (uint256) {
        uint256 studyId = nextStudyId++;

        studies[studyId] = Study({
            studyId: studyId,
            researcher: msg.sender,
            status: 0, // Recruiting
            region: _region,
            compensationDetails: _compensationDetails,
            criteriaURI: _criteriaURI
        });

        emit StudyPublished(studyId, msg.sender, _region);

        return studyId;
    }

    /**
     * @notice Sets eligibility criteria for a study
     * @param _studyId The study to configure
     * @param _minAge Minimum age requirement
     * @param _maxAge Maximum age requirement
     */
    function setStudyCriteria(
        uint256 _studyId,
        uint32 _minAge,
        uint32 _maxAge
    ) external {
        if (_studyId == 0 || _studyId >= nextStudyId) revert InvalidStudyId();
        if (studies[_studyId].researcher != msg.sender) revert Unauthorized();

        studyCriteria[_studyId] = EligibilityCriteria({
            minAge: _minAge,
            maxAge: _maxAge,
            requiresAgeProof: true
        });

        emit StudyCriteriaSet(_studyId, _minAge, _maxAge);
    }

    /**
     * @notice Submit anonymous application with ZK proof of eligibility
     * @param _studyId The study to apply to
     * @param _ageProof Zero-knowledge proof of age eligibility
     * @dev Patient remains anonymous while proving they meet age requirements
     */
    function submitAnonymousApplication(
        uint256 _studyId,
        bytes calldata _ageProof
    ) external {
        // Validation
        if (_studyId == 0 || _studyId >= nextStudyId) revert InvalidStudyId();
        if (studies[_studyId].status != 0) revert StudyNotRecruiting();
        if (hasApplied[_studyId][msg.sender]) revert AlreadyApplied();

        // Get criteria
        EligibilityCriteria memory criteria = studyCriteria[_studyId];

        // Verify ZK proof if required
        if (criteria.requiresAgeProof) {
            bool isValid = ageVerifier.verify(
                _ageProof,
                criteria.minAge,
                criteria.maxAge
            );

            if (!isValid) revert ProofVerificationFailed();
        }

        // Record application (anonymous, just count)
        hasApplied[_studyId][msg.sender] = true;
        verifiedApplicantsCount[_studyId]++;

        emit AnonymousApplicationSubmitted(
            _studyId,
            verifiedApplicantsCount[_studyId]
        );
    }

    /**
     * @notice Get details of a specific study
     * @param _studyId The study ID to query
     * @return Study struct with all details
     */
    function getStudyDetails(uint256 _studyId)
        external
        view
        returns (Study memory)
    {
        if (_studyId == 0 || _studyId >= nextStudyId) revert InvalidStudyId();
        return studies[_studyId];
    }

    /**
     * @notice Get eligibility criteria for a study
     * @param _studyId The study ID to query
     * @return EligibilityCriteria struct
     */
    function getStudyCriteria(uint256 _studyId)
        external
        view
        returns (EligibilityCriteria memory)
    {
        if (_studyId == 0 || _studyId >= nextStudyId) revert InvalidStudyId();
        return studyCriteria[_studyId];
    }

    /**
     * @notice Get count of verified anonymous applicants
     * @param _studyId The study ID to query
     * @return Number of verified applicants
     */
    function getVerifiedApplicantsCount(uint256 _studyId)
        external
        view
        returns (uint256)
    {
        return verifiedApplicantsCount[_studyId];
    }

    /**
     * @notice Check if an address has already applied to a study
     * @param _studyId The study ID
     * @param _applicant The address to check
     * @return True if already applied
     */
    function hasAddressApplied(uint256 _studyId, address _applicant)
        external
        view
        returns (bool)
    {
        return hasApplied[_studyId][_applicant];
    }

    /**
     * @notice Researcher can close recruitment for their study
     * @param _studyId The study to close
     */
    function closeStudyRecruitment(uint256 _studyId) external {
        if (_studyId == 0 || _studyId >= nextStudyId) revert InvalidStudyId();
        if (studies[_studyId].researcher != msg.sender) revert Unauthorized();

        studies[_studyId].status = 1; // Closed
    }

    /**
     * @notice Get the total number of studies published
     * @return Total study count
     */
    function getTotalStudies() external view returns (uint256) {
        return nextStudyId - 1;
    }
}
