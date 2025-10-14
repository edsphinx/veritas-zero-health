# 🛠️ VZH Mobile - Development Guidelines

**Technical decisions, architecture patterns, and development best practices**

---

## 📊 Framework Decision: React Native vs Flutter

### Executive Summary

**Decision: React Native + TypeScript**

**Reasoning:**
- Superior Web3/Ethereum ecosystem
- Better Keycard integration examples
- Code sharing with existing VZH web dApp
- Faster development for crypto-specific features
- Larger crypto developer community

### Detailed Comparison

| Criterion | React Native | Flutter | Winner |
|-----------|--------------|---------|---------|
| **Keycard SDK** | ⚠️ Limited but usable | ⚠️ No official support | 🟡 Tie |
| **NFC Support** | ✅ `react-native-nfc-manager` (mature) | ✅ `flutter_nfc_kit` (good) | 🟢 React Native |
| **Web3/Ethereum** | ✅ `ethers.js`, `web3.js` native | ⚠️ `web3dart` (limited) | 🟢 React Native |
| **Development Speed** | ✅ If you know TypeScript | ✅ If you know Dart | 🟡 Tie |
| **Performance** | 🟡 Good (JS bridge) | ✅ Excellent (native) | 🟢 Flutter |
| **Crypto Community** | ✅ Very large | 🟡 Growing | 🟢 React Native |
| **Hot Reload** | ✅ Yes | ✅ Yes (better) | 🟢 Flutter |
| **APK Size** | 🟡 ~20MB | ✅ ~15MB | 🟢 Flutter |
| **Code Reuse** | ✅ Share with web dApp | ⚠️ Separate codebase | 🟢 React Native |

### When React Native is Better

✅ **Use React Native if:**
- You need deep Ethereum/Web3 integration
- You want to reuse code from web dApp
- You need access to ALL crypto libraries
- Team knows TypeScript/JavaScript
- You want faster time-to-market for crypto features

### When Flutter is Better

✅ **Use Flutter if:**
- Performance is critical (60fps animations)
- You want pixel-perfect UI consistency
- You're building primarily native features
- You prefer Dart over TypeScript
- You prioritize UI polish over ecosystem

### Our Choice: React Native

For **VZH Keycard integration**, React Native wins because:

1. **Ethereum Integration**: `ethers.js` works out-of-the-box
2. **Smart Contract ABIs**: Already in TypeScript
3. **Community Examples**: More Keycard + crypto examples
4. **Code Sharing**: Reuse logic from web extension
5. **Developer Experience**: Existing team expertise

---

## 🏗️ Architecture Patterns

### Clean Architecture Layers

```
┌────────────────────────────────────┐
│         Presentation Layer         │
│  (Screens, Components, UI Logic)   │
└──────────────┬─────────────────────┘
               │
┌──────────────▼─────────────────────┐
│         Application Layer          │
│   (Use Cases, Business Logic)      │
└──────────────┬─────────────────────┘
               │
┌──────────────▼─────────────────────┐
│          Domain Layer              │
│    (Entities, Interfaces)          │
└──────────────┬─────────────────────┘
               │
┌──────────────▼─────────────────────┐
│      Infrastructure Layer          │
│ (Services, APIs, Smart Contracts)  │
└────────────────────────────────────┘
```

### Service Pattern

Each external integration has a dedicated service:

```typescript
// KeycardService - Hardware wallet integration
class KeycardService {
  async initialize(): Promise<void>
  async pairKeycard(pairingCode: string): Promise<void>
  async getAddress(pin: string): Promise<string>
  async signTransaction(tx: Transaction, pin: string): Promise<string>
}

// SmartAccountService - Smart contract interaction
class SmartAccountService {
  async getOrCreateAccount(owner: string): Promise<string>
  async execute(target: string, data: string): Promise<TransactionReceipt>
  async claimHealthIdentity(voucher: Voucher): Promise<string>
}

// PassportService - Gitcoin Passport API
class PassportService {
  async getScore(address: string): Promise<number>
  async verifyEligibility(address: string): Promise<boolean>
}
```

### State Management

**Pattern: React Context + Hooks**

```typescript
// contexts/KeycardContext.tsx
interface KeycardContextType {
  isConnected: boolean;
  keycardAddress: string | null;
  connect: (pin: string) => Promise<void>;
  sign: (tx: Transaction, pin: string) => Promise<string>;
}

// Usage in components
const { isConnected, keycardAddress, connect, sign } = useKeycard();
```

**Why not Redux/MobX?**
- App state is relatively simple
- Context API is sufficient
- Less boilerplate
- Better TypeScript integration

---

## 🔐 Security Best Practices

