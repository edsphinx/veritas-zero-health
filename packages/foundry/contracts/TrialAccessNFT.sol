// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Experience NFT
 * @author edsphinx
 * @notice A contract for tokenizing real-world services as NFT vouchers.
 * @dev In the DeSci context, this allows a sponsor (e.g., a research DAO or biotech company)
 * to tokenize patient access to a clinical trial as an RWA NFT. The contract owner (the sponsor)
 * is the only entity that can mint new access tokens.
 */
contract ExperienceNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Mapping to store the URI for each specific token.
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {}

    /**
     * @dev Returns the URI for a specific token.
     * @param tokenId The ID of the token to query.
     * @return The URI string of the token's metadata.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Asegura que el token exista
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Mints a new trial access NFT and assigns it to a patient.
     * @param to The patient's address that will receive the access NFT.
     * @param _tokenURI The metadata URI that describes the trial and its terms.
     */
    function mintExperience(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = _tokenURI;
        return tokenId;
    }
}
