# Centralized Authentication & Authorization System

This directory contains the centralized authentication and authorization system for Veritas Zero Health.

## Overview

All authentication and role-based access control (RBAC) is managed through a unified configuration system. This ensures consistency across the entire application and makes it easy to update security policies.

## Architecture

```
shared/lib/auth/
├── role-config.ts          # ⭐ Central role & portal configuration
├── role-detector.ts        # Role detection from .env mappings
├── superadmin.ts          # SuperAdmin address whitelist
└── README.md              # This file
```

## Key Files

### `role-config.ts` - Single Source of Truth

This file contains the centralized configuration for all portals and roles:

```typescript
import { getPortalConfig } from '@/shared/lib/auth/role-config';

// Get configuration for a portal
const config = getPortalConfig('researcher');
// Returns: {
//   portal: 'researcher',
//   allowedRoles: [UserRole.RESEARCHER],
//   requireAuth: true,
//   requireVerification: false,
//   redirectOnDenied: '/',
// }
```

**What's configured:**
- **allowedRoles**: Which roles can access each portal
- **requireAuth**: Whether wallet connection is required
- **requireVerification**: Whether Gitcoin Passport verification is required
- **requiredPermissions**: Optional specific permissions needed
- **redirectOnDenied**: Where to redirect unauthorized users

### Available Functions

```typescript
// Get portal config by name
getPortalConfig('patient') → PortalConfig | null

// Get portal config by role
getPortalConfigByRole(UserRole.RESEARCHER) → PortalConfig | null

// Check if role can access portal
canRoleAccessPortal(UserRole.CLINIC, 'clinic') → boolean

// Get default portal path for role
getDefaultPortalPath(UserRole.SUPERADMIN) → '/superadmin'

// Get display name for role
getRoleDisplayName(UserRole.PATIENT) → 'Patient'
```

## Usage

### 1. Creating a New Portal Layout

All portal layouts automatically use the centralized config:

```typescript
// components/layout/PortalLayout.tsx
export function MyNewPortalLayout({ children }: { children: ReactNode }) {
  const config = getPortalConfig('mynewportal'); // Must be defined in role-config.ts
  if (!config) throw new Error('Portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
      background="default"
      showSidebar={true}
    >
      {children}
    </PortalLayout>
  );
}
```

### 2. Adding a New Portal Configuration

Edit `role-config.ts` and add your portal to `PORTAL_CONFIGS`:

```typescript
export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  // ... existing configs ...

  mynewportal: {
    portal: 'mynewportal',
    allowedRoles: [UserRole.MYNEWROLE],
    requireAuth: true,
    requireVerification: false,
    redirectOnDenied: '/',
  },
};
```

### 3. Using in Route Guards

The `RouteGuard` component automatically uses `useRouteAccess` which checks these configs:

```typescript
import { RouteGuard } from '@/components/auth/RouteGuard';
import { getPortalConfig } from '@/shared/lib/auth/role-config';

export default function MyProtectedPage() {
  const config = getPortalConfig('researcher');

  return (
    <RouteGuard
      requireAuth={config.requireAuth}
      allowedRoles={config.allowedRoles}
    >
      <MyPageContent />
    </RouteGuard>
  );
}
```

### 4. Checking Access in Components

```typescript
import { useAuth } from '@/shared/hooks/useAuth';
import { canRoleAccessPortal } from '@/shared/lib/auth/role-config';

function MyComponent() {
  const { role } = useAuth();

  const canAccessResearcher = canRoleAccessPortal(role, 'researcher');

  return (
    <div>
      {canAccessResearcher && (
        <Link href="/researcher">Researcher Portal</Link>
      )}
    </div>
  );
}
```

## Role Priority System

Roles are detected in the following priority order (see `useAuth.ts`):

1. **SuperAdmin** - From `superadmin.ts` whitelist (highest priority)
2. **Database** - From Supabase via Prisma
3. **.env Mappings** - From `role-detector.ts` (test addresses)
4. **Default** - PATIENT (lowest priority)

## Current Portal Configurations

| Portal | Allowed Roles | Auth Required | Verification Required |
|--------|--------------|---------------|----------------------|
| patient | PATIENT | ✅ | ❌ |
| clinic | CLINIC | ✅ | ❌ |
| researcher | RESEARCHER | ✅ | ❌ |
| sponsor | SPONSOR | ✅ | ❌ |
| admin | ADMIN | ✅ | ❌ |
| superadmin | SUPERADMIN | ✅ | ❌ |

## Enabling Gitcoin Passport Verification

When ready to enable Gitcoin Passport verification:

```typescript
// In role-config.ts
researcher: {
  portal: 'researcher',
  allowedRoles: [UserRole.RESEARCHER],
  requireAuth: true,
  requireVerification: true, // ✅ Enable this
  redirectOnDenied: '/onboarding',
},
```

## Best Practices

1. **Always use `getPortalConfig()`** instead of hardcoding role requirements
2. **Never bypass the centralized config** - all access control should flow through it
3. **Update role-config.ts first** before adding new portals or changing access rules
4. **Test role switching** after making changes to configs
5. **Keep redirectOnDenied consistent** - typically `/` or `/onboarding`

## Testing

You can switch roles for testing using the `useAuth` hook:

```typescript
const { switchRole } = useAuth();

// Switch to researcher for testing
await switchRole(UserRole.RESEARCHER);
```

## Related Files

- `shared/hooks/useAuth.ts` - Main authentication hook
- `shared/hooks/useRouteAccess.ts` - Route access checking (part of useAuth)
- `components/auth/RouteGuard.tsx` - Route protection component
- `components/layout/PortalLayout.tsx` - Portal layout components

## Future Enhancements

- [ ] Add fine-grained permission checking per portal
- [ ] Add role-based feature flags
- [ ] Add audit logging for role changes
- [ ] Add time-based access restrictions
- [ ] Add IP-based access controls for SuperAdmin
