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
- [x] `/researcher/create-study/page.tsx` - Create study multi-step wizard ✅
  - [x] Refactored to clean architecture (12 lines, imports StudyCreationWizard)
  - [x] Extracted 7 reusable components with animations:
    - ProgressIndicator, BasicInfoStep, FundingStep, AgeVerificationStep
    - MedicalEligibilityStep, ReviewStep, StudyCreationWizard

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

## 🟣 Priority 5: Browser Extension Review & Contract Integration Audit

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

## 🟢 Priority 6: Integration Services

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
**Current Focus**: Priority 4 - Researcher Flow Implementation (After complete schema & types setup)
