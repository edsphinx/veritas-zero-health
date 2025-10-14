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
    IStudyEnrollmentData public matchDataContract;
    mapping(uint256 => address) public matchIdToVault;

    event VaultCreated(uint256 indexed matchId, address vaultAddress, address indexed creator);

    constructor(address _matchDataAddress) {
        matchDataContract = IStudyEnrollmentData(_matchDataAddress);
    }

    /**
     * @notice Creates a Commitment Vault for a specific on-chain interaction.
     * @dev Verifies that the interaction's compliance level is 2 or higher.
     * The caller must be a participant in the interaction and the owner of the RWA NFT.
     * @param _matchId The ID of the on-chain interaction (e.g., a verified clinical visit).
     * @param _experienceNFTAddress The address of the RWA NFT contract (e.g., Trial Access Token).
     * @param _experienceTokenId The ID of the specific RWA NFT to be escrowed.
     */
    function createCommitmentVault(
        uint256 _matchId,
        address _experienceNFTAddress,
        uint256 _experienceTokenId
    ) external {
        // --- Security Checks ---
        require(matchIdToVault[_matchId] == address(0), "Vault already exists for this match");

        IStudyEnrollmentData.Match memory currentMatch = matchDataContract.getMatchDetails(_matchId);
        require(currentMatch.timestamp != 0, "Match does not exist");
        require(currentMatch.level >= 2, "Match level must be 2 or higher");

        address userA = msg.sender;
        address userB;
        if (userA == currentMatch.userA) {
            userB = currentMatch.userB;
        } else if (userA == currentMatch.userB) {
            userB = currentMatch.userA;
        } else {
            revert("You are not part of this match");
        }

        // --- Creation and Transfer ---
        CommitmentVault newVault = new CommitmentVault(userA, userB, _experienceNFTAddress, _experienceTokenId);
        matchIdToVault[_matchId] = address(newVault);

        // Transfers the RWA NFT from the user to the newly created vault.
        IERC721(_experienceNFTAddress).safeTransferFrom(msg.sender, address(newVault), _experienceTokenId);

        emit VaultCreated(_matchId, address(newVault), msg.sender);
    }
}
