# TODO - Veritas Zero Health (Next.js)

## 🎯 Current Phase: Foundation & Design System

---

## 🔴 Priority 1: Design System & Components ✅ COMPLETED

### Shadcn Components Setup
- [x] Install base shadcn components:
  - [x] Button
  - [x] Card
  - [x] Badge
  - [x] Dropdown Menu
  - [x] Avatar
  - [x] Separator
  - [ ] Skeleton (loading states)
  - [ ] Dialog
  - [ ] Tooltip
  - [ ] Command (search/command palette)

### Home Page Refactor
- [ ] Move `FeatureCard` to `components/features/home/FeatureCard.tsx` using shadcn Card
- [ ] Move `PortalCard` to `components/features/home/PortalCard.tsx` using shadcn Card
- [ ] Add proper animations with framer-motion
- [ ] Implement responsive design breakpoints

### AppKit Theme Customization
- [x] Configure AppKit theme to match DASHI colors
- [x] Customize button styles, border radius, fonts
- [ ] Test on mobile devices

### Logo & Branding
- [x] Simplify logo design for favicon (3-element: Shield + Cross + ZK)
- [x] Generate multi-resolution favicon.ico
- [x] Update app/icon.svg and public/dashi-logo.svg

---

## 🟡 Priority 2: Advanced Wallet Component ✅ COMPLETED

### Professional ConnectWallet Component
**Location**: `components/wallet/WalletButton.tsx`

**Features to implement gradually:**

#### Phase 1: Basic Connection + SIWX ✅
- [x] Integrate SIWX (Sign-In with X) instead of SIWE
- [x] Single component: Connect + Sign In with NextAuth
- [x] Loading states and error handling
- [x] Disconnect functionality

#### Phase 2: Wallet Info Dropdown ✅
- [x] Display wallet address (truncated with copy button)
- [x] Show native token balance (ETH, OP, etc.)
- [x] Display connected network with icon
- [x] Network switcher dropdown (separate component)
- [x] ENS name resolution and display
- [x] Avatar from ENS or generated

#### Phase 3: Advanced Features
- [ ] Multi-token balance display (ERC20)
- [ ] NFT gallery preview (owned NFTs)
- [ ] Recent transactions list
- [ ] Quick actions (Send, Receive, Add to wallet)
- [ ] Gas price indicator
- [ ] Connection health indicator

#### Phase 4: Polish & UX
- [ ] Smooth animations for dropdown
- [ ] Keyboard shortcuts (Cmd+K to open)
- [ ] Mobile-optimized drawer instead of dropdown
- [ ] Dark mode support
- [ ] Accessibility (ARIA labels, keyboard navigation)

**Component Structure (Future):**
```typescript
// components/wallet/WalletButton.tsx
export function WalletButton() {
  // Main component with AppKit integration
}

// components/wallet/WalletDropdown.tsx
export function WalletDropdown() {
  // Dropdown with all wallet info
}

// components/wallet/NetworkSwitcher.tsx
export function NetworkSwitcher() {
  // Network selection
}

// components/wallet/TokenBalances.tsx
export function TokenBalances() {
  // Display token balances
}

// components/wallet/NFTPreview.tsx
export function NFTPreview() {
  // NFT gallery
}
```

---

## 🟢 Priority 3: Authentication & Authorization ✅ COMPLETED

### NextAuth + SIWX Integration
- [x] Setup NextAuth with SIWX provider
- [x] Create auth API routes
- [x] Implement session management
- [x] Add role-based access control (Patient, Researcher, Clinic, Sponsor)
- [x] Create RouteGuard component for protected routes
- [x] Add auth middleware for route protection
- [x] Create useAuth() hook for accessing auth state

### Auth UI Components
- [ ] SignIn modal/page (using AppKit modal currently)
- [ ] Session expiry warning
- [ ] Re-authentication flow
- [ ] Verification badges (Human Protocol)

---

## 🔵 Priority 4: Core Architecture & Researcher Flow ⏳ IN PROGRESS

### Database Schema & Types ✅ COMPLETED
- [x] Complete Prisma schema with all blockchain models:
  - [x] Study, StudyMilestone, StudyCriteria, StudyApplication
  - [x] Participation, Payment, SponsorDeposit
  - [x] MedicalProvider, HealthIdentity, HealthAttestation
  - [x] StudyParticipationToken
- [x] Align all enums with smart contracts:
  - [x] MilestoneType (enrollment, data_submission, followup_visit, study_completion, custom)
  - [x] MilestoneStatus (pending, in_progress, completed, verified, paid)
  - [x] CertificationLevel (none, individual, clinic, hospital, government_authority)
  - [x] StudyStatus (draft, recruiting, active, paused, completed, cancelled)
- [x] Create complete type system in @veritas/types:
  - [x] Study types (Study, StudyDB, toAPIStudy)
  - [x] Provider types (MedicalProvider, CertificationLevel)
  - [x] Identity types (HealthIdentity, HealthAttestation, StudyParticipationToken)
  - [x] Enrollment types (Participation, Payment)
- [x] Update domain entities (CreateStudyData, UpdateStudyData)
- [x] Generate Prisma client with new schema

### Clean Architecture Setup ✅
- [x] Create `core/` folder structure:
  - [x] `domain/` - Entities and interfaces
  - [x] `use-cases/` - Business logic
  - [x] `infrastructure/` - External services
- [x] Implement repository pattern (interfaces defined)
- [x] Add User type to @veritas/types
- [x] Create domain entities (Study, User)
- [x] Create repository interfaces (IStudyRepository, IUserRepository)
- [x] Implement first use cases (GetStudies, GetStudyById)
- [x] Implement PrismaStudyRepository with all new fields
- [ ] Implement remaining Prisma repositories (Participation, Payment, Provider, Identity)
- [ ] Create API routes using use cases
- [ ] Add dependency injection (future)

### Researcher Flow Implementation ⏳ IN PROGRESS
**Based on bk_nextjs analysis (33 files to port)**

#### Core Domain Layer
- [ ] Port Study use cases from bk_nextjs:
  - [ ] CreateStudy (with blockchain transaction)
  - [ ] UpdateStudy
  - [ ] DeleteStudy
  - [ ] GetStudiesByResearcher
  - [ ] AddStudyCriteria
  - [ ] AddStudyMilestones
  - [ ] GetStudyApplications
- [ ] Create repository implementations:
  - [ ] ParticipationRepository
  - [ ] PaymentRepository
  - [ ] StudyCriteriaRepository (if not exists)
  - [ ] StudyApplicationRepository (if not exists)

#### API Routes Layer
- [ ] `/api/studies/create` - Create new study
- [ ] `/api/studies/index` - List all studies
- [ ] `/api/studies/[studyId]/route` - Get/update/delete study
- [ ] `/api/studies/[studyId]/criteria/route` - Add eligibility criteria
- [ ] `/api/studies/[studyId]/criteria/index` - List criteria
- [ ] `/api/studies/[studyId]/milestones/route` - Add milestone
- [ ] `/api/studies/[studyId]/milestones/index` - List milestones
- [ ] `/api/studies/[studyId]/milestones/add` - Add milestone
- [ ] `/api/studies/[studyId]/milestones/verify` - Verify milestone completion
- [ ] `/api/studies/[studyId]/milestones/release-payment` - Release payment
- [ ] `/api/studies/[studyId]/applications` - Get applications
- [ ] `/api/studies/[studyId]/fund` - Fund study (sponsor)

