// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Commitment Vault
 * @author edsphinx
 * @notice A secure escrow for a Real-World Asset (RWA) NFT.
 * @dev This contract acts as a two-party escrow for an RWA NFT, such as a tokenized
 * patient access voucher for a clinical trial. It ensures that the asset can only be
 * redeemed or returned with the mutual consent of both participants (e.g., patient and clinic).
 */
contract CommitmentVault is ERC721Holder {
    address public immutable userA; // The user who creates the commitment (e.g., the patient or sponsor).
    address public immutable userB; // The second party to the commitment (e.g., the clinic or researcher).
    address public immutable experienceNFTAddress; // The second party to the commitment (e.g., the clinic or researcher).
    uint256 public immutable experienceTokenId; // The ID of the specific RWA NFT being escrowed.

    bool public isRedeemed;
    bool public isDissolved;

    mapping(address => bool) public redemptionApprovals;
    mapping(address => bool) public dissolutionApprovals;

    event Redeemed(address indexed redeemedBy);
    event Dissolved(address indexed returnedTo);

    modifier onlyParticipants() {
        require(msg.sender == userA || msg.sender == userB, "Not a participant");
        _;
    }

    constructor(address _userA, address _userB, address _nftAddress, uint256 _tokenId) {
        userA = _userA;
        userB = _userB;
        experienceNFTAddress = _nftAddress;
        experienceTokenId = _tokenId;
    }

    /**
     * @notice Allows a participant to approve the redemption of the experience NFT.
     */
    function approveRedemption() external onlyParticipants {
        redemptionApprovals[msg.sender] = true;
    }

    /**
     * @notice Redeems the experience if both participants have approved.
     * @dev Transfers the RWA NFT to the caller (`msg.sender`) upon successful execution.
     */
    function executeRedemption() external onlyParticipants {
        require(redemptionApprovals[userA] && redemptionApprovals[userB], "Both must approve");
        require(!isRedeemed && !isDissolved, "Vault is settled");
        isRedeemed = true;
        IERC721(experienceNFTAddress).safeTransferFrom(address(this), msg.sender, experienceTokenId);
        emit Redeemed(msg.sender);
    }

    /**
     * @notice Allows a participant to approve the dissolution of the commitment.
     */
    function approveDissolution() external onlyParticipants {
        dissolutionApprovals[msg.sender] = true;
    }

    /**
     * @notice Dissolves the commitment and returns the RWA NFT to the original creator (userA).
     * @dev Requires approval from both participants before execution.
     */
    function executeDissolution() external onlyParticipants {
        require(dissolutionApprovals[userA] && dissolutionApprovals[userB], "Both must approve");
        require(!isRedeemed && !isDissolved, "Vault is settled");
        isDissolved = true;
        IERC721(experienceNFTAddress).safeTransferFrom(address(this), userA, experienceTokenId);
        emit Dissolved(userA);
    }
}
