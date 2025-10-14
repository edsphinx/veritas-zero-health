# 📱 VZH Mobile - Keycard NFC Wallet

**Veritas Zero Health Mobile Wallet with Status Keycard Integration**

> Hardware-backed, portable identity for healthcare with NFC tap-to-sign functionality.

---

## 🎯 Overview

VZH Mobile is a React Native mobile application that integrates **Status Keycard** (hardware wallet) with **VZH Smart Accounts** to provide a seamless, secure, and portable healthcare identity solution.

### Key Features

- ✅ **Keycard Integration**: Hardware-backed key management via NFC
- ✅ **Smart Account**: Multichain smart contract wallet (CREATE2)
- ✅ **Human Passport**: Gitcoin Passport verification
- ✅ **Health Identity SBT**: Soulbound token for medical credentials
- ✅ **Tap-to-Sign**: NFC-based transaction signing with PIN
- ✅ **Multichain**: Same address across all EVM chains
- ✅ **Offline Capable**: Keycard works without internet

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         VZH Mobile App (React Native)   │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Keycard    │◄───┤ NFC Manager  │  │
│  │   Service    │    │              │  │
│  └──────┬───────┘    └──────────────┘  │
│         │                               │
│         │ Signs Transactions            │
│         ▼                               │
│  ┌──────────────────────────────┐      │
│  │   Smart Account Service      │      │
│  │  (VZHSmartAccount Contract)  │      │
│  └──────────────┬───────────────┘      │
│                 │                       │
│                 │ Claims SBT            │
│                 ▼                       │
│  ┌──────────────────────────────┐      │
│  │  Health Identity Service     │      │
│  │  (HealthIdentitySBT Contract)│      │
│  └──────────────────────────────┘      │
└─────────────────────────────────────────┘
          │
          │ Blockchain Interaction
          ▼
┌─────────────────────────────────────────┐
│    EVM Chains (Ethereum, Celo, etc.)    │
│                                         │
│  - VZHAccountFactory (CREATE2)          │
│  - VZHSmartAccount (per user)           │
│  - HealthIdentitySBT                    │
│  - Human Passport / Gitcoin Passport    │
└─────────────────────────────────────────┘
```

---

## 🚀 User Flows

### 1. Initial Setup

```
User → Tap Keycard → Enter PIN → Derive Ethereum Address
  ↓
App → Create VZH Smart Account (via Factory)
  ↓
Smart Account Address: 0xABC...123 (same on ALL chains)
  ↓
User → Verify Human Passport (Gitcoin)
  ↓
Ready to receive Health Identity SBT
```

### 2. Login

```
User → Tap Keycard → Enter PIN
  ↓
App → Reads Keycard Address
  ↓
App → Loads Smart Account (CREATE2 prediction)
  ↓
App → Displays Dashboard (Passport Status, SBT Info)
```

### 3. Claim Health Identity SBT

```
Medical Provider → Generates signed voucher
  ↓
Provider → Shows QR Code
  ↓
User → Scans QR in app
  ↓
App → Shows transaction preview
  ↓
User → Taps Keycard → Enters PIN
  ↓
Keycard → Signs transaction
  ↓
App → Executes via Smart Account
  ↓
Smart Account → Calls HealthIdentitySBT.claimHealthIdentity()
  ↓
SBT Minted to Smart Account ✅
```

### 4. Sign Any Transaction

```
App → Builds transaction
  ↓
User → Taps Keycard → Enters PIN
  ↓
Keycard → Signs transaction
  ↓
App → Broadcasts to network
  ↓
Transaction Confirmed ✅
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React Native + TypeScript | Cross-platform mobile |
| **NFC** | `react-native-nfc-manager` | Keycard communication |
| **Keycard** | Status Keycard SDK + APDU | Hardware wallet integration |
| **Web3** | `ethers.js` | Blockchain interaction |
| **Storage** | `react-native-keychain` | Secure local storage |
| **Navigation** | `@react-navigation/native` | App navigation |
| **State** | React Context + Hooks | State management |

---

## 📦 Project Structure

```
packages/mobile/
├── src/
│   ├── screens/
│   │   ├── KeycardSetupScreen.tsx      # Initial pairing
│   │   ├── PINEntryScreen.tsx          # Secure PIN input
│   │   ├── DashboardScreen.tsx         # Main dashboard
│   │   ├── PassportScreen.tsx          # Gitcoin Passport status
│   │   ├── ScanQRScreen.tsx            # QR code scanner
│   │   └── SignTransactionScreen.tsx   # Transaction signing
│   │
│   ├── services/
│   │   ├── KeycardService.ts           # Keycard SDK wrapper
│   │   ├── NFCService.ts               # NFC communication
│   │   ├── SmartAccountService.ts      # VZH Smart Account
│   │   ├── HealthIdentityService.ts    # Health Identity SBT
│   │   ├── PassportService.ts          # Human Passport API
│   │   └── StorageService.ts           # Secure storage
│   │
│   ├── components/
│   │   ├── NFCReader.tsx               # NFC animation/feedback
│   │   ├── PINPad.tsx                  # Secure PIN entry UI
│   │   ├── TransactionPreview.tsx      # Transaction details
│   │   ├── KeycardStatus.tsx           # Connection status
│   │   └── PassportBadge.tsx           # Verification badge
│   │
│   ├── contracts/
│   │   ├── VZHAccountFactory.json      # Factory ABI
│   │   ├── VZHSmartAccount.json        # Smart Account ABI
│   │   └── HealthIdentitySBT.json      # Health SBT ABI
│   │
│   ├── utils/
│   │   ├── apdu.ts                     # APDU command builders
│   │   ├── crypto.ts                   # Cryptographic helpers
│   │   └── constants.ts                # Contract addresses, etc.
│   │
│   └── types/
│       └── index.ts                    # TypeScript types
│
├── android/                            # Android native code
├── ios/                                # iOS native code
├── assets/                             # Images, fonts
├── README.md                           # This file
├── DEV_GUIDELINES.md                   # Development guidelines
├── package.json
└── tsconfig.json
```

