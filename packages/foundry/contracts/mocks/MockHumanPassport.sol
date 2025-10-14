// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockHumanPassport
 * @notice Mock implementation of Gitcoin Passport for testing
 * @dev Simulates the stamp-based scoring system of Gitcoin Passport
 *
 * Real Gitcoin Passport:
 * - Uses Verifiable Credentials (off-chain) stored on Ceramic Network
 * - Each stamp is a VC from different providers (GitHub, Discord, Government ID, etc.)
 * - Stamps have different weights contributing to overall score
 * - Score threshold: 20+ typically indicates unique human
 * - Some stamps use on-chain SBTs (HumanID: KYC, Phone, Biometrics)
 *
 * This mock:
 * - Issues one SBT per user representing their Passport
 * - Tracks stamps as bitmap for gas efficiency
 * - Calculates score from stamp weights
 * - Allows testing without full Gitcoin infrastructure
 */
contract MockHumanPassport is ERC721 {

    uint256 private _nextTokenId = 1;

    // Stamp types matching real Gitcoin Passport categories
    enum StampType {
        // Government ID & Biometrics (high weight - 15-25 points)
        GOVERNMENT_ID,        // Weight: 25 (HumanID KYC)
        BIOMETRICS,          // Weight: 20 (HumanID Biometrics)
        PHONE_VERIFICATION,  // Weight: 15 (HumanID Phone)

        // Blockchain & Crypto (medium-high weight - 5-15 points)
        ETH_ACTIVE_50_DAYS,  // Weight: 10
        ETH_GAS_SPENT,       // Weight: 8
        ENS_DOMAIN,          // Weight: 5

        // Social Media (medium weight - 3-8 points)
        GITHUB_50_FOLLOWERS, // Weight: 8
        DISCORD,             // Weight: 5
        LINKEDIN,            // Weight: 5
        GOOGLE,              // Weight: 3

        // Web3 Activity (medium weight - 5-10 points)
        GITCOIN_GRANTS,      // Weight: 10
        SNAPSHOT_VOTER,      // Weight: 5
        NFT_HOLDER,          // Weight: 5

        // Trust & Verification (high weight - 10-15 points)
        BRIGHT_ID,           // Weight: 15
        COINBASE_VERIFICATION, // Weight: 10
        CIVIC_CAPTCHA        // Weight: 8
    }

    // Stamp weights (in points)
    uint256[17] public stampWeights = [
        25, 20, 15,  // Government ID, Biometrics, Phone
        10, 8, 5,    // ETH stamps
        8, 5, 5, 3,  // Social stamps
        10, 5, 5,    // Web3 activity
        15, 10, 8    // Trust & Verification
    ];

    // User passport data
    struct PassportData {
        uint256 tokenId;
        uint256 stampsBitmap;  // Bitmap of verified stamps (gas efficient)
        uint256 score;         // Calculated score
        uint256 issuedAt;
        uint256 lastUpdated;
    }

    mapping(address => PassportData) public passports;

    event PassportIssued(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event StampAdded(address indexed user, StampType indexed stampType, uint256 newScore);
    event StampRemoved(address indexed user, StampType indexed stampType, uint256 newScore);

    constructor() ERC721("Mock Gitcoin Passport", "MGP") {}

    /**
     * @notice Issue a new passport to user (with optional initial stamps)
     * @param user User address
     * @param initialStampsBitmap Optional bitmap of initial stamps (use 0 for empty passport)
     */
    function issuePassport(address user, uint256 initialStampsBitmap) external {
        require(balanceOf(user) == 0, "User already has passport");
        require(initialStampsBitmap < (1 << 17), "Invalid stamps bitmap");

        uint256 tokenId = _nextTokenId++;
        _safeMint(user, tokenId);

        uint256 score = _calculateScore(initialStampsBitmap);

        passports[user] = PassportData({
            tokenId: tokenId,
            stampsBitmap: initialStampsBitmap,
            score: score,
            issuedAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        emit PassportIssued(user, tokenId, block.timestamp);
    }

    /**
     * @notice Add a stamp to user's passport
     * @param user User address
     * @param stampType Stamp type to add
     */
    function addStamp(address user, StampType stampType) external {
        require(balanceOf(user) > 0, "User has no passport");

        PassportData storage passport = passports[user];
        uint256 stampBit = 1 << uint256(stampType);

        require((passport.stampsBitmap & stampBit) == 0, "Stamp already exists");

        passport.stampsBitmap |= stampBit;
        passport.score = _calculateScore(passport.stampsBitmap);
        passport.lastUpdated = block.timestamp;

        emit StampAdded(user, stampType, passport.score);
    }

    /**
     * @notice Remove a stamp from user's passport (e.g., if expired or revoked)
     * @param user User address
     * @param stampType Stamp type to remove
     */
    function removeStamp(address user, StampType stampType) external {
        require(balanceOf(user) > 0, "User has no passport");

        PassportData storage passport = passports[user];
        uint256 stampBit = 1 << uint256(stampType);

        require((passport.stampsBitmap & stampBit) != 0, "Stamp does not exist");

        passport.stampsBitmap &= ~stampBit;
        passport.score = _calculateScore(passport.stampsBitmap);
        passport.lastUpdated = block.timestamp;

        emit StampRemoved(user, stampType, passport.score);
    }

    /**
     * @notice Get user's passport score
     * @param user User address
     * @return score Passport score (threshold: 20+ = likely unique human)
     */
    function getPassportScore(address user) external view returns (uint256) {
        require(balanceOf(user) > 0, "User has no passport");
        return passports[user].score;
    }

    /**
     * @notice Check if user has specific stamp
     * @param user User address
     * @param stampType Stamp type to check
     * @return hasStamp True if user has this stamp
     */
    function hasStamp(address user, StampType stampType) external view returns (bool) {
        if (balanceOf(user) == 0) return false;
        uint256 stampBit = 1 << uint256(stampType);
        return (passports[user].stampsBitmap & stampBit) != 0;
    }

    /**
     * @notice Get all stamps for a user as array of stamp types
     * @param user User address
     * @return stamps Array of StampType that user has
     */
    function getUserStamps(address user) external view returns (StampType[] memory) {
        require(balanceOf(user) > 0, "User has no passport");

        uint256 bitmap = passports[user].stampsBitmap;
        uint256 count = 0;

        // Count stamps
        for (uint256 i = 0; i < 17; i++) {
            if ((bitmap & (1 << i)) != 0) count++;
        }

        // Build array
        StampType[] memory stamps = new StampType[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < 17; i++) {
            if ((bitmap & (1 << i)) != 0) {
                stamps[index++] = StampType(i);
            }
        }

        return stamps;
    }

    /**
     * @notice Calculate score from stamps bitmap
     * @dev Internal function to sum weights of all stamps in bitmap
     */
    function _calculateScore(uint256 stampsBitmap) internal view returns (uint256) {
        uint256 score = 0;
        for (uint256 i = 0; i < 17; i++) {
            if ((stampsBitmap & (1 << i)) != 0) {
                score += stampWeights[i];
            }
        }
        return score;
    }

    /**
     * @notice Helper function to create passport with specific stamps for testing
     * @param user User address
     * @param stampTypes Array of stamp types to include
     */
    function issuePassportWithStamps(address user, StampType[] memory stampTypes) external {
        uint256 bitmap = 0;
        for (uint256 i = 0; i < stampTypes.length; i++) {
            bitmap |= (1 << uint256(stampTypes[i]));
        }
        this.issuePassport(user, bitmap);
    }
}
