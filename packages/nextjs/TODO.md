# TODO - Veritas Zero Health (Next.js)

## 🎯 Current Phase: Foundation & Design System

---

## 🔴 Priority 1: Design System & Components (NOW)

### Shadcn Components Setup
- [ ] Install base shadcn components:
  - [ ] Button
  - [ ] Card
  - [ ] Badge
  - [ ] Dropdown Menu
  - [ ] Avatar
  - [ ] Separator
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
- [ ] Configure AppKit theme to match DASHI colors
- [ ] Customize button styles, border radius, fonts
- [ ] Test on mobile devices

---

## 🟡 Priority 2: Advanced Wallet Component (NEXT)

### Professional ConnectWallet Component
**Location**: `components/wallet/WalletButton.tsx`

**Features to implement gradually:**

#### Phase 1: Basic Connection + SIWX
- [ ] Integrate SIWX (Sign-In with X) instead of SIWE
- [ ] Single component: Connect + Sign In with NextAuth
- [ ] Loading states and error handling
- [ ] Disconnect functionality

#### Phase 2: Wallet Info Dropdown
- [ ] Display wallet address (truncated with copy button)
- [ ] Show native token balance (ETH, OP, etc.)
- [ ] Display connected network with icon
- [ ] Network switcher dropdown
- [ ] ENS name resolution and display
- [ ] Avatar from ENS or generated

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

## 🟢 Priority 3: Authentication & Authorization

### NextAuth + SIWX Integration
- [ ] Setup NextAuth with SIWX provider
- [ ] Create auth API routes
- [ ] Implement session management
- [ ] Add role-based access control (Patient, Researcher, Clinic, Sponsor)
- [ ] Create RouteGuard component for protected routes
- [ ] Add auto-sign middleware

### Auth UI Components
- [ ] SignIn modal/page
- [ ] Session expiry warning
- [ ] Re-authentication flow
- [ ] Verification badges (Human Protocol)

---

## 🔵 Priority 4: Core Architecture

### Clean Architecture Setup
- [ ] Create `core/` folder structure:
  - [ ] `domain/` - Entities and interfaces
  - [ ] `use-cases/` - Business logic
  - [ ] `infrastructure/` - External services
- [ ] Implement repository pattern
- [ ] Add dependency injection

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

## 🟣 Priority 5: Integration Services

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

**Last Updated**: 2025-10-18
**Current Focus**: Priority 1 - Design System & Components
