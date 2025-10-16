# Veritas Zero Health - Service Layer Architecture

## 📋 Overview

The service layer provides clean abstraction over blockchain interactions, following Clean Architecture principles. All components, API routes, and pages should use these services instead of directly importing contracts or creating blockchain clients.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Presentation Layer                         │
│  - Components                               │
│  - Pages                                    │
│  - API Routes                               │
└──────────────┬──────────────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────────────┐
│  Service Layer (THIS LAYER)                 │
│  - blockchain-client.service.ts             │
│  - health-identity-sbt.service.ts           │
│  - studies.service.ts                       │
│  - researchers.service.ts                   │
│  - sponsors.service.ts                      │
└──────────────┬──────────────────────────────┘
               │ uses
               ▼
┌─────────────────────────────────────────────┐
│  Infrastructure Layer                       │
│  - shared/lib/vzh/contracts.ts              │
│  - contracts/deployedContracts.ts           │
└─────────────────────────────────────────────┘
```

## 📦 Available Services

### 1. Blockchain Client Service

**Purpose:** Centralized blockchain client creation and management

**File:** `blockchain-client.service.ts`

**Functions:**
- `getPublicClient(chainId)` - Create read-only client
- `getWalletClientFromPrivateKey(chainId, privateKey)` - Create wallet client
- `getWalletClient(chainId, account)` - Create wallet client with existing account
- `getChain(chainId)` - Get chain configuration
- `getDefaultChainId()` - Get default chain ID (Optimism Sepolia)
- `isTestnet(chainId)` - Check if chain is testnet

**Example:**
```typescript
import { getPublicClient, getDefaultChainId } from '@/shared/services';

const chainId = getDefaultChainId();
const publicClient = getPublicClient(chainId);

const balance = await publicClient.getBalance({ address: '0x...' });
```

### 2. Health Identity SBT Service

**Purpose:** Health Identity Soulbound Token operations

**File:** `health-identity-sbt.service.ts`

**Functions:**
- `getHealthIdentitySBTContract(chainId)` - Get SBT contract config
- `getHumanPassportContract(chainId)` - Get Human Passport contract config
- `isHealthIdentitySBTDeployed(chainId)` - Check deployment
- `getDefaultHealthIdentityChainId()` - Get default chain

**Example:**
```typescript
import { getHealthIdentitySBTContract, getDefaultHealthIdentityChainId } from '@/shared/services';

const chainId = getDefaultHealthIdentityChainId();
const contract = getHealthIdentitySBTContract(chainId);

if (contract) {
  // Use contract.address and contract.abi
  const publicClient = getPublicClient(chainId);
  const hasIdentity = await publicClient.readContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'hasHealthIdentity',
    args: [userAddress],
  });
}
```

### 3. Studies Service

**Purpose:** Clinical studies and research funding operations

**File:** `studies.service.ts`

**Functions:**
- `getStudyRegistryContract(chainId)` - Get StudyRegistry contract config
- `getResearchFundingEscrowContract(chainId)` - Get Escrow contract config
- `getMockUSDCContract(chainId)` - Get MockUSDC contract config
- `areStudyContractsDeployed(chainId)` - Check if contracts are deployed
- `getStudyContracts(chainId)` - Get all study-related contracts

**Example:**
```typescript
import { getResearchFundingEscrowContract, getDefaultChainId } from '@/shared/services';

const chainId = getDefaultChainId();
const escrowContract = getResearchFundingEscrowContract(chainId);

if (!escrowContract) {
  throw new Error('Escrow contract not deployed');
}

// Use escrowContract.address and escrowContract.abi
```

### 4. Researchers Service

**Purpose:** Researcher-specific operations

**File:** `researchers.service.ts`

**Functions:**
- `getResearcherProfile(address, chainId)` - Get researcher profile
- `isVerifiedResearcher(address, chainId)` - Check verification
- `getResearcherStudies(address, chainId)` - Get researcher's studies
- `getResearcherWalletConfig(researcherId)` - Get test wallet config

**Example:**
```typescript
import { getResearcherWalletConfig } from '@/shared/services';

// For testing/development
const researcherWallet = getResearcherWalletConfig(1);

