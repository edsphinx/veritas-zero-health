// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";
import { IStudyParticipationSBT } from "./IStudyParticipationSBT.sol";

/**
 * @title Proof of Match (PoM)
 * @author edsphinx
 * @notice Mints "Proof of Protocol" Soulbound Tokens (SBTs) representing a verified,
 * real-world interaction within a scientific protocol. This is the core token registry.
 * @dev Inherits from ERC721 and Ownable. It is responsible for minting and enforcing the
 * non-transferable (Soulbound) nature of the tokens. It delegates the storage of dynamic
 * interaction data (like compliance levels) to a MatchData contract.
 */
contract ProofOfMatch is ERC721, Ownable, IStudyParticipationSBT {
    // --- State Variables ---
    uint256 private _nextTokenId;
    uint256 private _nextMatchId;
    mapping(address => mapping(address => bool)) public matchExists;
    mapping(uint256 => uint256) public tokenToMatchId;

    mapping(address => uint256[]) private _userTokens;
    mapping(uint256 => uint256) private _tokenIndex;

    /**
     * @notice The address of the MatchData contract, which stores details for each interaction.
     */
    IStudyEnrollmentData public matchDataContract;

    // --- Constructor ---
    constructor() ERC721("Proof of Match", "MATCH") Ownable(msg.sender) {}

    // --- Admin Functions ---

    /**
     * @notice Sets the address of the MatchData data contract.
     * @dev Must be called by the owner before any interactions can be created.
     * @param _contractAddress The address of the deployed MatchData contract.
     */
    function setMatchDataContract(address _contractAddress) public onlyOwner {
        matchDataContract = IStudyEnrollmentData(_contractAddress);
    }

    // --- Core Functions ---

    /**
     * @notice Creates a new on-chain record of an interaction, minting one SBT for each participant.
     * @dev Calls the MatchData contract to create the corresponding data entry.
     * Can only be called by the owner (backend/oracle).
     * @param _userA The address of the first participant (e.g., patient).
     * @param _userB The address of the second participant (e.g., clinic).
     * @param _locationHint A hint describing the interaction (e.g., "Week 4 Check-in").
     */
    function createMatch(address _userA, address _userB, string memory _locationHint) public onlyOwner {
        require(address(matchDataContract) != address(0), "MatchData contract not set");
        require(!matchExists[_userA][_userB] && !matchExists[_userB][_userA], "El match ya existe");

        uint256 tokenIdA = _nextTokenId++;
        uint256 tokenIdB = _nextTokenId++;
        uint256 newMatchId = _nextMatchId++;

        tokenToMatchId[tokenIdA] = newMatchId;
        tokenToMatchId[tokenIdB] = newMatchId;
        matchExists[_userA][_userB] = true;

        _safeMint(_userA, tokenIdA);
        _safeMint(_userB, tokenIdB);

        matchDataContract.createMatchEntry(newMatchId, _userA, _userB, _locationHint);

        emit MatchCreated(newMatchId, tokenIdA, tokenIdB, _userA, _userB);
    }

    /**
     * @inheritdoc IStudyParticipationSBT
     */
    function getTokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _userTokens[owner];
    }

    // --- Soulbound Logic ---

    /**
     * @dev Overridden to enforce Soulbound (non-transferable) logic. Always reverts.
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Este es un Token Soulbound y no se puede transferir.");
    }

    /**
     * @dev Overridden to enforce Soulbound (non-transferable) logic. Always reverts.
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Este es un Token Soulbound y no se puede transferir.");
    }

    // --- Internal Functions ---

    /**
     * @dev Overridden from ERC721 to enable tracking of tokens owned by each address.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        super._update(to, tokenId, auth);

        if (from != address(0)) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to != address(0)) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
        return from;
    }

    /**
     * @dev Internal logic to add a token to an owner's array for enumeration.
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _tokenIndex[tokenId] = _userTokens[to].length;
        _userTokens[to].push(tokenId);
    }

    /**
     * @dev Internal logic to efficiently remove a token from an owner's array (swap-and-pop).
     */
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _userTokens[from].length - 1;
        uint256 tokenIndex = _tokenIndex[tokenId];
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _userTokens[from][lastTokenIndex];
            _userTokens[from][tokenIndex] = lastTokenId;
            _tokenIndex[lastTokenId] = tokenIndex;
        }
        _userTokens[from].pop();
        delete _tokenIndex[tokenId];
    }
}