### 1. PIN Handling

```typescript
// ❌ NEVER store PIN
const pin = await askUserForPIN();
// Use immediately
await keycard.sign(tx, pin);
// Discard
```

```typescript
// ✅ Use secure input
<PINInput
  secureTextEntry
  autoComplete="off"
  keyboardType="number-pad"
  maxLength={6}
/>
```

### 2. Keycard Communication

```typescript
// ✅ Always verify responses
const response = await keycard.sendAPDU(command);
if (!response.isSuccess()) {
  throw new KeycardError(response.errorCode);
}
```

### 3. Transaction Signing

```typescript
// ✅ Show full transaction details before signing
const showTransactionPreview = (tx: Transaction) => {
  return (
    <View>
      <Text>To: {tx.to}</Text>
      <Text>Value: {formatEther(tx.value)} ETH</Text>
      <Text>Data: {tx.data.substring(0, 20)}...</Text>
      <Text>Gas: {tx.gasLimit}</Text>
    </View>
  );
};
```

### 4. Secure Storage

```typescript
// ✅ Use react-native-keychain
import * as Keychain from 'react-native-keychain';

// Store
await Keychain.setGenericPassword(
  'smartAccountAddress',
  address,
  { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
);

// Retrieve
const credentials = await Keychain.getGenericPassword();
```

### 5. Network Security

```typescript
// ✅ Use HTTPS only
const RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/...';

// ✅ Validate SSL certificates (production)
fetch(url, {
  // SSL pinning in production
});
```

---

## 📱 NFC Integration

### Keycard APDU Commands

```typescript
// APDU Command structure
interface APDUCommand {
  cla: number;  // Class byte
  ins: number;  // Instruction byte
  p1: number;   // Parameter 1
  p2: number;   // Parameter 2
  data?: Buffer; // Command data
}

// Example: SELECT command
const SELECT_APPLET: APDUCommand = {
  cla: 0x00,
  ins: 0xA4,
  p1: 0x04,
  p2: 0x00,
  data: Buffer.from('A0000008040001', 'hex')
};
```

### NFC Session Handling

```typescript
// ✅ Proper session management
const executeKeycardCommand = async (command: APDUCommand) => {
  try {
    // Start NFC session
    await NfcManager.requestTechnology(NfcTech.IsoDep);

    // Send command
    const response = await NfcManager.transceive(command);

    // Parse response
    return parseAPDUResponse(response);
  } catch (error) {
    handleNFCError(error);
  } finally {
    // Always end session
    await NfcManager.cancelTechnologyRequest();
  }
};
```

### Error Handling

```typescript
enum KeycardError {
  NOT_FOUND = 'Keycard not found',
  WRONG_PIN = 'Incorrect PIN',
  PIN_LOCKED = 'PIN locked after too many attempts',
  NFC_DISABLED = 'NFC is disabled',
  COMMUNICATION_ERROR = 'Communication error'
}

const handleKeycardError = (error: Error) => {
  if (error.message.includes('6982')) {
    throw new KeycardError(KeycardError.WRONG_PIN);
  } else if (error.message.includes('6983')) {
    throw new KeycardError(KeycardError.PIN_LOCKED);
  }
  // ... handle other errors
};
```

---

## 🌐 Web3 Integration

### Provider Setup

```typescript
// Using ethers.js v6
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const smartAccount = new ethers.Contract(
  SMART_ACCOUNT_ADDRESS,
  SMART_ACCOUNT_ABI,
  provider
);
```

### Contract Interaction

```typescript
// ✅ Proper typing with ethers.js
interface VZHSmartAccount extends ethers.Contract {
  execute(
    target: string,
    value: bigint,
    data: string
  ): Promise<ethers.ContractTransaction>;

  claimHealthIdentitySBT(
    sbtContract: string,
    nillionDID: string,
    expiresAt: bigint,
    voucherNonce: bigint,
    signature: string
  ): Promise<ethers.ContractTransaction>;
}
```

### Transaction Building

```typescript
const buildClaimTransaction = async (voucher: Voucher) => {
  const smartAccount = new ethers.Contract(
    userSmartAccountAddress,
    SMART_ACCOUNT_ABI,
    provider
  ) as VZHSmartAccount;

  // Encode function call
  const data = smartAccount.interface.encodeFunctionData(
    'claimHealthIdentitySBT',
    [
      voucher.sbtContract,
      voucher.nillionDID,
      voucher.expiresAt,
      voucher.nonce,
      voucher.signature
    ]
  );

  // Build transaction
  const tx = {
    to: userSmartAccountAddress,
    data,
    value: 0n,
    gasLimit: 500000n,
  };

  return tx;
};
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// KeycardService.test.ts
describe('KeycardService', () => {
  it('should derive correct Ethereum address', async () => {
    const mockPublicKey = '0x...';
    const expectedAddress = '0x...';

    const address = deriveAddressFromPublicKey(mockPublicKey);
    expect(address).toBe(expectedAddress);
  });

  it('should throw on wrong PIN', async () => {
    await expect(
      keycard.verifyPIN('000000')
    ).rejects.toThrow(KeycardError.WRONG_PIN);
  });
});
```

