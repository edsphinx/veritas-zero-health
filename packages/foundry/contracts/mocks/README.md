# MockHumanPassport - Testing Guide

## 🎯 Purpose

Mock implementation of **Gitcoin Passport** for testing the HealthIdentitySBT system without requiring full Gitcoin infrastructure.

## 📚 Understanding Gitcoin Passport

### Real Gitcoin Passport System

**What it is:**
- Identity verification aggregator proving "Unique Humanity"
- Uses **Verifiable Credentials** (W3C standard) stored off-chain on Ceramic Network
- Collection of **stamps** from various platforms (GitHub, Discord, Government ID, etc.)
- Each stamp has a **weight** contributing to total score
- **Score threshold**: 20+ typically indicates unique human

**How it works:**
1. User connects to various platforms (GitHub, Twitter, Discord, etc.)
2. Each platform verifies user data and issues a **stamp** (Verifiable Credential)
3. Stamps are stored in user's Gitcoin Passport (off-chain)
4. Score calculated from sum of stamp weights
5. Applications check score to verify humanness

**Stamp Categories:**
- **Government ID & Biometrics**: Highest weight (15-25 points)
  - HumanID KYC (Government ID)
  - HumanID Biometrics
  - HumanID Phone Verification
- **Blockchain Activity**: Medium-high weight (5-15 points)
  - ETH wallet activity
  - ENS domain ownership
  - NFT holdings
- **Social Media**: Medium weight (3-8 points)
  - GitHub followers/activity
  - Discord membership
  - LinkedIn profile
  - Google account
- **Web3 Activity**: Medium weight (5-10 points)
  - Gitcoin Grants participation
  - Snapshot voting
  - NFT collections
- **Trust & Verification**: High weight (8-15 points)
  - BrightID verification
  - Coinbase verification
  - Civic liveness checks

## 🏗️ Mock Implementation

### Architecture

```solidity
contract MockHumanPassport is ERC721 {
    // Issues one SBT per user representing their Passport
    // Tracks stamps as bitmap (gas efficient)
    // Automatically calculates score from stamps
}
```

**Key Differences from Real System:**
| Feature | Real Gitcoin Passport | MockHumanPassport |
|---------|----------------------|-------------------|
| Storage | Off-chain (Ceramic) | On-chain (bitmap) |
| Token | No on-chain token | ERC721 SBT |
| Stamps | VCs with signatures | Enum in bitmap |
| Score API | External scorer API | Calculated on-chain |
| Verification | Multi-platform OAuth | Simulated |

**Advantages for Testing:**
- ✅ No external dependencies
- ✅ Instant stamp issuance
- ✅ Deterministic scoring
- ✅ Easy to test different scenarios
- ✅ Gas-efficient bitmap storage

### Stamp Types and Weights

```solidity
enum StampType {
    // Government ID & Biometrics (15-25 pts)
    GOVERNMENT_ID,        // 25 points
    BIOMETRICS,          // 20 points
    PHONE_VERIFICATION,  // 15 points

    // Blockchain & Crypto (5-15 pts)
    ETH_ACTIVE_50_DAYS,  // 10 points
    ETH_GAS_SPENT,       // 8 points
    ENS_DOMAIN,          // 5 points

    // Social Media (3-8 pts)
    GITHUB_50_FOLLOWERS, // 8 points
    DISCORD,             // 5 points
    LINKEDIN,            // 5 points
    GOOGLE,              // 3 points

    // Web3 Activity (5-10 pts)
    GITCOIN_GRANTS,      // 10 points
    SNAPSHOT_VOTER,      // 5 points
    NFT_HOLDER,          // 5 points

    // Trust & Verification (8-15 pts)
    BRIGHT_ID,           // 15 points
    COINBASE_VERIFICATION, // 10 points
    CIVIC_CAPTCHA        // 8 points
}
```

## 🚀 Usage Examples

### Deploy with Test Data

```bash
# Deploy with 2 pre-configured test users
forge script script/DeployHealthIdentityWithMock.s.sol --broadcast

# Test users created:
# User 1: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Score: 78)
# User 2: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Score: 28)
```

### Issue Passport with Specific Stamps