---

## 🎯 Human Passport Challenge Compliance

This mobile app is designed for the **Human Passport: Portable Keycard Identity** challenge.

### Challenge Requirements ✅

| Requirement | Our Implementation |
|-------------|-------------------|
| **Portable Keycard Identity** | ✅ Keycard controls VZH Smart Account multichain |
| **Remove Browser Extensions** | ✅ Native mobile app, no MetaMask needed |
| **NFC + PIN Security** | ✅ Keycard SDK with secure PIN entry |
| **Login Flow** | ✅ Tap → PIN → Load Smart Account |
| **Transaction Signing** | ✅ Tap → PIN → Sign → Execute |
| **Portability** | ✅ CREATE2 = same address all chains |
| **UX Clarity** | ✅ Simple: Tap → Enter PIN → Done |
| **Security Model** | ✅ Hardware (Keycard) + PIN + Smart Account |

### Deliverables

- [x] Demo mobile app prototype
- [x] Documentation (this README + DEV_GUIDELINES)
- [x] Security model explanation
- [ ] Demo video (5 minutes)
- [ ] UI/UX mockups

---

## 🔐 Security Model

### Multi-Layer Security

1. **Hardware Layer**: Status Keycard
   - Private keys never leave the card
   - PIN required for all operations
   - Tamper-resistant hardware

2. **PIN Protection**
   - 6-digit PIN stored on Keycard
   - Limited retry attempts
   - Keycard locks after failed attempts

3. **Smart Account Layer**
   - Social recovery (recovery address)
   - Transaction replay protection (nonces)
   - Signature verification on-chain

4. **Network Layer**
   - HTTPS for API calls
   - Encrypted RPC endpoints
   - Certificate pinning (production)

5. **Storage Layer**
   - No private keys stored on device
   - Secure Keychain for metadata
   - Encrypted preferences

---

## 🌍 Multichain Portability

### How CREATE2 Enables Portability

```solidity
// VZHAccountFactory uses CREATE2
// Same factory address on all chains
Factory Address: 0xFACT...ORY

// User with Keycard address: 0xKEY...CARD
// Salt: 12345

Predicted Smart Account:
- Ethereum:  0xABC...123
- Polygon:   0xABC...123  ← SAME!
- Arbitrum:  0xABC...123  ← SAME!
- Celo:      0xABC...123  ← SAME!
- Base:      0xABC...123  ← SAME!
```

### Benefits

- ✅ One identity across all chains
- ✅ No re-setup on new chains
- ✅ Consistent addresses for medical records
- ✅ Simplified UX (users don't think about chains)

---

## 🔄 Future Enhancements

### Phase 1 (Current)
- [x] Keycard pairing
- [x] NFC communication
- [x] Smart Account creation
- [x] Transaction signing
- [ ] QR code scanning
- [ ] Health Identity claiming

### Phase 2 (Next)
- [ ] Biometric authentication (Face/Touch ID)
- [ ] Gas abstraction (Paymaster)
- [ ] Multiple Keycard support
- [ ] Backup/recovery flows
- [ ] Transaction history

### Phase 3 (Future)
- [ ] Multi-signature support
- [ ] DeFi integrations
- [ ] NFT gallery
- [ ] Medical record viewer
- [ ] Telemedicine integration

---

## 📄 Related Documentation

- [DEV_GUIDELINES.md](./DEV_GUIDELINES.md) - Technical comparison and development guide
- [../../.private/development/TODO.md](../../.private/development/TODO.md) - Project TODO
- [../foundry/contracts/VZHSmartAccount.sol](../foundry/contracts/VZHSmartAccount.sol) - Smart Account contract
- [../foundry/contracts/VZHAccountFactory.sol](../foundry/contracts/VZHAccountFactory.sol) - Factory contract

---

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd packages/mobile

# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..

# Run
npm run ios     # iOS simulator
npm run android # Android emulator
```

---

## 📜 License

MIT License - Veritas Zero Health Team

---

## 🎬 Demo Video

> Coming soon: 5-minute demo showing Keycard integration and tap-to-sign flow

---

## 📞 Contact

For questions about this mobile implementation, see main project README.