if (researcherWallet) {
  console.log('Researcher address:', researcherWallet.address);
  // Use researcherWallet.privateKey for signing
}
```

### 5. Sponsors Service

**Purpose:** Sponsor-specific operations

**File:** `sponsors.service.ts`

**Functions:**
- `getSponsorProfile(address, chainId)` - Get sponsor profile
- `getSponsorFundingHistory(address, chainId)` - Get funding history
- `getSponsorTotalFunding(address, chainId)` - Get total funded amount
- `getSponsorUSDCBalance(address, chainId)` - Get USDC balance
- `getSponsorUSDCAllowance(address, chainId)` - Get USDC allowance for escrow
- `getSponsorWalletConfig(sponsorId)` - Get test wallet config

**Example:**
```typescript
import { getSponsorUSDCBalance, getDefaultChainId } from '@/shared/services';

const chainId = getDefaultChainId();
const balance = await getSponsorUSDCBalance(sponsorAddress, chainId);

console.log(`Sponsor USDC balance: ${balance}`);
```

## 🚫 Anti-Patterns (DO NOT DO THIS)

### ❌ Bad: Direct import of deployedContracts
```typescript
// WRONG - Violates architecture
import deployedContracts from '@/contracts/deployedContracts';
const contract = deployedContracts[11155420].HealthIdentitySBT;
```

### ❌ Bad: Direct import of viem/chains
```typescript
// WRONG - Infrastructure leak
import { optimismSepolia } from 'viem/chains';
const client = createPublicClient({ chain: optimismSepolia });
```

### ❌ Bad: Hardcoded ABIs
```typescript
// WRONG - Duplication
const ESCROW_ABI = [
  { inputs: [...], name: 'createStudy', ... }
] as const;
```

### ❌ Bad: Contract addresses from .env
```typescript
// WRONG - Duplicate source of truth
const address = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
```

## ✅ Best Practices (DO THIS)

### ✅ Good: Use service layer
```typescript
// CORRECT - Clean architecture
import { getResearchFundingEscrowContract, getDefaultChainId } from '@/shared/services';

const chainId = getDefaultChainId();
const contract = getResearchFundingEscrowContract(chainId);
```

### ✅ Good: Use blockchain client service
```typescript
// CORRECT - Centralized client creation
import { getPublicClient, getWalletClientFromPrivateKey } from '@/shared/services';

const publicClient = getPublicClient(chainId);
const walletClient = getWalletClientFromPrivateKey(chainId, privateKey);
```

### ✅ Good: Use role services for test wallets
```typescript
// CORRECT - Environment abstraction
import { getResearcherWalletConfig, getSponsorWalletConfig } from '@/shared/services';

const researcher = getResearcherWalletConfig(1);
const sponsor = getSponsorWalletConfig(1);
```

## 📝 Migration Guide

If you have existing code that violates these patterns:

1. **Replace hardcoded ABIs:**
   ```typescript
   // Before
   const ABI = [...];

   // After
   import { getResearchFundingEscrowContract } from '@/shared/services';
   const contract = getResearchFundingEscrowContract(chainId);
   const abi = contract.abi;
   ```

2. **Replace manual client creation:**
   ```typescript
   // Before
   const publicClient = createPublicClient({
     chain: optimismSepolia,
     transport: http(process.env.RPC_URL)
   });

   // After
   import { getPublicClient, getDefaultChainId } from '@/shared/services';
   const chainId = getDefaultChainId();
   const publicClient = getPublicClient(chainId);
   ```

3. **Replace environment variable addresses:**
   ```typescript
   // Before
   const address = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

   // After
   import { getResearchFundingEscrowContract } from '@/shared/services';
   const contract = getResearchFundingEscrowContract(chainId);
   const address = contract.address;
   ```

## 🔍 Type Safety

All services return properly typed configurations:

```typescript
interface ContractConfig {
  address: Address;
  abi: readonly any[];
  chainId: number;
}
```

Use these types to ensure type safety throughout your application.

## 🎯 Benefits

1. **Single Source of Truth** - All contract data from `deployedContracts.ts`
2. **Type Safety** - Proper TypeScript types throughout
3. **Testability** - Services can be easily mocked
4. **Maintainability** - Changes propagate from one place
5. **Clean Architecture** - Proper separation of concerns
6. **DRY Principle** - No code duplication

## 📚 Further Reading

- See `SBT_IMPLEMENTATION_SUMMARY.md` for SBT service usage
- See API routes in `app/api/studies/` for examples
- See `shared/lib/vzh/contracts.ts` for infrastructure layer
