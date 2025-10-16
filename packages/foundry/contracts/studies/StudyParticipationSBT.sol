// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { IStudyEnrollmentData } from "./IStudyEnrollmentData.sol";
import { IStudyParticipationSBT } from "./IStudyParticipationSBT.sol";

/**
 * @title StudyParticipationSBT
 * @author edsphinx
 * @notice Mints Study Participation Soulbound Tokens (SBTs) representing verified
 * participant enrollment in scientific research studies.
 * @dev Inherits from ERC721 and Ownable. It is responsible for minting and enforcing the
 * non-transferable (Soulbound) nature of the tokens. It delegates the storage of dynamic
 * enrollment data (like compliance levels) to the StudyEnrollmentData contract.
 */
contract StudyParticipationSBT is ERC721, Ownable, IStudyParticipationSBT {
    // --- State Variables ---
    uint256 private _nextTokenId;
    uint256 private _nextEnrollmentId;

    // Public state variables (part of the interface)
    mapping(address => mapping(address => bool)) public override enrollmentExists;
    mapping(uint256 => uint256) public override tokenToEnrollmentId;

    mapping(address => uint256[]) private _userTokens;
    mapping(uint256 => uint256) private _tokenIndex;

    /**
     * @notice The address of the EnrollmentData contract, which stores details for each enrollment.
     */
    IStudyEnrollmentData public override enrollmentDataContract;

    // --- Constructor ---
    constructor() ERC721("Study Participation Certificate", "SPC") Ownable(msg.sender) {}

    // --- Admin Functions ---

    /**
     * @inheritdoc IStudyParticipationSBT
     */
    function setEnrollmentDataContract(address _contractAddress) public override onlyOwner {
        enrollmentDataContract = IStudyEnrollmentData(_contractAddress);
    }

    // --- Core Functions ---

    /**
     * @inheritdoc IStudyParticipationSBT
     */
    function enrollParticipant(address _participant, address _institution, string memory _locationHint) public override onlyOwner {
        require(address(enrollmentDataContract) != address(0), "EnrollmentData contract not set");
        require(!enrollmentExists[_participant][_institution] && !enrollmentExists[_institution][_participant], "Enrollment already exists");

        uint256 participantTokenId = _nextTokenId++;
        uint256 institutionTokenId = _nextTokenId++;
        uint256 newEnrollmentId = _nextEnrollmentId++;

        tokenToEnrollmentId[participantTokenId] = newEnrollmentId;
        tokenToEnrollmentId[institutionTokenId] = newEnrollmentId;
        enrollmentExists[_participant][_institution] = true;

        _safeMint(_participant, participantTokenId);
        _safeMint(_institution, institutionTokenId);

        enrollmentDataContract.createEnrollmentEntry(newEnrollmentId, _participant, _institution, _locationHint);

        emit ParticipantEnrolled(newEnrollmentId, participantTokenId, institutionTokenId, _participant, _institution);
    }

    /**
     * @inheritdoc IStudyParticipationSBT
     */
    function getTokensOfOwner(address owner) public view override returns (uint256[] memory) {
        return _userTokens[owner];
    }

    // --- Soulbound Logic ---

    /**
     * @dev Overridden to enforce Soulbound (non-transferable) logic. Always reverts.
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("This is a Soulbound Token and cannot be transferred");
    }

    /**
     * @dev Overridden to enforce Soulbound (non-transferable) logic. Always reverts.
     */
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("This is a Soulbound Token and cannot be transferred");
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