#### Hooks Layer
- [ ] `useStudies()` - List studies with filters
- [ ] `useStudy(id)` - Get single study with details
- [ ] `useCreateStudy()` - Create study mutation
- [ ] `useUpdateStudy()` - Update study mutation
- [ ] `useStudyMilestones()` - Manage milestones
- [ ] `useStudyCriteria()` - Manage criteria

#### Components Layer
- [ ] `StudyCard` - Study preview card
- [ ] `StudyList` - List of studies
- [ ] `MedicalCriteriaDisplay` - Display eligibility criteria
- [ ] `StudyForm` - Create/edit study form
- [ ] `MilestoneManager` - Manage study milestones
- [ ] `CriteriaManager` - Manage eligibility criteria

#### Pages Layer
- [x] `/researcher/page.tsx` - Researcher dashboard ✅
- [x] `/researcher/studies/page.tsx` - Studies list ✅
- [x] `/researcher/studies/[studyId]/page.tsx` - Study detail ✅
- [x] `/researcher/create-study/page.tsx` - Create study multi-step wizard ✅ (Initial version)
  - [x] Refactored to clean architecture (12 lines, imports StudyCreationWizard)
  - [x] Extracted 7 reusable components with animations:
    - ProgressIndicator, BasicInfoStep, FundingStep, AgeVerificationStep
    - MedicalEligibilityStep, ReviewStep, StudyCreationWizard
  - [ ] **REFACTOR REQUIRED**: Current wizard collects all data first, then executes TXs
  - [ ] **CORRECT FLOW**: Execute TX between each step for resumability (see below)

#### Create Study Wizard - CORRECT Implementation Flow

**Current Issue**: Wizard collects data in 5 steps, then executes 4 TXs at end. Cannot resume if TX fails mid-way.

**Correct Flow** (Just-in-Time Data + TX Between Steps):

```
STEP 1: Escrow Configuration (Data Collection)
├─ Basic Info: title, description, region
├─ Provider & Compensation (MVP: single clinic):
│  ├─ clinicAddress (single provider for MVP)
│  ├─ patientPercentage (default: 30%)
│  ├─ clinicPercentage (default: 70%)
│  └─ certifiedProviders: [clinicAddress]
├─ Funding: totalFunding, maxParticipants
└─ paymentPerParticipant
    ↓
[User reviews escrow configuration]
    ↓
🔗 TX 1: Escrow.createStudy() → escrowStudyId
    ↓
💾 Index to database (save escrowStudyId, escrowTxHash)
💾 Zustand: status = 'escrow_done', ids.escrowId = result
    ↓
✅ CHECKPOINT: Can resume from Step 2 if browser closes

STEP 2: Registry Publication (Data Collection)
├─ Show escrowStudyId (read-only, from previous step)
├─ Region refinement (optional)
├─ Compensation details (text description for public view)
├─ criteriaURI (auto-generated: ipfs://metadata/${escrowStudyId})
└─ Review escrow data created in Step 1
    ↓
[User confirms registry publication]
    ↓
🔗 TX 2: Registry.publishStudy() → registryStudyId
    ↓
💾 Index to database (link registryStudyId with escrowStudyId)
💾 Zustand: status = 'registry_done', ids.registryId = result
    ↓
✅ CHECKPOINT: Can resume from Step 3

STEP 3: Eligibility Criteria (Data Collection)
├─ Show escrowStudyId + registryStudyId (read-only)
├─ Age Criteria:
│  ├─ minAge, maxAge
│  └─ (ZK proof verification off-chain)
├─ Medical Criteria (optional):
│  ├─ Toggle: requiresEligibilityProof
│  └─ eligibilityCodeHash (0 if disabled)
│  └─ (Future: Full biomarkers/vitals form)
└─ Review escrow + registry configuration
    ↓
[User confirms eligibility criteria]
    ↓
🔗 TX 3: Registry.setStudyCriteria(registryStudyId, minAge, maxAge, eligibilityCodeHash)
    ↓
💾 Index to database (save criteria)
💾 Zustand: status = 'criteria_done'
    ↓
✅ CHECKPOINT: Can resume from Step 4

STEP 4: Milestones Setup (Data Collection + Dynamic TX Execution)

🔧 **SUB-WIZARD: 3-Phase Milestone Creation**

**PHASE 1: Template Selection**
├─ Option A: "Generate from appointments" (recommended)
│  ├─ Input: Number of required appointments (e.g., 5)
│  ├─ Auto-generate milestone structure:
│  │  ├─ 1× Enrollment (immediate payment)
│  │  ├─ N× FollowUpVisit (one per appointment)
│  │  └─ 1× StudyCompletion (final bonus)
│  │  └─ Total: N+2 milestones
│  └─ Even distribution of rewards across milestones
│
├─ Option B: "Custom milestones" (advanced)
│  └─ Manual add/remove each milestone
│
└─ Option C: "Templates" (future)
    ├─ Short-term study (2 milestones)
    ├─ Long-term study (10+ milestones)
    └─ Complex protocol (mixed types)

**PHASE 2: Milestone Configuration**
├─ For each milestone in list:
│  ├─ Type: MilestoneType dropdown (Enrollment, FollowUpVisit, DataSubmission, etc.)
│  ├─ Description: Text input
│  ├─ Reward amount: Number input (USDC)
│  └─ Preview: "Patient receives X% ($YYY), Clinic receives Z% ($WWW)"
│
├─ Validation:
│  ├─ Sum of all rewardAmounts ≤ totalFunding
│  ├─ Each rewardAmount > 0
│  ├─ At least 1 milestone required
│  └─ Description non-empty
│
├─ Summary Card (live update):
│  ├─ Total milestones: N
│  ├─ Total allocated: $X,XXX USDC
│  ├─ Remaining budget: $Y,YYY USDC
│  ├─ Estimated gas (if batch): ~ZZZ,ZZZ gas
│  └─ Estimated gas (if sequential): ~ZZZ,ZZZ gas × N
│
└─ Actions:
    ├─ Add milestone button
    ├─ Remove milestone button (per item)
    ├─ Reorder milestones (drag & drop)
    └─ "Next: Execute Transactions" button

**PHASE 3: Blockchain Execution (Strategy Based on Count)**

📊 **Execution Strategy**:

├─ IF milestones ≤ 2:
│  ├─ Mode: Sequential individual TXs (simple, clear)
│  ├─ UI: Simple progress: "Adding Enrollment..." → "Adding Completion..."
│  ├─ TXs: addMilestone() × 2
│  └─ UX: Fast, minimal signatures
│
├─ ELSE IF milestones 3-6:
│  ├─ **User Choice**:
│  │  ├─ Option A: "Add one by one" (N TXs, pausable, resumable)
│  │  └─ Option B: "Add all at once" (1 batch TX) [requires contract upgrade]
│  │
│  ├─ **Option A: Sequential Mode**:
│  │  ├─ Progress bar: ⬜⬜⬜⬜⬜ → ✅⬜⬜⬜⬜ → ✅✅⬜⬜⬜ → ... → ✅✅✅✅✅
│  │  ├─ Current: "Adding [FollowUpVisit]: Visit 1 of 3"
│  │  ├─ Pause/Resume buttons
│  │  ├─ Save progress to Zustand after each TX
│  │  └─ Can close browser and resume later
│  │
│  └─ **Option B: Batch Mode**:
│      ├─ Single progress: "Preparing batch transaction..."
│      ├─ Loading: "Waiting for wallet signature..."
│      ├─ Processing: "Adding N milestones on-chain..."
│      ├─ Success: "✅ All N milestones added successfully!"
│      └─ Gas savings displayed: "Saved ~X,XXX gas vs individual TXs"
│
└─ ELSE IF milestones > 6:
    ├─ **Recommended: Batch Mode** (strong suggestion)
    ├─ Warning shown if selecting sequential:
    │  └─ "⚠️ You'll need to sign N transactions. Consider batch mode to save time and gas."
    │
    ├─ **Batch Mode** (if available):
    │  └─ Same as 3-6 batch mode, optimized for larger arrays
    │
    ├─ **Chunked Batch Mode** (alternative if batch limit = 20):
    │  ├─ Split into chunks of 20
    │  ├─ Show: "Adding milestones in 2 batches (20 + 10)"
    │  ├─ Progress: "Batch 1/2..." → "Batch 2/2..."
    │  └─ Pause between batches allowed
    │
    └─ **Sequential Mode** (fallback):
        ├─ Extra confirmation required
        ├─ Clear time estimate: "Est. time: ~N×30s = M minutes"
        └─ Resumable checkpoints every 5 milestones

**TX Execution Flow**:

IF using BATCH (Contract upgraded with addMilestones function):
    ↓
🔗 TX 4: Escrow.addMilestones(escrowStudyId, MilestoneInput[])
    ↓
    Returns: uint256[] milestoneIds
    ↓
💾 Index ALL milestones to database (single API call)
💾 Zustand: status = 'complete', save all milestoneIds
    ↓
🎉 STUDY CREATION COMPLETE

ELSE using SEQUENTIAL (Current contract, no batch function):
    ↓
🔗 TX 4.1: Escrow.addMilestone(escrowStudyId, milestone[0])
💾 Index milestone[0] to DB
💾 Zustand: milestonesProgress = 1/N
    ↓
🔗 TX 4.2: Escrow.addMilestone(escrowStudyId, milestone[1])
💾 Index milestone[1] to DB
💾 Zustand: milestonesProgress = 2/N
    ↓
... (repeat for all N milestones) ...
    ↓
🔗 TX 4.N: Escrow.addMilestone(escrowStudyId, milestone[N-1])
💾 Index milestone[N-1] to DB
💾 Zustand: status = 'complete'
    ↓
🎉 STUDY CREATION COMPLETE

**After All Milestones Created**:
    ↓
Redirect to /researcher/studies/[dbStudyId]
Display success message with study summary
```