```bash
# Method 1: Using bitmap
# Bitmap: bit 0 = GOVERNMENT_ID, bit 1 = BIOMETRICS, etc.
# Example: 0b111 = GOVERNMENT_ID + BIOMETRICS + PHONE_VERIFICATION
cast send $MOCK_PASSPORT \
  "issuePassport(address,uint256)" \
  $USER_ADDRESS \
  7  # Binary: 0b111 = stamps 0, 1, 2

# Method 2: Using helper function (easier)
# Pass array of StampType enum values
cast send $MOCK_PASSPORT \
  "issuePassportWithStamps(address,uint8[])" \
  $USER_ADDRESS \
  "[0,1,2,14]"  # GOV_ID, BIOMETRICS, PHONE, BRIGHT_ID
```

### Add Stamps to Existing Passport

```bash
# Add GITHUB_50_FOLLOWERS stamp (index 6, 8 points)
cast send $MOCK_PASSPORT \
  "addStamp(address,uint8)" \
  $USER_ADDRESS \
  6

# Add multiple stamps (call multiple times or create batch function)
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 3  # ETH_ACTIVE
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 7  # DISCORD
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 11 # GITCOIN_GRANTS
```

### Remove Stamps (Simulate Expiration)

```bash
# Remove PHONE_VERIFICATION stamp (index 2)
cast send $MOCK_PASSPORT \
  "removeStamp(address,uint8)" \
  $USER_ADDRESS \
  2
```

### Query Passport Data

```bash
# Get total score
cast call $MOCK_PASSPORT \
  "getPassportScore(address)" \
  $USER_ADDRESS
# Returns: 78

# Check if user has specific stamp
cast call $MOCK_PASSPORT \
  "hasStamp(address,uint8)" \
  $USER_ADDRESS \
  0  # Check for GOVERNMENT_ID
# Returns: true

# Get all user's stamps
cast call $MOCK_PASSPORT \
  "getUserStamps(address)" \
  $USER_ADDRESS
# Returns: [0, 1, 2, 3, 6]
# (GOVERNMENT_ID, BIOMETRICS, PHONE_VERIFICATION, ETH_ACTIVE_50_DAYS, GITHUB_50_FOLLOWERS)

# Get passport data
cast call $MOCK_PASSPORT \
  "passports(address)" \
  $USER_ADDRESS
# Returns: (tokenId, stampsBitmap, score, issuedAt, lastUpdated)
```

## 🧪 Testing Scenarios

### Scenario 1: High-Trust User (Score: 93)

```bash
# Create passport with maximum trust stamps
cast send $MOCK_PASSPORT \
  "issuePassportWithStamps(address,uint8[])" \
  $USER \
  "[0,1,2,14]"
  # GOV_ID(25) + BIOMETRICS(20) + PHONE(15) + BRIGHT_ID(15) = 75

# Add more stamps
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 3   # ETH_ACTIVE(10)
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 6   # GITHUB(8)
# Total: 75 + 10 + 8 = 93
```

### Scenario 2: Medium-Trust User (Score: 28)

```bash
# Social + Web3 user
cast send $MOCK_PASSPORT \
  "issuePassportWithStamps(address,uint8[])" \
  $USER \
  "[2,7,9,12]"
  # PHONE(15) + DISCORD(5) + GOOGLE(3) + NFT(5) = 28
```

### Scenario 3: Low-Trust User (Score: 13 - Below Threshold)

```bash
# Only basic social stamps
cast send $MOCK_PASSPORT \
  "issuePassportWithStamps(address,uint8[])" \
  $USER \
  "[7,8,9]"
  # DISCORD(5) + LINKEDIN(5) + GOOGLE(3) = 13
  # Below 20 threshold!
```

### Scenario 4: Dynamic Stamp Management

```bash
# Start with basic passport
cast send $MOCK_PASSPORT \
  "issuePassport(address,uint256)" \
  $USER \
  0  # Empty passport

# Gradually add stamps (simulating user verification journey)
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 9   # GOOGLE(3)
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 7   # DISCORD(5)
cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 6   # GITHUB(8)
# Score now: 16 (below threshold)

cast send $MOCK_PASSPORT "addStamp(address,uint8)" $USER 2   # PHONE(15)
# Score now: 31 (above threshold!)

# Later: Phone verification expires
cast send $MOCK_PASSPORT "removeStamp(address,uint8)" $USER 2
# Score back to: 16 (below threshold again)
```