### Integration Tests

```typescript
// SmartAccount.test.ts
describe('Smart Account Integration', () => {
  it('should create account with correct address', async () => {
    const owner = '0x...';
    const salt = 12345;

    const predicted = await factory.getAddress(owner, salt);
    await factory.createAccount(owner, salt);

    const code = await provider.getCode(predicted);
    expect(code).not.toBe('0x');
  });
});
```

### E2E Tests (Detox)

```typescript
// e2e/keycard-flow.test.ts
describe('Keycard Flow', () => {
  it('should complete full claim flow', async () => {
    await device.launchApp();

    // Scan QR
    await element(by.id('scan-qr-button')).tap();
    // ... simulate QR scan

    // Tap Keycard prompt
    await element(by.id('tap-keycard-prompt')).toBeVisible();
    // ... simulate NFC tap

    // Enter PIN
    await element(by.id('pin-input')).typeText('123456');
    await element(by.id('confirm-pin')).tap();

    // Verify success
    await expect(element(by.id('success-message'))).toBeVisible();
  });
});
```

---

## 📐 Code Style

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Naming Conventions

```typescript
// ✅ Good
interface PassportVerification {
  verified: boolean;
  score: number;
}

class KeycardService {}

const calculateGasLimit = (data: string): bigint => {};

// ❌ Bad
interface passport_verification {}  // Use PascalCase
class keycardservice {}  // Use PascalCase
const CalculateGasLimit = () => {};  // Use camelCase for functions
```

### File Organization

```
src/
├── screens/          # PascalCase for components
│   └── DashboardScreen.tsx
├── services/         # PascalCase for classes
│   └── KeycardService.ts
├── utils/            # camelCase for utilities
│   └── cryptoHelpers.ts
└── types/            # PascalCase for types
    └── Keycard.ts
```

---

## 🚀 Performance Optimization

### 1. Lazy Loading

```typescript
// ✅ Lazy load heavy screens
const DashboardScreen = React.lazy(() => import('./screens/DashboardScreen'));
```

### 2. Memoization

```typescript
// ✅ Memoize expensive computations
const derivedAddress = useMemo(
  () => deriveAddressFromPublicKey(publicKey),
  [publicKey]
);
```

### 3. Virtualized Lists

```typescript
// ✅ Use FlatList for long lists
<FlatList
  data={transactions}
  renderItem={({ item }) => <TransactionItem tx={item} />}
  keyExtractor={(item) => item.hash}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
/>
```

---

## 📦 Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "ethers": "^6.10.0",
    "react-native-nfc-manager": "^3.14.0",
    "react-native-keychain": "^8.1.0",
    "@react-navigation/native": "^6.1.0",
    "react-native-qrcode-scanner": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "detox": "^20.0.0"
  }
}
```

---

## 🔄 CI/CD

### GitHub Actions Workflow

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
      - run: npm install
      - run: cd android && ./gradlew assembleRelease

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: cd ios && pod install
      - run: xcodebuild -workspace ios/VZH.xcworkspace
```

---

## 📚 Additional Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Ethers.js Docs](https://docs.ethers.org/)
- [Status Keycard Docs](https://keycard.tech/)
- [NFC Manager Docs](https://github.com/whitedogg13/react-native-nfc-manager)

### Examples
- [MetaMask Mobile](https://github.com/MetaMask/metamask-mobile)
- [Rainbow Wallet](https://github.com/rainbow-me/rainbow)
- [Trust Wallet](https://github.com/trustwallet/trust-wallet-ios)

### Community
- [React Native Crypto Community](https://discord.gg/reactnative)
- [Ethereum Developers](https://discord.gg/ethereum)
- [Status Community](https://discord.gg/status)

---

## ✅ Code Review Checklist

Before submitting PR:

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Proper error handling
- [ ] No hardcoded secrets
- [ ] PIN never stored
- [ ] Transaction preview shown
- [ ] NFC sessions properly closed
- [ ] Loading states handled
- [ ] Offline behavior considered
- [ ] iOS and Android tested

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Last Updated:** 2025-10-10
**Version:** 0.1.0-alpha
**Maintainer:** VZH Team