**Implementation Tasks**:
- [ ] Refactor wizard to 4 steps (not 5)
- [ ] Create new step components:
  - [ ] `EscrowStep.tsx` - Step 1 (data collection + TX1 execution)
  - [ ] `RegistryStep.tsx` - Step 2 (data collection + TX2 execution)
  - [ ] `CriteriaStep.tsx` - Step 3 (data collection + TX3 execution)
  - [ ] `MilestonesStep.tsx` - Step 4 (3-phase sub-wizard + dynamic TX execution)

**Milestone Sub-Wizard Components**:
- [ ] `MilestoneTemplateSelector.tsx` - Phase 1: Template selection
  - [ ] "Generate from appointments" option with appointment count input
  - [ ] Auto-generation logic for milestone structure
  - [ ] "Custom milestones" option
  - [ ] Template presets (future)
- [ ] `MilestoneConfigurator.tsx` - Phase 2: Configuration
  - [ ] Milestone list with add/remove/reorder
  - [ ] Per-milestone form (type, description, reward)
  - [ ] Real-time validation (total ≤ funding, rewards > 0)
  - [ ] Summary card (total, allocated, remaining, gas estimates)
  - [ ] Split preview per milestone (patient %, clinic %)
  - [ ] Drag-and-drop reordering (react-beautiful-dnd or dnd-kit)
- [ ] `MilestoneExecutor.tsx` - Phase 3: TX execution
  - [ ] Strategy selector (batch vs sequential) if 3-6 milestones
  - [ ] BatchMilestoneCreator component:
    - [ ] Single TX progress UI
    - [ ] Gas savings display
    - [ ] Error handling with batch-level retry
  - [ ] SequentialMilestoneCreator component:
    - [ ] Progress bar (N/M completed)
    - [ ] Per-milestone status indicators
    - [ ] Pause/Resume functionality
    - [ ] Checkpoint saving to Zustand
    - [ ] Auto-advance to next milestone after confirmation
  - [ ] ChunkedBatchCreator component (for >20 milestones):
    - [ ] Split into chunks of 20
    - [ ] Multi-batch progress tracking
  - [ ] Warning dialogs for >6 sequential milestones
  - [ ] Time estimates for sequential mode
- [ ] Each step includes:
  - [ ] Data collection form
  - [ ] Review of previous steps
  - [ ] TX execution button
  - [ ] Loading state during TX
  - [ ] Success confirmation before advancing
  - [ ] Error handling with retry option
- [ ] Integrate with `studyCreationStore.ts` (already exists):
  - [ ] Track status: 'draft' → 'escrow' → 'escrow_done' → 'registry' → ... → 'complete'
  - [ ] Store IDs: escrowId, registryId, dbStudyId
  - [ ] Store TX hashes for each step
  - [ ] Persist formData to localStorage
  - [ ] Implement resume functionality (detect incomplete creation on mount)
- [ ] Add resume banner:
  - [ ] Detect incomplete study creation on page load
  - [ ] Show "Resume study creation" banner with progress
  - [ ] Jump to correct step based on status
- [ ] Update validation schemas:
  - [ ] `escrowSchema` (Step 1)
  - [ ] `registrySchema` (Step 2)
  - [ ] `criteriaSchema` (Step 3)
  - [ ] `milestonesSchema` (Step 4)
- [ ] API routes for indexing:
  - [ ] POST `/api/studies/index-escrow` (after TX1)
  - [ ] POST `/api/studies/index-registry` (after TX2)
  - [ ] POST `/api/studies/index-criteria` (after TX3)
  - [ ] POST `/api/studies/index-milestones` (after TX4 - handles both batch and sequential)

**Smart Contract Enhancement (High Priority)**:
- [ ] Add `addMilestones` batch function to ResearchFundingEscrow.sol
  - [ ] Define `MilestoneInput` struct (type, description, rewardAmount)
  - [ ] Implement `addMilestones(uint256 studyId, MilestoneInput[] memory milestones)`
  - [ ] Return `uint256[] memory milestoneIds` array
  - [ ] Add limit check (max 20 milestones per batch to prevent gas issues)
  - [ ] Emit events for each milestone created
  - [ ] Validate sum of rewards ≤ study remaining funding
  - [ ] Gas optimization: minimize SSTORE operations
- [ ] Update contract tests for batch function
- [ ] Deploy upgraded contract to testnet
- [ ] Update contract ABIs in `packages/nextjs/shared/lib/vzh/`
- [ ] Document gas savings vs individual TXs

**Detailed Smart Contract Specification**:

```solidity
// File: packages/foundry/contracts/funding/ResearchFundingEscrow.sol

/**
 * @notice Input structure for batch milestone creation
 * @dev Lightweight struct to minimize calldata gas costs
 */
struct MilestoneInput {
    MilestoneType milestoneType;
    string description;
    uint256 rewardAmount;
}

/**
 * @notice Add multiple milestones to a study in a single transaction
 * @param studyId The study ID
 * @param milestones Array of milestone inputs (max 20 to prevent gas limit issues)
 * @return milestoneIds Array of created milestone IDs
 *
 * @dev Gas optimizations:
 * - Uses memory arrays to minimize SSTORE operations
 * - Validates total funding once before loop
 * - Emits events inside loop (unavoidable for indexing)
 * - Maximum 20 milestones per call to stay under block gas limit
 *
 * @dev Estimated gas costs:
 * - Base cost: ~120,000 gas (setup + validation)
 * - Per milestone: ~50,000 gas (SSTORE operations + event)
 * - Total for 10 milestones: ~620,000 gas vs ~800,000 for sequential (23% savings)
 * - Total for 20 milestones: ~1,120,000 gas vs ~1,600,000 sequential (30% savings)
 */
function addMilestones(
    uint256 studyId,
    MilestoneInput[] memory milestones
)
    external
    studyExists(studyId)
    onlySponsor(studyId)
    returns (uint256[] memory milestoneIds)
{
    // Input validation
    require(milestones.length > 0, "ResearchFundingEscrow: at least one milestone required");
    require(milestones.length <= 20, "ResearchFundingEscrow: max 20 milestones per batch");
    require(
        studies[studyId].status == StudyStatus.Created ||
        studies[studyId].status == StudyStatus.Funding,
        "ResearchFundingEscrow: cannot add milestones after study started"
    );

    // Calculate and validate total rewards (do this ONCE before loop)
    uint256 totalRewards = 0;
    for (uint256 i = 0; i < milestones.length; i++) {
        require(bytes(milestones[i].description).length > 0, "ResearchFundingEscrow: description required");
        require(milestones[i].rewardAmount > 0, "ResearchFundingEscrow: reward must be > 0");
        totalRewards += milestones[i].rewardAmount;
    }

    // Validate total funding (prevent overflow or excessive allocation)
    require(
        totalRewards <= studies[studyId].remainingFunding,
        "ResearchFundingEscrow: insufficient remaining funding"
    );

    // Create milestones array
    milestoneIds = new uint256[](milestones.length);

    // Create each milestone (optimized loop)
    for (uint256 i = 0; i < milestones.length; i++) {
        milestoneCounter++;
        uint256 milestoneId = milestoneCounter;

        milestoneIds[i] = milestoneId;

        // Create milestone struct (single SSTORE for entire struct)
        milestones[milestoneId] = Milestone({
            id: milestoneId,
            studyId: studyId,
            milestoneType: milestones[i].milestoneType,
            description: milestones[i].description,
            rewardAmount: milestones[i].rewardAmount,
            status: MilestoneStatus.Pending,
            verificationDataHash: bytes32(0),
            createdAt: block.timestamp,
            completedAt: 0,
            verifiedAt: 0
        });

        // Add to study's milestone array
        studyMilestones[studyId].push(milestoneId);

        // Emit event for indexing (required for off-chain sync)
        emit MilestoneCreated(
            studyId,
            milestoneId,
            milestones[i].milestoneType,
            milestones[i].rewardAmount
        );
    }

    // Update remaining funding (single SSTORE at end)
    studies[studyId].remainingFunding -= totalRewards;

    return milestoneIds;
}
```

**Event Definition** (add to contract if not exists):
```solidity
/**
 * @notice Emitted when a new milestone is created
 * @param studyId The study ID
 * @param milestoneId The milestone ID
 * @param milestoneType Type of milestone
 * @param rewardAmount Reward amount for this milestone
 */
event MilestoneCreated(
    uint256 indexed studyId,
    uint256 indexed milestoneId,
    MilestoneType milestoneType,
    uint256 rewardAmount
);
```

**Gas Cost Analysis** (to be measured after implementation):
- **Individual TXs**: ~80k gas × N milestones = 800k for 10 milestones
- **Batch TX**: ~120k base + ~50k per milestone = 620k for 10 milestones
- **Expected savings**: ~23% gas reduction for 10 milestones, ~30% for 20 milestones
- **Signature savings**: 1 wallet signature vs N signatures (huge UX improvement)

**Gas Optimization Strategy & Best Practices**:

**1. Contract-Level Optimizations** (implemented in addMilestones):
```solidity
// ✅ DO: Calculate totals ONCE before loop
uint256 totalRewards = 0;
for (uint256 i = 0; i < milestones.length; i++) {
    totalRewards += milestones[i].rewardAmount;
}
require(totalRewards <= remainingFunding, "insufficient funding");

// ❌ DON'T: Validate inside loop (wastes gas)
for (uint256 i = 0; i < milestones.length; i++) {
    require(milestones[i].rewardAmount <= remainingFunding, "..."); // WRONG!
}

// ✅ DO: Update global state ONCE at end
studies[studyId].remainingFunding -= totalRewards; // Single SSTORE

// ❌ DON'T: Update state in loop
for (uint256 i = 0; i < milestones.length; i++) {
    studies[studyId].remainingFunding -= milestones[i].rewardAmount; // N SSTORE ops!
}

// ✅ DO: Use memory arrays
milestoneIds = new uint256[](milestones.length);

// ✅ DO: Batch limit to prevent gas limit issues
require(milestones.length <= 20, "max 20 milestones per batch");
```

**2. Frontend Strategy Selection** (dynamic based on milestone count):

| Milestone Count | Recommended Strategy | Reasoning | Gas Savings | UX Impact |
|-----------------|---------------------|-----------|-------------|-----------|
| **1-2 milestones** | Sequential (individual TXs) | Simple, clear progress | N/A (overhead > savings) | ⭐⭐⭐⭐⭐ Simple |
| **3-6 milestones** | User choice (default: batch) | Let user decide | ~20-25% | ⭐⭐⭐⭐ Flexible |
| **7-15 milestones** | Batch (recommended) | Significant savings | ~25-30% | ⭐⭐⭐⭐⭐ Fast |
| **16-20 milestones** | Batch (forced) | Near gas limit | ~30% | ⭐⭐⭐⭐ Necessary |
| **>20 milestones** | Chunked batch (2+ TXs) | Prevents gas limit | ~30% per batch | ⭐⭐⭐ Complex |

**3. Chunked Batch Strategy** (for >20 milestones):
```typescript
// Frontend logic for >20 milestones
const BATCH_SIZE = 20;
const chunks = Math.ceil(milestones.length / BATCH_SIZE);

for (let i = 0; i < chunks; i++) {
  const start = i * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, milestones.length);
  const chunk = milestones.slice(start, end);

  // Execute batch TX for this chunk
  const milestoneIds = await addMilestones(studyId, chunk);

  // Index to database immediately
  await indexMilestones(studyId, milestoneIds);

  // Update progress: Batch ${i+1}/${chunks}
  updateProgress((i + 1) / chunks * 100);

  // Allow pause between batches
  if (i < chunks - 1 && pauseRequested) {
    break; // Can resume later
  }
}
```

**4. Gas Cost Breakdown** (per milestone):