## 🔗 Integration with HealthIdentitySBT

```solidity
// HealthIdentitySBT requires score >= 50
function createHealthIdentity(address user, string memory nillionDID)
    external
    onlyOwner
    hasHumanPassport(user)  // Checks balanceOf(user) > 0
{
    uint256 score = humanPassport.getPassportScore(user);
    require(score >= 50, "Passport score too low");
    // ... mint Health Identity SBT
}
```

**Test user scores for Health Identity:**
```bash
# User 1: Score 78 ✅ (Can create Health Identity)
cast send $HEALTH_IDENTITY \
  "createHealthIdentity(address,string)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  "did:veritas:user1"

# User 2: Score 28 ❌ (Cannot create - score too low)
cast send $HEALTH_IDENTITY \
  "createHealthIdentity(address,string)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  "did:veritas:user2"
# Error: "Passport score too low"

# Boost User 2's score
cast send $MOCK_PASSPORT "addStamp(address,uint8)" 0x7099... 0  # GOV_ID(25)
# New score: 28 + 25 = 53 ✅

# Now can create Health Identity
cast send $HEALTH_IDENTITY \
  "createHealthIdentity(address,string)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  "did:veritas:user2"
```

## 📊 Stamp Combinations for Testing

### Minimum Viable (Score: 20+)
- `PHONE_VERIFICATION` (15) + `DISCORD` (5) = **20** ✅

### Social User (Score: 21)
- `GITHUB_50_FOLLOWERS` (8) + `DISCORD` (5) + `LINKEDIN` (5) + `GOOGLE` (3) = **21** ✅

### Blockchain User (Score: 23)
- `ETH_ACTIVE_50_DAYS` (10) + `ETH_GAS_SPENT` (8) + `ENS_DOMAIN` (5) = **23** ✅

### Verified Human (Score: 60)
- `GOVERNMENT_ID` (25) + `BIOMETRICS` (20) + `PHONE_VERIFICATION` (15) = **60** ✅

### Power User (Score: 100+)
- All high-value stamps = **143** ✅

## 🔧 Advanced Usage

### Custom Stamp Weights

If you need to modify stamp weights for testing:

```solidity
// In your test file
function setUp() public {
    mockPassport = new MockHumanPassport();

    // Weights are public, can be read but not modified
    // To change weights, deploy custom version or fork contract
}
```

### Bitmap Calculation

```javascript
// Calculate bitmap manually
const stamps = [0, 1, 2, 14]; // GOV_ID, BIOMETRICS, PHONE, BRIGHT_ID
const bitmap = stamps.reduce((acc, stamp) => acc | (1 << stamp), 0);
console.log(bitmap); // 16391 (binary: 0b100000000000111)

// Or in Solidity
uint256 bitmap = (1 << 0) | (1 << 1) | (1 << 2) | (1 << 14);
```

## 🌐 Production Integration

When moving to production, replace MockHumanPassport with:

1. **Gitcoin Passport Scorer API**:
   - Fetch user score via API: `https://api.scorer.gitcoin.co/`
   - Check stamps via passport API
   - No on-chain verification needed (off-chain VCs)

2. **Custom On-Chain Verifier**:
   - If Gitcoin creates on-chain attestation contracts
   - Or implement EAS integration for Gitcoin stamps
   - Use real contract address in deployment

3. **Holonym SBTs (Partial)**:
   - For Government ID, Biometrics, Phone stamps
   - Use `@holonym-foundation/human-id-sdk`
   - Check SBTs on-chain (Optimism)

## 📖 References

- [Gitcoin Passport](https://passport.gitcoin.co/)
- [Gitcoin Passport Docs](https://support.passport.xyz/passport-knowledge-base)
- [Holonym Foundation](https://www.holonym.id/)
- [Verifiable Credentials W3C](https://www.w3.org/TR/vc-data-model/)
