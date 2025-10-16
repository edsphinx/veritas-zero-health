# Veritas Zero Health - ZK Proof Systems

**Status:** DUAL SYSTEM DEPLOYED ON OPTIMISM SEPOLIA

---

## Overview

Two independent ZK proof systems for different verification needs:

| System | Circuit | Use Case | Verification | Speed |
|--------|---------|----------|--------------|-------|
| **Age Verification** | Halo2/PLONK | Fast UX screening | Off-chain (client-side) | 33-60ms |
| **Medical Eligibility** | Circom/Groth16 | Trustless verification | On-chain (OP Sepolia) | 2-5s |

---

## 1. Age Verification (Halo2 + PLONK + Mopro WASM)

### Location
- Circuit: `circuits/circuits/composite/` (Rust + Halo2)
- WASM: `mopro/mopro-wasm/`
- Keys: `circuits/plonk-wrappers/plonk-composite/out/`

### Files
- `plonk_eligibility_pk.bin` (7.0KB)
- `plonk_eligibility_vk.bin` (329B)
- `plonk_clinical_trials_srs.bin` (1.3KB)
- `mopro_wasm_bg.wasm` (791KB)

### Performance
- Proof generation: 33-60ms
- Verification: 20-30ms (client-side only)
- No gas costs

### Commands
```bash
pnpm halo2:pipeline    # Full build
pnpm halo2:test        # Test circuits
pnpm halo2:keys        # Generate keys
pnpm halo2:build       # Build WASM
pnpm halo2:sync        # Sync to extension
```

---

## 2. Medical Eligibility (Circom + Groth16)

### Location
- Circuit: `circom-circuits/eligibility_code/circuits/eligibility_code.circom`
- Build: `circom-circuits/eligibility_code/build/`
- Keys: `circom-circuits/eligibility_code/setup/`
- Verifier: `packages/foundry/contracts/zk/EligibilityCodeVerifier.sol`

### Files
- `eligibility_code.wasm` (2.0MB)
- `eligibility_0000.zkey` (324KB)
- `verification_key.json` (2.9KB)
- `pot12_final.ptau` (4.6MB)

### Smart Contract
- **Verifier:** EligibilityCodeVerifier (Groth16)
- **Address:** 0x1BBc9BD3b5b5a2ECB7d99b8b933F866A16bb7B29
- **Network:** Optimism Sepolia (11155420)
- **Integration:** StudyRegistry.submitAnonymousApplication()

### Performance
- Proof generation: 2-5s
- Verification: ~240,000 gas on-chain
- Proof size: ~200 bytes

### Circuit
- **Gates:** 12,594
- **Private inputs:** code[4] (biomarker, vital, med/allergy, diagnosis)
- **Public input:** requiredCodeHash (Poseidon hash)

### Commands
```bash
pnpm circom:verifier:eligibility    # Generate Solidity verifier
pnpm circom:pipeline:verifier       # Full pipeline
```

---

## Directory Structure

```
packages/zk/
├── circuits/                      # ACTIVE: Halo2 age verification
│   ├── circuits/composite/        # Halo2 circuit (Rust)
│   ├── plonk-wrappers/           # PLONK wrapper + keys
│   └── docs/                     # Documentation
│
├── mopro/                        # ACTIVE: WASM bindings
│   └── mopro-wasm/               # Compiled WASM
│
├── circom-circuits/              # ACTIVE: Circom medical eligibility
│   └── eligibility_code/
│       ├── circuits/             # Source (.circom)
│       ├── build/                # Compiled WASM
│       └── setup/                # Keys (zkey, ptau, vk.json)
│
├── archived/                     # OLD: Not used
├── reference/                    # REFERENCE: Examples
└── .private/                     # DOCS: Decision records
```

---

## Integration Points

### Browser Extension
**Location:** `packages/browser-extension/public/zk/`

**Files:**
- Halo2: mopro_wasm_bg.wasm, plonk_eligibility_pk.bin, plonk_eligibility_vk.bin
- Circom: eligibility_code.wasm, eligibility_0000.zkey

**Services:**
- `src/lib/zk-proof-service.ts` (Age)
- `src/lib/eligibility-proof-service.ts` (Medical)

### Next.js
- `shared/lib/eligibility-codes.ts` - Code generation
- `app/api/studies/[studyId]/apply/route.ts` - Submit proofs

### Smart Contracts
- `foundry/contracts/zk/EligibilityCodeVerifier.sol` - Groth16 verifier
- `foundry/contracts/studies/StudyRegistry.sol` - Integration

---

## Build Commands

```bash
# Generate all keys and verifiers
pnpm generate:all

# Verify all files exist
pnpm check:keys:all

# Display system info
pnpm info:all
```

---

## Performance Comparison

| Metric | Halo2 | Circom |
|--------|-------|--------|
| **Proof Time** | 33-60ms | 2-5s |
| **Verification** | Off-chain | On-chain |
| **Gas Cost** | 0 | ~240K |
| **Proof Size** | ~3KB | ~200B |
| **Trusted Setup** | No | Yes |

---

## Status

| Component | Halo2 | Circom |
|-----------|-------|--------|
| Circuit | Ready | Ready |
| Keys | Ready | Ready |
| WASM | Ready | Ready |
| Verifier | N/A | Deployed |
| Extension | Integrated | Integrated |
| Tested | Working | Pending |

---

**Last Updated:** 2025-10-16