| Operation | Gas Cost | Frequency | Total (10 milestones) |
|-----------|----------|-----------|---------------------|
| **Individual TX Strategy** | | | |
| Transaction overhead | 21,000 | × 10 | 210,000 |
| Function call | 5,000 | × 10 | 50,000 |
| SSTORE (milestone data) | 20,000 | × 10 | 200,000 |
| SSTORE (array push) | 20,000 | × 10 | 200,000 |
| Event emission | 3,000 | × 10 | 30,000 |
| Counter increment | 5,000 | × 10 | 50,000 |
| Validation checks | 6,000 | × 10 | 60,000 |
| **TOTAL INDIVIDUAL** | | | **~800,000 gas** |
| | | | |
| **Batch TX Strategy** | | | |
| Transaction overhead | 21,000 | × 1 | 21,000 |
| Function call | 5,000 | × 1 | 5,000 |
| Array allocation | 10,000 | × 1 | 10,000 |
| Total calculation loop | 2,000 | × 1 | 2,000 |
| Global validation | 5,000 | × 1 | 5,000 |
| SSTORE (milestone data) | 20,000 | × 10 | 200,000 |
| SSTORE (array push) | 20,000 | × 10 | 200,000 |
| Event emission | 3,000 | × 10 | 30,000 |
| Counter increment | 5,000 | × 10 | 50,000 |
| SSTORE (remainingFunding) | 5,000 | × 1 | 5,000 |
| Return array copy | 2,000 | × 1 | 2,000 |
| **TOTAL BATCH** | | | **~530,000 gas** |
| | | | |
| **SAVINGS** | | | **~270,000 gas (34%)** |

**5. When to Use Each Strategy**:

```typescript
// Frontend decision logic
function selectMilestoneStrategy(milestoneCount: number): MilestoneStrategy {
  if (milestoneCount <= 2) {
    return {
      mode: 'sequential',
      reason: 'Simple and clear for small counts',
      showChoice: false
    };
  }

  if (milestoneCount <= 6) {
    return {
      mode: 'batch', // default
      reason: 'Recommended for efficiency',
      showChoice: true, // Let user override to sequential
      estimatedSavings: calculateSavings(milestoneCount)
    };
  }

  if (milestoneCount <= 20) {
    return {
      mode: 'batch',
      reason: 'Required for gas efficiency',
      showChoice: false, // Force batch mode
      warning: milestoneCount > 15 ? 'Large batch - may take longer to confirm' : undefined
    };
  }

  // >20 milestones
  return {
    mode: 'chunked-batch',
    chunkSize: 20,
    chunks: Math.ceil(milestoneCount / 20),
    reason: 'Prevents gas limit issues',
    showChoice: false
  };
}
```

**6. User Experience Considerations**:

**Sequential Mode (1-6 milestones)**:
- ✅ Clear progress: "Creating milestone 3 of 5..."
- ✅ Pause/Resume: Can stop and continue later
- ✅ Error recovery: Failed TX doesn't affect previous milestones
- ❌ Multiple signatures: User signs N times (can be tedious)

**Batch Mode (3-20 milestones)**:
- ✅ Single signature: Sign once, done
- ✅ Gas savings: 20-35% cheaper
- ✅ Faster: One confirmation vs N confirmations
- ❌ All-or-nothing: If TX fails, must retry entire batch
- ❌ Less granular progress: "Adding 10 milestones..." (no per-item updates)

**Chunked Batch Mode (>20 milestones)**:
- ✅ Balance: Multiple batches, each optimized
- ✅ Pause between chunks: Can stop after each batch
- ❌ Multiple signatures: Still need 2-3 signatures (but better than 20+)

**7. Error Handling & Recovery**:

```typescript
// Batch mode error recovery
try {
  const milestoneIds = await addMilestones(studyId, milestones);
} catch (error) {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    // Gas estimation failed - batch too large
    showWarning('Batch too large. Switching to chunked mode...');
    return executeChunkedBatch(studyId, milestones, 15); // Reduce chunk size
  } else if (error.code === 'ACTION_REJECTED') {
    // User rejected signature
    showInfo('Transaction cancelled. You can resume creation later.');
  } else {
    // Contract error (e.g., insufficient funding)
    showError(error.message);
    // Allow user to adjust milestone rewards and retry
  }
}

// Sequential mode error recovery
for (let i = 0; i < milestones.length; i++) {
  try {
    const milestoneId = await addMilestone(studyId, milestones[i]);
    markComplete(i); // Save progress
  } catch (error) {
    showError(`Failed at milestone ${i+1}: ${error.message}`);
    // User can fix and resume from milestone i
    return { failedAt: i, completed: i, total: milestones.length };
  }
}
```

**Key Benefits of This Flow**:
✅ **Resumable**: If browser closes or TX fails, can resume from last successful TX
✅ **Just-in-Time**: Only collect data needed for next TX (better UX, less overwhelming)
✅ **Incremental Indexing**: Each TX is indexed immediately, partial data is recoverable
✅ **Clear Progress**: User sees exactly where they are in 4-step blockchain process
✅ **Error Recovery**: Failed TX can be retried without losing previous progress

#### Scripts & Services
- [ ] `sync-blockchain-db.ts` - Sync blockchain events to database
- [ ] `add-milestones-to-studies.ts` - Bulk milestone management
- [ ] `studies.service.ts` - Study business logic
- [ ] `studies-blockchain.service.ts` - Blockchain interaction layer

### Health Types Migration (Future)
**Note**: When migrating health-related features from bk_nextjs, fix type errors in browser-extension:
- [ ] Fix Biomarker type (missing `type` property)
- [ ] Fix BiomarkerValue type (missing `flag` property)
- [ ] Fix Vital type (missing `bloodPressure` property, incorrect number type)
- [ ] Fix Allergy type (missing `dateIdentified`, `type` properties)
- [ ] Ensure @veritas/types health.ts matches actual Prisma schema
- [ ] Update browser-extension to use corrected types

### Folder Structure
```
packages/nextjs/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group
│   ├── (dashboard)/       # Protected routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn auto-generated
│   ├── layout/            # Layout components
│   ├── features/          # Feature-specific
│   │   ├── home/
│   │   ├── studies/
│   │   ├── patient/
│   │   ├── researcher/
│   │   └── wallet/
│   └── shared/            # Reusable components
├── core/
│   ├── domain/            # Business entities
│   ├── use-cases/         # Business logic
│   └── infrastructure/    # External integrations
├── lib/                   # Utilities
├── hooks/                 # Custom React hooks
├── config/                # Configuration files
└── types/                 # TypeScript types
```

---

## 🎨 Priority 5: Component Reusability & Abstraction

### ⚠️ IMPORTANT: Component Verification Checklist
**Before creating ANY new component, ALWAYS verify:**
1. Search existing components in `components/features/` for similar patterns
2. Check if a reusable abstraction exists in `components/ui/`
3. Evaluate if existing component can be refactored for reuse
4. Only create new component if no reusable option exists

### High-Priority Reusable Components to Create

#### Phase 1: Foundation Components (Priority: CRITICAL)
- [ ] **`DataGrid<T>`** - Generic list/grid with loading/error/empty states
  - **Location**: `components/ui/DataGrid.tsx`
  - **Replaces**: StudyList pattern
  - **Reuse in**: Patient studies list, clinic patients, sponsor portfolios, admin users
  - **Impact**: ~300+ LOC saved across 8+ future implementations
  - **Verification note**: Check before implementing any list/grid component

- [ ] **`InfoCard`** - Unified card for features/portals/welcome/actions
  - **Location**: `components/ui/InfoCard.tsx`
  - **Replaces**: FeatureCard, PortalCard, WelcomeCard, QuickActionCard
  - **Impact**: ~260 LOC saved, 4 components unified
  - **Verification note**: Check before creating any simple card component

- [ ] **Move `ProgressIndicator` to `ui/`** - Multi-step wizard progress
  - **Current**: `components/features/studies/ProgressIndicator.tsx`
  - **Move to**: `components/ui/ProgressIndicator.tsx`
  - **Reuse in**: Patient application wizard, clinic voucher wizard, sponsor funding wizard, onboarding flows
  - **Add variants**: vertical (for sidebars), compact, with descriptions
  - **Verification note**: Check before creating any multi-step progress indicator

