// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../types/IStudyTypes.sol";
import "../types/IProviderTypes.sol";

/**
 * @title ResearchFundingEscrow
 * @author edsphinx
 * @notice Escrow contract for DeSci research studies with milestone-based participant payments
 * @dev Manages study funding, participant enrollment, milestone verification, and automatic payments
 *
 * Flow:
 * 1. Sponsor creates study with defined milestones
 * 2. Sponsor deposits ETH/ERC20 tokens to fund the study
 * 3. Participants (DASHI Smart Accounts) enroll in the study
 * 4. Participants complete milestones
 * 5. Certified providers verify milestone completion
 * 6. Payments automatically released to participant wallets
 *
 * Integration:
 * - Uses IStudyTypes for all study/milestone/participation data structures
 * - Validates providers through MedicalProviderRegistry
 * - Pays to DASHI Smart Account addresses (multi-chain compatible)
 */
contract ResearchFundingEscrow is AccessControl, Pausable, ReentrancyGuard, IStudyTypes {
    using SafeERC20 for IERC20;

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // ============ State Variables ============

    // Reference to MedicalProviderRegistry for provider verification
    address public providerRegistry;

    // Study ID counter
    uint256 public studyCounter;

    // Milestone ID counter
    uint256 public milestoneCounter;

    // Payment ID counter
    uint256 public paymentCounter;

    // Study ID => Study details
    mapping(uint256 => Study) public studies;

    // Milestone ID => Milestone details
    mapping(uint256 => Milestone) public milestones;

    // Study ID => Milestone IDs
    mapping(uint256 => uint256[]) public studyMilestones;

    // Study ID => Participant address => Participation details
    mapping(uint256 => mapping(address => Participation)) public participations;

    // Study ID => List of participant addresses
    mapping(uint256 => address[]) public studyParticipants;

    // Payment ID => Payment details
    mapping(uint256 => Payment) public payments;

    // Participant address => Payment IDs
    mapping(address => uint256[]) public participantPayments;

    // Minimum funding amount (prevent dust)
    uint256 public minFundingAmount = 0.01 ether;

    // ============ Modifiers ============

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "ResearchFundingEscrow: caller is not an admin");
        _;
    }

    modifier onlyVerifier() {
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "ResearchFundingEscrow: caller is not a verifier"
        );
        _;
    }

    modifier studyExists(uint256 studyId) {
        require(studyId > 0 && studyId <= studyCounter, "ResearchFundingEscrow: study does not exist");
        _;
    }

    modifier milestoneExists(uint256 milestoneId) {
        require(milestoneId > 0 && milestoneId <= milestoneCounter, "ResearchFundingEscrow: milestone does not exist");
        _;
    }

    modifier onlySponsor(uint256 studyId) {
        require(studies[studyId].sponsor == msg.sender, "ResearchFundingEscrow: caller is not the sponsor");
        _;
    }

    modifier onlyCertifiedProvider(uint256 studyId) {
        require(_isCertifiedProvider(studyId, msg.sender), "ResearchFundingEscrow: caller is not a certified provider");
        _;
    }

    // ============ Constructor ============

    constructor(address _providerRegistry) {
        require(_providerRegistry != address(0), "ResearchFundingEscrow: invalid provider registry");

        providerRegistry = _providerRegistry;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ============ External Functions - Study Management ============

    /**
     * @notice Create a new research study
     * @param title Study title
     * @param description Study description
     * @param certifiedProviders List of certified provider addresses allowed to verify milestones
     * @param maxParticipants Maximum number of participants
     * @return studyId The ID of the created study
     */
    function createStudy(
        string memory title,
        string memory description,
        address[] memory certifiedProviders,
        uint256 maxParticipants
    ) external whenNotPaused returns (uint256) {
        require(bytes(title).length > 0, "ResearchFundingEscrow: title required");
        require(certifiedProviders.length > 0, "ResearchFundingEscrow: at least one provider required");
        require(maxParticipants > 0, "ResearchFundingEscrow: maxParticipants must be > 0");

        studyCounter++;
        uint256 studyId = studyCounter;

        studies[studyId] = Study({
            id: studyId,
            title: title,
            description: description,
            sponsor: msg.sender,
            certifiedProviders: certifiedProviders,
            status: StudyStatus.Created,
            totalFunding: 0,
            remainingFunding: 0,
            participantCount: 0,
            maxParticipants: maxParticipants,
            createdAt: block.timestamp,
            startedAt: 0,
            completedAt: 0
        });

        emit StudyCreated(studyId, msg.sender, title, 0);

        return studyId;
    }

    /**
     * @notice Fund a study with ETH
     * @param studyId The study to fund
     */
    function fundStudyETH(uint256 studyId)
        external
        payable
        studyExists(studyId)
        whenNotPaused
    {
        require(msg.value >= minFundingAmount, "ResearchFundingEscrow: funding amount too low");
        require(
            studies[studyId].status == StudyStatus.Created ||
            studies[studyId].status == StudyStatus.Funding,
            "ResearchFundingEscrow: study not accepting funding"
        );

        studies[studyId].totalFunding += msg.value;
        studies[studyId].remainingFunding += msg.value;

        if (studies[studyId].status == StudyStatus.Created) {
            studies[studyId].status = StudyStatus.Funding;
        }

        emit StudyFunded(studyId, msg.sender, msg.value, address(0));
    }

    /**
     * @notice Fund a study with ERC20 tokens
     * @param studyId The study to fund
     * @param token The ERC20 token address
     * @param amount The amount to fund
     */
    function fundStudyERC20(
        uint256 studyId,
        address token,
        uint256 amount
    ) external studyExists(studyId) whenNotPaused {
        require(token != address(0), "ResearchFundingEscrow: invalid token address");
        require(amount >= minFundingAmount, "ResearchFundingEscrow: funding amount too low");
        require(
            studies[studyId].status == StudyStatus.Created ||
            studies[studyId].status == StudyStatus.Funding,
            "ResearchFundingEscrow: study not accepting funding"
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        studies[studyId].totalFunding += amount;
        studies[studyId].remainingFunding += amount;

        if (studies[studyId].status == StudyStatus.Created) {
            studies[studyId].status = StudyStatus.Funding;
        }

        emit StudyFunded(studyId, msg.sender, amount, token);
    }

    /**
     * @notice Start a funded study
     * @param studyId The study to start
     */
    function startStudy(uint256 studyId)
        external
        studyExists(studyId)
        onlySponsor(studyId)
        whenNotPaused
    {
        require(
            studies[studyId].status == StudyStatus.Funding,
            "ResearchFundingEscrow: study must be in funding status"
        );
        require(
            studies[studyId].totalFunding > 0,
            "ResearchFundingEscrow: study has no funding"
        );

        studies[studyId].status = StudyStatus.Active;
        studies[studyId].startedAt = block.timestamp;
    }

    /**
     * @notice Pause a study temporarily
     * @param studyId The study to pause
     */
    function pauseStudy(uint256 studyId)
        external
        studyExists(studyId)
        onlySponsor(studyId)
    {
        require(
            studies[studyId].status == StudyStatus.Active,
            "ResearchFundingEscrow: study is not active"
        );

        studies[studyId].status = StudyStatus.Paused;
    }

    /**
     * @notice Resume a paused study
     * @param studyId The study to resume
     */
    function resumeStudy(uint256 studyId)
        external
        studyExists(studyId)
        onlySponsor(studyId)
    {
        require(
            studies[studyId].status == StudyStatus.Paused,
            "ResearchFundingEscrow: study is not paused"
        );

        studies[studyId].status = StudyStatus.Active;
    }

    /**
     * @notice Complete a study
     * @param studyId The study to complete
     */
    function completeStudy(uint256 studyId)
        external
        studyExists(studyId)
        onlySponsor(studyId)
    {
        require(
            studies[studyId].status == StudyStatus.Active ||
            studies[studyId].status == StudyStatus.Paused,
            "ResearchFundingEscrow: study is not active or paused"
        );

        studies[studyId].status = StudyStatus.Completed;
        studies[studyId].completedAt = block.timestamp;

        uint256 totalPaid = studies[studyId].totalFunding - studies[studyId].remainingFunding;

        emit StudyCompleted(
            studyId,
            block.timestamp,
            studies[studyId].participantCount,
            totalPaid
        );
    }

    /**
     * @notice Cancel a study and refund remaining funds
     * @param studyId The study to cancel
     * @param reason Reason for cancellation
     */
    function cancelStudy(uint256 studyId, string memory reason)
        external
        studyExists(studyId)
        onlySponsor(studyId)
        nonReentrant
    {
        require(
            studies[studyId].status != StudyStatus.Completed &&
            studies[studyId].status != StudyStatus.Cancelled,
            "ResearchFundingEscrow: study already completed or cancelled"
        );

        uint256 refundAmount = studies[studyId].remainingFunding;
        studies[studyId].status = StudyStatus.Cancelled;
        studies[studyId].remainingFunding = 0;

        if (refundAmount > 0) {
            // Refund ETH to sponsor (assuming ETH for simplicity, extend for ERC20)
            (bool success, ) = studies[studyId].sponsor.call{value: refundAmount}("");
            require(success, "ResearchFundingEscrow: refund failed");
        }

        emit StudyCancelled(studyId, reason, refundAmount);
    }

    // ============ External Functions - Milestone Management ============

    /**
     * @notice Add a milestone to a study
     * @param studyId The study ID
     * @param milestoneType Type of milestone
     * @param description Description of the milestone
     * @param rewardAmount Reward amount for completing this milestone
     * @return milestoneId The ID of the created milestone
     */
    function addMilestone(
        uint256 studyId,
        MilestoneType milestoneType,
        string memory description,
        uint256 rewardAmount
    ) external studyExists(studyId) onlySponsor(studyId) returns (uint256) {
        require(bytes(description).length > 0, "ResearchFundingEscrow: description required");
        require(rewardAmount > 0, "ResearchFundingEscrow: reward must be > 0");
        require(
            studies[studyId].status == StudyStatus.Created ||
            studies[studyId].status == StudyStatus.Funding,
            "ResearchFundingEscrow: cannot add milestones after study started"
        );

        milestoneCounter++;
        uint256 milestoneId = milestoneCounter;

        milestones[milestoneId] = Milestone({
            id: milestoneId,
            studyId: studyId,
            milestoneType: milestoneType,
            description: description,
            rewardAmount: rewardAmount,
            status: MilestoneStatus.Pending,
            verificationDataHash: bytes32(0),
            createdAt: block.timestamp,
            completedAt: 0,
            verifiedAt: 0
        });

        studyMilestones[studyId].push(milestoneId);

        return milestoneId;
    }

    /**
     * @notice Add multiple milestones to a study in a single transaction
     * @param studyId The study ID
     * @param milestoneTypes Array of milestone types
     * @param descriptions Array of milestone descriptions
     * @param rewardAmounts Array of reward amounts
     * @return milestoneIds Array of created milestone IDs
     */
    function addMilestonesBatch(
        uint256 studyId,
        MilestoneType[] memory milestoneTypes,
        string[] memory descriptions,
        uint256[] memory rewardAmounts
    ) external studyExists(studyId) onlySponsor(studyId) returns (uint256[] memory) {
        require(milestoneTypes.length > 0, "ResearchFundingEscrow: no milestones provided");
        require(
            milestoneTypes.length == descriptions.length && milestoneTypes.length == rewardAmounts.length,
            "ResearchFundingEscrow: array lengths must match"
        );
        require(
            milestoneTypes.length <= 20,
            "ResearchFundingEscrow: too many milestones (max 20 per batch)"
        );
        require(
            studies[studyId].status == StudyStatus.Created ||
            studies[studyId].status == StudyStatus.Funding,
            "ResearchFundingEscrow: cannot add milestones after study started"
        );

        uint256[] memory milestoneIds = new uint256[](milestoneTypes.length);

        for (uint256 i = 0; i < milestoneTypes.length; i++) {
            require(bytes(descriptions[i]).length > 0, "ResearchFundingEscrow: description required");
            require(rewardAmounts[i] > 0, "ResearchFundingEscrow: reward must be > 0");

            milestoneCounter++;
            uint256 milestoneId = milestoneCounter;

            milestones[milestoneId] = Milestone({
                id: milestoneId,
                studyId: studyId,
                milestoneType: milestoneTypes[i],
                description: descriptions[i],
                rewardAmount: rewardAmounts[i],
                status: MilestoneStatus.Pending,
                verificationDataHash: bytes32(0),
                createdAt: block.timestamp,
                completedAt: 0,
                verifiedAt: 0
            });

            studyMilestones[studyId].push(milestoneId);
            milestoneIds[i] = milestoneId;
        }

        return milestoneIds;
    }

    // ============ External Functions - Participant Management ============

    /**
     * @notice Enroll a participant in a study
     * @param studyId The study to enroll in
     * @param participant The DASHI Smart Account address of the participant
     */
    function enrollParticipant(
        uint256 studyId,
        address participant
    ) external studyExists(studyId) onlyCertifiedProvider(studyId) whenNotPaused {
        require(participant != address(0), "ResearchFundingEscrow: invalid participant address");
        require(
            studies[studyId].status == StudyStatus.Active,
            "ResearchFundingEscrow: study is not active"
        );
        require(
            studies[studyId].participantCount < studies[studyId].maxParticipants,
            "ResearchFundingEscrow: study is full"
        );
        require(
            !participations[studyId][participant].active,
            "ResearchFundingEscrow: participant already enrolled"
        );

        participations[studyId][participant] = Participation({
            studyId: studyId,
            participant: participant,
            enrolledAt: block.timestamp,
            completedMilestones: new uint256[](0),
            totalEarned: 0,
            active: true
        });

        studyParticipants[studyId].push(participant);
        studies[studyId].participantCount++;

        emit ParticipantEnrolled(studyId, participant, block.timestamp);
    }

    /**
     * @notice Complete a milestone for a participant
     * @param studyId The study ID
     * @param milestoneId The milestone ID
     * @param participant The participant address
     * @param verificationDataHash Hash of verification data (e.g., medical records, ZK proof)
     */
    function completeMilestone(
        uint256 studyId,
        uint256 milestoneId,
        address participant,
        bytes32 verificationDataHash
    ) external studyExists(studyId) milestoneExists(milestoneId) onlyCertifiedProvider(studyId) whenNotPaused {
        require(
            participations[studyId][participant].active,
            "ResearchFundingEscrow: participant not enrolled"
        );
        require(
            milestones[milestoneId].studyId == studyId,
            "ResearchFundingEscrow: milestone does not belong to this study"
        );
        require(
            milestones[milestoneId].status == MilestoneStatus.Pending,
            "ResearchFundingEscrow: milestone already completed"
        );

        milestones[milestoneId].status = MilestoneStatus.Completed;
        milestones[milestoneId].verificationDataHash = verificationDataHash;
        milestones[milestoneId].completedAt = block.timestamp;

        participations[studyId][participant].completedMilestones.push(milestoneId);

        emit MilestoneCompleted(studyId, milestoneId, participant, block.timestamp);
    }

    /**
     * @notice Verify a completed milestone (by certified provider or verifier)
     * @param milestoneId The milestone to verify
     */
    function verifyMilestone(uint256 milestoneId)
        external
        milestoneExists(milestoneId)
        onlyVerifier
        whenNotPaused
    {
        require(
            milestones[milestoneId].status == MilestoneStatus.Completed,
            "ResearchFundingEscrow: milestone not completed"
        );

        milestones[milestoneId].status = MilestoneStatus.Verified;
        milestones[milestoneId].verifiedAt = block.timestamp;

        emit MilestoneVerified(
            milestones[milestoneId].studyId,
            milestoneId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Release payment for a verified milestone
     * @param studyId The study ID
     * @param milestoneId The milestone ID
     * @param participant The participant to pay
     * @param token The token to pay with (address(0) for ETH)
     */
    function releasePayment(
        uint256 studyId,
        uint256 milestoneId,
        address participant,
        address token
    ) external studyExists(studyId) milestoneExists(milestoneId) nonReentrant whenNotPaused {
        require(
            milestones[milestoneId].status == MilestoneStatus.Verified,
            "ResearchFundingEscrow: milestone not verified"
        );
        require(
            participations[studyId][participant].active,
            "ResearchFundingEscrow: participant not enrolled"
        );

        uint256 amount = milestones[milestoneId].rewardAmount;
        require(
            studies[studyId].remainingFunding >= amount,
            "ResearchFundingEscrow: insufficient funding"
        );

        // Update state before transfer (CEI pattern)
        milestones[milestoneId].status = MilestoneStatus.Paid;
        studies[studyId].remainingFunding -= amount;
        participations[studyId][participant].totalEarned += amount;

        // Record payment
        paymentCounter++;
        uint256 paymentId = paymentCounter;

        payments[paymentId] = Payment({
            id: paymentId,
            studyId: studyId,
            milestoneId: milestoneId,
            participant: participant,
            amount: amount,
            token: token,
            paidAt: block.timestamp,
            txHash: bytes32(uint256(uint160(participant))) // Placeholder, would be set by monitoring system
        });

        participantPayments[participant].push(paymentId);

        // Transfer funds
        if (token == address(0)) {
            // ETH transfer
            (bool success, ) = participant.call{value: amount}("");
            require(success, "ResearchFundingEscrow: ETH transfer failed");
        } else {
            // ERC20 transfer
            IERC20(token).safeTransfer(participant, amount);
        }

        emit PaymentReleased(studyId, milestoneId, participant, amount, token);
    }

    // ============ View Functions ============

    /**
     * @notice Get study details
     * @param studyId The study ID
     * @return Study struct
     */
    function getStudy(uint256 studyId) external view studyExists(studyId) returns (Study memory) {
        return studies[studyId];
    }

    /**
     * @notice Get all milestones for a study
     * @param studyId The study ID
     * @return Array of milestone IDs
     */
    function getStudyMilestones(uint256 studyId) external view studyExists(studyId) returns (uint256[] memory) {
        return studyMilestones[studyId];
    }

    /**
     * @notice Get milestone details
     * @param milestoneId The milestone ID
     * @return Milestone struct
     */
    function getMilestone(uint256 milestoneId) external view milestoneExists(milestoneId) returns (Milestone memory) {
        return milestones[milestoneId];
    }

    /**
     * @notice Get participant's participation details
     * @param studyId The study ID
     * @param participant The participant address
     * @return Participation struct
     */
    function getParticipation(
        uint256 studyId,
        address participant
    ) external view studyExists(studyId) returns (Participation memory) {
        return participations[studyId][participant];
    }

    /**
     * @notice Get all participants in a study
     * @param studyId The study ID
     * @return Array of participant addresses
     */
    function getStudyParticipants(uint256 studyId) external view studyExists(studyId) returns (address[] memory) {
        return studyParticipants[studyId];
    }

    /**
     * @notice Get all payments for a participant
     * @param participant The participant address
     * @return Array of payment IDs
     */
    function getParticipantPayments(address participant) external view returns (uint256[] memory) {
        return participantPayments[participant];
    }

    /**
     * @notice Get payment details
     * @param paymentId The payment ID
     * @return Payment struct
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        require(paymentId > 0 && paymentId <= paymentCounter, "ResearchFundingEscrow: payment does not exist");
        return payments[paymentId];
    }

    // ============ Internal Functions ============

    /**
     * @notice Check if an address is a certified provider for a study
     * @param studyId The study ID
     * @param provider The provider address to check
     * @return bool True if certified for this study
     */
    function _isCertifiedProvider(uint256 studyId, address provider) internal view returns (bool) {
        address[] memory certifiedProviders = studies[studyId].certifiedProviders;
        for (uint256 i = 0; i < certifiedProviders.length; i++) {
            if (certifiedProviders[i] == provider) {
                return true;
            }
        }
        return false;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update provider registry address
     * @param _providerRegistry New provider registry address
     */
    function setProviderRegistry(address _providerRegistry) external onlyAdmin {
        require(_providerRegistry != address(0), "ResearchFundingEscrow: invalid address");
        providerRegistry = _providerRegistry;
    }

    /**
     * @notice Update minimum funding amount
     * @param _minFundingAmount New minimum funding amount
     */
    function setMinFundingAmount(uint256 _minFundingAmount) external onlyAdmin {
        minFundingAmount = _minFundingAmount;
    }

    /**
     * @notice Add a verifier
     * @param verifier Address to grant verifier role
     */
    function addVerifier(address verifier) external onlyAdmin {
        require(verifier != address(0), "ResearchFundingEscrow: invalid verifier address");
        grantRole(VERIFIER_ROLE, verifier);
    }

    /**
     * @notice Remove a verifier
     * @param verifier Address to revoke verifier role
     */
    function removeVerifier(address verifier) external onlyAdmin {
        revokeRole(VERIFIER_ROLE, verifier);
    }

    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal (only for stuck funds)
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    ) external onlyAdmin nonReentrant {
        require(recipient != address(0), "ResearchFundingEscrow: invalid recipient");

        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ResearchFundingEscrow: ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }
    }

    // ============ Receive ETH ============

    receive() external payable {
        // Allow contract to receive ETH for study funding
    }
}
