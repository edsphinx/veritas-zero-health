// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStudyEnrollmentData } from "../studies/IStudyEnrollmentData.sol";
import { CommitmentVault } from "./CommitmentVault.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Commitment Vault Factory
 * @author edsphinx
 * @notice A factory contract that allows participants to create their own Commitment Vaults.
 * @dev This contract creates individual escrow vaults (`CommitmentVault`) for securing
 * RWA NFTs, such as tokenized access to clinical trials.
 */
contract CommitmentVaultFactory {
    IStudyEnrollmentData public enrollmentDataContract;
    mapping(uint256 => address) public enrollmentIdToVault;

    event VaultCreated(uint256 indexed enrollmentId, address vaultAddress, address indexed creator);

    constructor(address _enrollmentDataAddress) {
        enrollmentDataContract = IStudyEnrollmentData(_enrollmentDataAddress);
    }

    /**
     * @notice Creates a Commitment Vault for a specific study enrollment.
     * @dev Verifies that the enrollment's compliance level is 2 or higher.
     * The caller must be a participant in the enrollment and the owner of the RWA NFT.
     * @param _enrollmentId The ID of the study enrollment (e.g., a verified clinical visit).
     * @param _experienceNFTAddress The address of the RWA NFT contract (e.g., Trial Access Token).
     * @param _experienceTokenId The ID of the specific RWA NFT to be escrowed.
     */
    function createCommitmentVault(
        uint256 _enrollmentId,
        address _experienceNFTAddress,
        uint256 _experienceTokenId
    ) external {
        // --- Security Checks ---
        require(enrollmentIdToVault[_enrollmentId] == address(0), "Vault already exists for this enrollment");

        IStudyEnrollmentData.Enrollment memory enrollment = enrollmentDataContract.getEnrollmentDetails(_enrollmentId);
        require(enrollment.timestamp != 0, "Enrollment does not exist");
        require(enrollment.complianceLevel >= 2, "Compliance level must be 2 or higher");

        address participant = msg.sender;
        address counterparty;
        if (participant == enrollment.participant) {
            counterparty = enrollment.institution;
        } else if (participant == enrollment.institution) {
            counterparty = enrollment.participant;
        } else {
            revert("You are not part of this enrollment");
        }

        // --- Creation and Transfer ---
        CommitmentVault newVault = new CommitmentVault(participant, counterparty, _experienceNFTAddress, _experienceTokenId);
        enrollmentIdToVault[_enrollmentId] = address(newVault);

        // Transfers the RWA NFT from the participant to the newly created vault.
        IERC721(_experienceNFTAddress).safeTransferFrom(msg.sender, address(newVault), _experienceTokenId);

        emit VaultCreated(_enrollmentId, address(newVault), msg.sender);
    }
}