- [ ] **`ReviewCard`** - Generic pre-submission review sections
  - **Location**: `components/ui/ReviewCard.tsx`
  - **Based on**: ReviewStep pattern (already has staggered animations)
  - **Reuse in**: Patient application review, funding review, voucher review, profile review
  - **Features**: Section-based layout, edit buttons, staggered animations
  - **Impact**: ~445 LOC saved across 5+ review screens
  - **Verification note**: Check before creating any "Review & Confirm" screen

#### Phase 2: Complex Patterns (Priority: HIGH)
- [ ] **`WizardStep`** - Wrapper for wizard step components
  - **Location**: `components/ui/WizardStep.tsx`
  - **Pattern**: Card + motion + icon + alert support
  - **Reuse in**: All future wizard flows (20+ step components)
  - **Impact**: ~900 LOC saved by reducing boilerplate
  - **Verification note**: Check before creating any wizard step component

- [ ] **`EntityCard`** - Base for entity displays (studies, patients, clinics)
  - **Location**: `components/ui/EntityCard.tsx`
  - **Pattern**: Header (status + ID) + title + stats + expandable + actions
  - **Use composition**: Domain-specific cards extend this base
  - **Reuse in**: PatientCard, ClinicCard, ApplicationCard, TransactionCard
  - **Verification note**: Check before creating any entity card

- [ ] **`VerificationDisplay`** - Unified verification/status displays
  - **Location**: `components/ui/VerificationDisplay.tsx`
  - **Variants**: button, card, badge
  - **Based on**: PassportButton + PassportCard patterns
  - **Reuse in**: All verification flows (passport, proofs, attestations)
  - **Verification note**: Check before creating any verification UI

- [ ] **`DetailCard`** - Flexible detail display with sections
  - **Location**: `components/ui/DetailCard.tsx`
  - **Replaces**: StudyHeaderCard, BlockchainInfoCard, MilestonesCard, AnonymousApplicantsCard patterns
  - **Features**: Section-based, grid/list layouts, color-coded sections
  - **Verification note**: Check before creating any detail display card

#### Phase 3: Enhancements (Priority: MEDIUM)
- [ ] **Enhance `StatCard`** - Add new variants
  - **Current**: `components/features/researcher/StatCard.tsx`
  - **Add**: `variant="bar"` (progress bars), `variant="comparison"` (X/Y displays)
  - **Keep as-is**: Already well-abstracted
  - **Status**: ✅ Good example of proper abstraction

### Component Reuse Verification Points

#### When implementing Patient Portal:
- [ ] **Application Wizard**: Use `ProgressIndicator` (move to ui/), `WizardStep`, `ReviewCard`
- [ ] **Health Data Forms**: Use `WizardStep` wrapper pattern
- [ ] **Available Studies**: Use `DataGrid<Study>`, existing `StudyCard`
- [ ] **Proof Status**: Use `VerificationDisplay` card variant
- [ ] ⚠️ Before creating timeline: Check if similar component exists

#### When implementing Clinic Portal:
- [ ] **Patient Registration**: Use `ProgressIndicator`, `WizardStep`, `ReviewCard`
- [ ] **Patient List**: Use `DataGrid<Patient>`, create `PatientCard` using `EntityCard` pattern
- [ ] **Voucher Form**: Use `WizardStep` wrapper
- [ ] **Verification Display**: Use `VerificationDisplay` component
- [ ] ⚠️ Before creating calendar: Check if similar component exists

#### When implementing Sponsor Portal:
- [ ] **Funding Wizard**: Use `ProgressIndicator`, `WizardStep`, `ReviewCard`
- [ ] **Study Selection**: Use `DataGrid<Study>`, existing `StudyCard`
- [ ] **Dashboard Metrics**: Use existing `StatCard` with variants
- [ ] **Transaction History**: Use `DataGrid<Transaction>`, create `TransactionCard` with `EntityCard`
- [ ] ⚠️ Before creating charts: Check if similar component exists

#### When implementing Superadmin Portal:
- [ ] **User Management**: Use `DataGrid<User>`, create `UserCard` with `EntityCard`
- [ ] **Role Assignment**: Use `ProgressIndicator`, `WizardStep`, `ReviewCard`
- [ ] **Analytics**: Use `StatCard` grids, create `ChartCard` if needed
- [ ] **Contract Management**: Use `DetailCard` pattern from BlockchainInfoCard
- [ ] ⚠️ Before creating logs: Check if similar component exists

### Similar Components Already Identified

**Card-based displays** (candidates for `InfoCard` unification):
- `components/features/home/FeatureCard.tsx`
- `components/features/home/PortalCard.tsx`
- `components/features/researcher/WelcomeCard.tsx`
- `components/features/researcher/QuickActionCard.tsx`

**Study detail cards** (candidates for `DetailCard` pattern):
- `components/features/studies/StudyHeaderCard.tsx`
- `components/features/studies/BlockchainInfoCard.tsx`
- `components/features/studies/MilestonesCard.tsx`
- `components/features/studies/AnonymousApplicantsCard.tsx`

**Verification displays** (candidates for `VerificationDisplay`):
- `components/features/passport/PassportButton.tsx`
- `components/features/passport/PassportCard.tsx`

**Already well-abstracted** (keep as-is):
- `components/features/researcher/StatCard.tsx` ✅

### Implementation Metrics

| Component | Current LOC | Unified LOC | Future Instances | Total LOC Saved |
|-----------|-------------|-------------|------------------|-----------------|
| InfoCard | 80 | 60 | 4 | ~260 |
| DataGrid | 100 | 120 | 8+ | ~680+ |
| ProgressIndicator | 64 | 64 | 6+ | 0 (reuse) |
| ReviewCard | 189 | 100 | 5+ | ~445 |
| WizardStep | 125 | 80 | 20+ | ~900 |
| **TOTAL** | - | - | - | **~2,285+** |

---

## 🟣 Priority 6: Browser Extension Review & Contract Integration Audit

### Browser Extension Contract Implementation Review
**Purpose**: Audit existing browser extension contract implementations and ensure consistency with Next.js

**Location**: `packages/browser-extension/`

**Tasks**:
- [ ] Review all smart contract interactions in extension:
  - [ ] HealthIdentitySBT integration (minting, attestations)
  - [ ] Study application flow (ZK proofs, eligibility)
  - [ ] Health data extraction and storage (Nillion)
  - [ ] Provider attestation requests
  - [ ] Milestone completion submissions
- [ ] Document contract integration points in `CONTRACTS_IMPLEMENTATION.md`:
  - [ ] Update HealthIdentitySBT section with extension implementation status
  - [ ] Update StudyParticipationSBT section with extension flow
  - [ ] Update ZKVerifier section with proof generation
  - [ ] Document extension ↔ Next.js communication patterns
- [ ] Identify inconsistencies between packages:
  - [ ] Type mismatches (extension vs @veritas/types)
  - [ ] Contract ABI differences
  - [ ] Event handling discrepancies
  - [ ] API endpoint differences
- [ ] Create integration checklist:
  - [ ] List all contract functions used by extension
  - [ ] Verify Next.js has corresponding endpoints
  - [ ] Ensure event sync coverage
  - [ ] Document missing functionality
- [ ] Gap analysis and improvement opportunities:
  - [ ] Features in extension not in Next.js
  - [ ] Features in Next.js not in extension
  - [ ] Opportunities for code sharing
  - [ ] Potential for monorepo shared packages

