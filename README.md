# DASHI - Decentralized Anonymous Sovereign Health Identity

**Your health, your identity, your sovereignty**

A decentralized protocol for private, verifiable patient data in clinical trials, architected as ethical infrastructure for a regenerative future.

---

## Table of Contents

1.  [Project Vision](#project-vision)
2.  [What is DASHI?](#what-is-dashi)
3.  [The Problem: Data & Trust in Clinical Research](#the-problem-data--trust-in-clinical-research)
4.  [Our Solution: Verifiable Anonymity](#our-solution-verifiable-anonymity)
5.  [Core Components](#core-components)
6.  [An Ethical & Regenerative Framework](#an-ethical--regenerative-framework)
7.  [System Architecture](#system-architecture)
8.  [Getting Started](#getting-started)
9.  [Future Roadmap](#future-roadmap)

---

## Project Vision

Our mission is to invent and deploy ethical infrastructure for a regenerative future, beginning with one of the most critical sectors: global health. We believe that technological progress must be paired with a deep commitment to individual empowerment and privacy.

This project is guided by the following core principles:

* **Global Health Sovereignty:** We are building tools that give individuals true ownership and control over their most sensitive health data. Our goal is to dismantle centralized data silos and create a more equitable, patient-centric healthcare ecosystem.

* **Self-Sovereign Digital Identity:** We utilize decentralized technologies to establish a new model for digital identity in healthcare. Relationships between patients and institutions are managed on-chain, creating a transparent and tamper-proof layer of trust without relying on a central authority.

* **Data & Knowledge Sovereignty:** Our architecture ensures that sensitive information remains under the user's exclusive control. By leveraging cryptography and encrypted storage, we enable individuals to share insights and verifiable proofs without ever exposing their raw data.

* **Commitment to Open Source:** We are dedicated to building in public and fostering a collaborative community. We believe that transparent, open-source development is essential for creating infrastructure that is truly trustworthy and beneficial for all.

---

## What is DASHI?

**DASHI** stands for:
- **D**ecentralized - Web3, distributed, no central authority
- **A**nonymous - Privacy-first, ZK proofs, encrypted storage
- **S**overeign - Patient ownership and complete control
- **H**ealth - Medical records and verifiable credentials
- **I**dentity - Universal, portable, multi-chain identity

**Cultural Note:** "Dashi" (出汁) is Japanese for "stock/broth" - the essential base of many dishes. Just as dashi forms the foundation of great cuisine, DASHI forms the essential foundation of sovereign health identity.

**Key Features:**
- **Non-transferable SBT** (Soulbound Token) - Your health identity cannot be sold or stolen
- **Multi-chain deployment** - Same address across all EVM chains via CREATE2
- **Certified medical providers** - Only verified institutions can issue credentials
- **Encrypted vault storage** - Medical data stored securely with Nillion
- **Zero-knowledge proofs** - Prove eligibility without revealing private data
- **Sybil-resistant** - Human Passport (Gitcoin) verification

---

## The Problem: Data & Trust in Clinical Research

The process of recruiting patients for clinical trials is fundamentally broken. It suffers from deep-seated inefficiencies and a growing trust deficit:

* **Privacy Risks:** Patients are required to share highly sensitive personal health information with centralized entities, creating significant privacy risks and data security vulnerabilities.
* **Recruitment Friction:** Researchers spend vast resources on patient verification, a slow and manual process that significantly delays the timeline for critical medical research.
* **Data Silos:** Patient data is fragmented across multiple, non-interoperable healthcare systems, making it difficult for individuals to control their own information or participate in new research opportunities.
* **Lack of Verifiability:** It is difficult to prove compliance and participation in a transparent and tamper-proof manner, which can lead to disputes and inefficiencies.

These issues not only slow down the pace of innovation but also create barriers to entry for diverse patient populations, perpetuating inequities in medical outcomes.

## Our Solution: Verifiable Anonymity

DASHI introduces a paradigm shift. Instead of patients handing over their data for verification, our protocol enables them to generate cryptographic proof of their eligibility **without revealing the underlying data itself.**

A patient can mathematically prove facts like "I am between the ages of 30 and 45" or "My cholesterol is below 200 mg/dL" to a researcher's smart contract. The researcher can trust the proof's validity without ever seeing the patient's actual age or medical records. This model builds a trustless and secure bridge between patients and researchers, protecting individual privacy while accelerating scientific discovery.

## Core Components

Our protocol is built on a stack of interoperable, open-source technologies:

1.  **Zero-Knowledge Proofs (ZKPs):** At the core of our system, ZKPs allow for the private verification of data. Circuits are designed to validate common clinical trial criteria (e.g., age ranges, biomarker levels), and proofs are generated client-side on the patient's device.

2.  **DASHI SBT (Soulbound Token):** We use non-transferable ERC721 tokens (`HealthIdentitySBT`) to represent the official, on-chain relationship between a patient and their medical providers. This SBT acts as a form of self-sovereign digital identity within the healthcare ecosystem.

3.  **Multi-chain Smart Accounts:** Patient accounts are deployed via CREATE2, ensuring the same address across all EVM chains. This enables true portability of medical identity.

4.  **Encrypted Medical Vault (Nillion):** All sensitive patient data is stored encrypted and distributed across Nillion's network. No single node can access the complete data, ensuring maximum privacy and security.

5.  **Human Passport Integration:** Gitcoin Passport provides Sybil resistance, ensuring one person = one health identity, without requiring KYC or revealing personal information.

6.  **Certified Provider Registry:** On-chain registry of verified medical providers who can issue DASHI credentials. Multi-level certification (doctors, clinics, hospitals, government authorities).

## An Ethical & Regenerative Framework

DASHI is architected from the ground up as a piece of **ethical infrastructure**:

* **Privacy by Design:** The system is structurally incapable of exposing user data, shifting the power dynamic from data extraction to user empowerment.
* **Reduced Bias:** By lowering the barrier to verification, the protocol can help create more diverse and equitable trial cohorts.
* **Trust Through Transparency:** The use of open-source code and public blockchain records for verification (not data) creates a transparent and auditable system for all participants.

This framework is **regenerative** by:

* **Accelerating Research:** By dramatically reducing the time and cost of patient recruitment, we can help bring new therapies and treatments to market faster.
* **Rebuilding Trust:** We foster a new, more equitable relationship between patients and the research community, encouraging broader participation in science.
* **ReFi Economics:** Patients earn rewards for research participation, creating a sustainable economic model aligned with Regenerative Finance principles.

## System Architecture

The project is a monorepo built with Turborepo and pnpm workspaces.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Browser Extension** | React, Vite, TypeScript | Patient interface for identity management and data control |
| **Frontend (Next.js)** | Next.js 15, React, wagmi, viem | Web application for onboarding and provider dashboard |
| **Smart Contracts** | Solidity, OpenZeppelin, Hardhat | On-chain logic for identity (SBTs), provider registry, and ZK verification |
| **ZK Circuits** | Circom, snarkjs | Logic for generating and verifying proofs of medical data eligibility |
| **Encrypted Storage** | Nillion Network | Secure, distributed storage for patient medical records |
| **Identity** | Human Passport (Gitcoin) | Sybil-resistant humanity verification without KYC |

### Smart Contract Architecture

```
contracts/
├── core/                           # Identity & Account Management
│   ├── HealthIdentitySBT.sol          - Soulbound token for health identity
│   ├── PatientSmartAccount.sol        - Multi-chain smart account (CREATE2)
│   ├── PatientAccountFactory.sol      - Factory for deterministic addresses
│   └── MedicalProviderRegistry.sol    - Certified provider registry
│
├── studies/                        # Clinical Trial Management
│   ├── StudyRegistry.sol              - Study publication and management
│   ├── StudyParticipationSBT.sol      - Soulbound participation certificates
│   ├── StudyEnrollmentData.sol        - Enrollment tracking and compliance
│   └── ComplianceScore.sol            - On-chain reputation scoring
│
├── funding/                        # Research Funding & Escrow
│   ├── ResearchFundingEscrow.sol      - Milestone-based funding
│   ├── CommitmentVault.sol            - Two-party escrow for RWA NFTs
│   └── CommitmentVaultFactory.sol     - Factory for commitment vaults
│
├── zk/                            # Zero-Knowledge Verifiers
│   └── EligibilityCodeVerifier.sol    - Groth16 verifier for eligibility proofs
│
└── nft/                           # Real-World Asset NFTs
    └── StudyAccessNFT.sol             - Transferable study access vouchers
```

#### Contract Distinction: SBT vs NFT

**StudyParticipationSBT** (Soulbound Token):
- Non-transferable certificate of verified participation
- Minted after ZK proof verification and enrollment
- Represents completed study participation
- Used for compliance scoring and reputation

**StudyAccessNFT** (Transferable RWA NFT):
- Transferable voucher for study access
- Minted by sponsor before patient enrollment
- Can be deposited in CommitmentVault as collateral
- Optional pre-approval mechanism

#### Key Contracts

**HealthIdentitySBT.sol**
- One SBT per patient, linked to Human Passport
- Stores Nillion DID for encrypted medical records
- Provider attestation system for medical data
- Voucher-based minting with signature verification

**PatientSmartAccount.sol & PatientAccountFactory.sol**
- CREATE2 deployment for same address across all EVM chains
- Social recovery mechanism
- Batch transaction support
- Direct SBT claiming capability

**StudyRegistry.sol**
- Study publication by researchers
- ZK proof verification for anonymous applications
- Study metadata and eligibility criteria (IPFS)

**StudyParticipationSBT.sol & StudyEnrollmentData.sol**
- Dual SBT minting (patient + institution)
- Separation of token logic from enrollment data
- Compliance level tracking (1-3)
- Interaction counting for reputation

**CommitmentVault.sol & CommitmentVaultFactory.sol**
- Two-party escrow for StudyAccessNFT tokens
- Requires enrollment with compliance level >= 2
- Mutual approval for redemption or dissolution

**MedicalProviderRegistry.sol**
- Multi-level provider certification
- Role-based access control
- Provider verification and attestation rights

## Getting Started

To run the project locally, please ensure you have Node.js (v18+) and pnpm installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/edsphinx/veritas-zero-health.git
    cd veritas-zero-health
    ```

2.  **Install all dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The main web application will be available at `http://localhost:3000`.

4.  **Build the browser extension:**
    ```bash
    cd packages/browser-extension
    yarn build
    ```
    Load the `dist` folder in Chrome as an unpacked extension.

## Future Roadmap

### Phase 1: MVP (Current)
- [x] DASHI SBT implementation
- [x] Browser extension with DID generation
- [x] Human Passport integration
- [x] Nillion encrypted storage
- [x] Multi-chain Smart Account deployment
- [ ] Provider dashboard
- [ ] Medical provider registry contract

### Phase 2: Research Integration
- [ ] Expanded ZK Circuit Library for clinical trial criteria
- [ ] Anonymous research participation with ZK proofs
- [ ] ReFi reward distribution for data contribution
- [ ] Impact tracking and metrics

### Phase 3: Scale & Governance
- [ ] DAO Governance for protocol decisions
- [ ] Mobile Application (iOS/Android)
- [ ] Integration with EHR Systems
- [ ] Multi-language support
- [ ] Government health system partnerships

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: https://github.com/edsphinx/veritas-zero-health
- Documentation: See [DASHI_ARCHITECTURE.md](DASHI_ARCHITECTURE.md)

---

**Built for a regenerative future**

**DASHI - Your health, your identity, your sovereignty**