**Deliverables**:
- Updated `CONTRACTS_IMPLEMENTATION.md` with extension integration status
- `EXTENSION_INTEGRATION.md` document (new) with:
  - Extension contract usage patterns
  - Next.js ↔ Extension communication flow
  - Shared code opportunities
  - Migration plan for consistency

**Timeline**: After Researcher Flow MVP is complete

---

## 🏥 Priority 6: Multi-Clinic Provider Network (Post-MVP)

### Overview
**Status**: 📋 Planned (After MVP with single clinic)
**Goal**: Support multiple certified providers per study with dynamic compensation splits

### Current MVP Approach (Single Clinic)
- Study has ONE fixed clinic address in Step 1 of wizard
- Fixed compensation split (e.g., 70% clinic, 30% patient)
- Simple implementation for initial launch
- **See Wizard Flow** in Priority 4 → Pages Layer → Create Study Wizard for implementation details

### Future: Network of Certified Providers

#### Phase 1: Provider Requirements System
- [ ] Create `StudyProviderRequirements` model (database)
  - Minimum certification level (Individual, Clinic, Hospital, Government)
  - Required specializations array (e.g., ["cardiology", "laboratory"])
  - Required equipment/capabilities (e.g., ["MRI", "CT_Scanner", "Lab_A1C"])
  - Required certifications (e.g., ["CLIA", "CAP", "ISO_15189"])
  - Geographic restrictions (countries, regions)
  - Default compensation splits
- [ ] Add `ProviderCapability` model
  - Equipment inventory per provider
  - Additional certifications beyond base license
  - Service capacity (max daily participants)
  - Geographic service areas
  - Verification system

#### Phase 2: Provider Application & Approval Flow
- [ ] Provider discovery system
  - Certified providers can browse open studies
  - Auto-check eligibility based on requirements
  - Apply to participate in study
- [ ] Researcher provider management
  - Review provider applications
  - Approve/reject providers for study
  - Override compensation splits per provider
  - Set capacity limits per provider
- [ ] Create `StudyApprovedProvider` model
  - Many-to-many relationship: Study ↔ Providers
  - Provider-specific compensation config
  - Capacity tracking (max participants per provider)
  - Activation status per provider

#### Phase 3: Multi-Provider Patient Enrollment
- [ ] Patient provider selection
  - Show list of approved providers for study
  - Filter by location, specialization, capacity
  - Patient selects preferred provider
- [ ] Update `Participation` model
  - Track enrolling provider ID
  - Snapshot compensation splits at enrollment time
  - Provider-specific milestone tracking
- [ ] Provider dashboard
  - View assigned patients
  - Track milestone completions
  - Monitor compensation earned

#### Phase 4: Dynamic Compensation Distribution
- [ ] Smart contract modifications (ResearchFundingEscrow V2+)
  - Support provider-specific splits per participant
  - Payment routing: Patient % → Patient, Clinic % → Enrolling Provider
  - Handle multiple providers in same study
  - Proportional refunds if study cancelled
- [ ] Payment reconciliation system
  - Track payments per provider
  - Generate provider payment reports
  - Handle disputes/adjustments

#### Phase 5: Advanced Provider Features
- [ ] Provider categories
  - Laboratories (blood work, imaging, pathology)
  - Clinics/Consultorios (primary care, specialist visits)
  - Hospitals (inpatient studies, complex procedures)
  - Home Health Services (remote monitoring)
- [ ] Equipment-based matching
  - Auto-match studies requiring specific equipment
  - Equipment verification and calibration tracking
  - Capacity planning based on equipment availability
- [ ] Provider reputation system
  - Completion rates per provider
  - Patient feedback/ratings
  - Protocol compliance scores
  - Impact on future study applications

### Database Schema Additions

```prisma
// Provider requirements for each study
model StudyProviderRequirements {
  id                        String   @id @default(cuid())
  studyId                   String   @unique
  study                     Study    @relation(fields: [studyId], references: [id])

  minCertificationLevel     Int      // CertificationLevel enum
  requiredSpecializations   String[] // e.g., ["cardiology", "laboratory"]
  requiredEquipment         String[] // e.g., ["MRI", "CT_Scanner"]
  requiredCertifications    String[] // e.g., ["CLIA", "CAP"]
  allowedCountries          String[]
  allowedRegions            String[]

  defaultPatientPercentage  Int      // Basis points (3000 = 30%)
  defaultClinicPercentage   Int      // Basis points (7000 = 70%)

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}

// Approved providers for a specific study
model StudyApprovedProvider {
  id                    String   @id @default(cuid())
  studyId               String
  study                 Study    @relation(fields: [studyId], references: [id])
  providerId            String
  provider              MedicalProvider @relation(fields: [providerId], references: [id])

  patientPercentage     Int      // Can override defaults
  clinicPercentage      Int
  maxParticipants       Int?     // Capacity limit
  currentParticipants   Int      @default(0)

  isActive              Boolean  @default(true)
  approvedAt            DateTime @default(now())
  approvedBy            String

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([studyId, providerId])
}

// Provider capabilities and equipment
model ProviderCapability {
  id                    String   @id @default(cuid())
  providerId            String   @unique
  provider              MedicalProvider @relation(fields: [providerId], references: [id])

  equipment             String[] // ["MRI", "CT_Scanner", "Lab_A1C"]
  certifications        String[] // ["CLIA", "CAP", "ISO_15189"]
  maxDailyParticipants  Int      @default(10)
  serviceRegions        String[]

  verifiedAt            DateTime
  verifiedBy            String

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Smart Contract Modifications Required

**ResearchFundingEscrow V2:**
- [ ] Add provider tracking to `Participation` struct
- [ ] Modify `releasePayment()` to use provider-specific splits
- [ ] Support multiple providers per study
- [ ] Proportional refunds considering all funders + providers

**StudyRegistry V2:**
- [ ] Add provider requirements to study metadata
- [ ] Events for provider approval/removal
- [ ] Query functions for approved providers

### UI Components Needed

**Researcher Portal:**
- [ ] Provider requirements configuration (in wizard Step 2)
- [ ] Provider application review dashboard
- [ ] Provider management page (approve, set limits, adjust splits)

**Provider Portal:**
- [ ] Study discovery and filtering
- [ ] Application submission form
- [ ] Enrolled patients dashboard
- [ ] Milestone verification interface
- [ ] Earnings/payment tracking

**Patient Portal:**
- [ ] Provider selection interface (during application)
- [ ] Provider profile viewing (specializations, equipment, ratings)
- [ ] Location-based provider filtering

### Migration Path from MVP

1. **MVP Launch** (Weeks 1-4):
   - Single clinic address in study
   - Fixed 70/30 split
   - Manual provider assignment

2. **Phase 1** (Weeks 5-8):
   - Add database models
   - Build provider requirements config
   - Create provider capability registry

3. **Phase 2** (Weeks 9-12):
   - Implement application/approval flow
   - Build researcher provider management
   - Deploy ResearchFundingEscrow V2

4. **Phase 3** (Weeks 13-16):
   - Patient provider selection
   - Multi-provider enrollment
   - Dynamic compensation routing

5. **Phase 4** (Weeks 17-20):
   - Advanced matching algorithms
   - Provider reputation system
   - Analytics and reporting

### Key Design Principles

✅ **Backward Compatibility**: MVP single-clinic studies still work
✅ **Gradual Rollout**: Can enable multi-provider per study basis
✅ **Provider Autonomy**: Providers choose which studies to join
✅ **Researcher Control**: Final approval on all providers
✅ **Flexible Compensation**: Different splits per provider if needed
✅ **Transparent Tracking**: All provider-patient-payment relationships on-chain
✅ **Scalability**: Support 100s of providers per study if needed

### Integration with Other Payment Enhancements

This multi-clinic architecture MUST support future payment innovations:

**🔗 Links to Related Priorities:**

1. **RWA Rewards Integration** (from Smart Contract Analysis):
   - Multi-asset payments: ETH, ERC-20, ERC-721, ERC-1155
   - Pharmacy discount vouchers (NFTs)
   - Consultation tokens
   - **Impact**: Provider compensation can include RWA rewards, not just USDC
   - **Milestone struct** will need `AssetPayment[]` array
   - **Split logic** must handle multiple asset types per milestone

2. **Mixed Compensation Models** (from Smart Contract Analysis):
   - Upfront enrollment payments
   - Per-visit/per-appointment payments
   - Completion bonuses
   - Conditional bonuses (time-based, quality-based)
   - **Impact**: Each milestone type can have different split percentages
   - **Provider-specific configs** may vary compensation by milestone type

3. **Multi-Sponsor Funding** (from Smart Contract Analysis):
   - Track all funders, not just primary sponsor
   - Proportional refunds on study cancellation
   - Sponsor attribution and rewards
   - **Impact**: Provider compensation comes from multiple funding sources
   - **Refund logic** must consider provider payments already released

### Implementation Considerations for Future Integrations

When implementing multi-clinic system, keep extensible for:

**Database Schema Extensibility:**
```prisma
// Future: StudyApprovedProvider can have milestone-specific configs
model StudyApprovedProvider {
  // ... existing fields ...

  // FUTURE: Override compensation per milestone type
  milestoneCompensationOverrides Json? // { "Enrollment": {patient: 20, clinic: 80}, "FollowUp": {patient: 40, clinic: 60} }

  // FUTURE: RWA rewards specific to this provider
  rwaRewardConfig Json? // { "assetType": "ERC721", "contractAddress": "0x...", "tokenIds": [...] }

  // FUTURE: Conditional bonus settings
  bonusConfig Json? // { "earlyCompletion": 100, "perfectAttendance": 50 }
}
```

**Smart Contract Extensibility:**
```solidity
// Future V3+: Provider-specific milestone configs
struct ProviderMilestoneConfig {
    address providerAddress;
    uint256 milestoneId;
    uint256 patientPercentage;  // Can differ per provider
    uint256 clinicPercentage;
    AssetPayment[] rwaRewards;  // Additional rewards
}
```

**Wizard Flow Extensibility:**
- Step 1 (Escrow) collects DEFAULT compensation splits
- Post-MVP: Provider approval flow allows PER-PROVIDER overrides
- Step 4 (Milestones) allows PER-MILESTONE type compensation configs
- Future: Step 4 includes RWA reward configuration per milestone

**Migration Path:**
1. **MVP** (Week 1-4): Single clinic, simple splits, USDC only
2. **Phase 1** (Week 5-8): Multi-clinic, default splits, USDC only
3. **Phase 2** (Week 9-12): Per-provider custom splits, USDC only
4. **Phase 3** (Week 13-16): Per-milestone splits, USDC only
5. **Phase 4** (Week 17-20): RWA rewards (NFTs, vouchers)
6. **Phase 5** (Week 21-24): Conditional bonuses, complex models

---

## 🟢 Priority 7: Integration Services

### Nillion Integration
- [ ] Setup Nillion client
- [ ] Private data storage hooks
- [ ] Encryption/decryption utilities
- [ ] User collections management

### Human Passport Integration
- [ ] Human Passport verification (score-based Sybil resistance)
- [ ] Stamp collection and verification
- [ ] Humanity score tracking and display
- [ ] Verification badges UI (bronze/silver/gold tiers)
- [ ] Onchain stamp validation
- [ ] Score threshold enforcement for features

### Reown (WalletConnect) Features
- [ ] Multi-wallet support
- [ ] WalletConnect v2 integration
- [ ] Mobile wallet deep linking
- [ ] QR code connection

---

## 📝 Documentation Tasks

### Code Documentation
- [ ] Add JSDoc to all public functions
- [ ] Create component Storybook stories
- [ ] Write integration guides
- [ ] API documentation

### Architecture Documentation
- [ ] Document folder structure
- [ ] Create component tree diagram
- [ ] Data flow diagrams
- [ ] Security best practices

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Component tests (React Testing Library)
- [ ] Hook tests
- [ ] Utility function tests
- [ ] Business logic tests

### Integration Tests
- [ ] Auth flow tests
- [ ] Wallet connection tests
- [ ] API route tests

### E2E Tests
- [ ] User journey tests (Playwright)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness

---

## 🚀 Performance Optimization

### Code Splitting
- [ ] Dynamic imports for heavy components
- [ ] Route-based code splitting
- [ ] Lazy loading images

### Caching Strategy
- [ ] React Query configuration
- [ ] SWR for real-time data
- [ ] Service worker for offline support

### Bundle Optimization
- [ ] Analyze bundle size
- [ ] Tree shaking verification
- [ ] Remove unused dependencies

---

## 🎨 Design System

### Theme System
- [ ] Light/Dark mode toggle
- [ ] Theme persistence (localStorage)
- [ ] System preference detection
- [ ] Smooth theme transitions

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader testing
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Color contrast verification

### Responsive Design
- [ ] Mobile-first approach
- [ ] Tablet breakpoints
- [ ] Desktop optimization
- [ ] Touch-friendly targets

---

## 🔐 Security

### Best Practices
- [ ] Input validation and sanitization
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting on API routes
- [ ] Secure session management
- [ ] Environment variable validation

### Wallet Security
- [ ] Signature verification
- [ ] Transaction simulation
- [ ] Phishing detection
- [ ] Malicious contract warnings

---

## 📊 Monitoring & Analytics

### Error Tracking
- [ ] Sentry integration
- [ ] Error boundaries
- [ ] User feedback forms

### Performance Monitoring
- [ ] Web Vitals tracking
- [ ] Custom metrics
- [ ] Load time optimization

### User Analytics
- [ ] Privacy-friendly analytics
- [ ] User journey tracking
- [ ] A/B testing setup

---

## 🔄 CI/CD Improvements

### GitHub Actions
- [ ] Automated testing on PR
- [ ] Lighthouse CI for performance
- [ ] Visual regression testing
- [ ] Automated dependency updates

### Deployment
- [ ] Staging environment
- [ ] Production environment
- [ ] Rollback strategy
- [ ] Blue-green deployment

---

## 📱 Progressive Web App (PWA)

### PWA Features
- [ ] Service worker setup
- [ ] Offline functionality
- [ ] Install prompt
- [ ] Push notifications
- [ ] App manifest

---

## Notes

- **Architecture Philosophy**: Clean, maintainable, testable
- **Component Strategy**: Atomic design with shadcn as base
- **State Management**: React Query for server state, Zustand for client state
- **Styling**: Tailwind CSS + shadcn design tokens
- **Type Safety**: Strict TypeScript, no `any` types
- **Testing**: High coverage on critical paths
- **Performance**: Target <3s load time, >90 Lighthouse score

---

**Last Updated**: 2025-10-19
**Current Focus**:
- Priority 4 - Researcher Flow (Create Study Wizard ✅ Complete with clean architecture refactor)
- Priority 5 - Component Reusability Analysis (Component audit complete, reuse strategy documented)
