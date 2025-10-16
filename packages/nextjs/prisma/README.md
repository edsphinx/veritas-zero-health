# Prisma + Supabase Setup

## Quick Start

### 1. Configure Supabase Connection

Update `.env` with your Supabase credentials:

```bash
# Get these from your Supabase project settings → Database
DATABASE_URL="postgresql://postgres.PROJECT_ID:[YOUR-PASSWORD]@aws-X-us-east-X.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_ID:[YOUR-PASSWORD]@aws-X-us-east-X.pooler.supabase.com:5432/postgres"
```

### 2. Push Schema to Database

```bash
pnpm db:push
```

This creates the tables in your Supabase database.

### 3. Seed Test Users

```bash
pnpm db:seed
```

This populates the database with test users from `.env`:
- Researchers (RESEARCHER_1_ADDRESS, RESEARCHER_2_ADDRESS)
- Sponsors (SPONSOR_1_ADDRESS, SPONSOR_2_ADDRESS)
- Clinics (CLINIC_1_ADDRESS, CLINIC_2_ADDRESS)
- Patients (PATIENT_1_ADDRESS, PATIENT_2_ADDRESS)

### 4. Generate Prisma Client

```bash
pnpm prisma:generate
```

## Available Scripts

- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:migrate` - Create and apply migrations
- `pnpm prisma:seed` - Seed database with test data
- `pnpm prisma:studio` - Open Prisma Studio (GUI)
- `pnpm db:push` - Push schema without migrations (dev only)
- `pnpm db:seed` - Run seed script

## Database Schema

### User Model
```prisma
model User {
  id           String    @id @default(cuid())
  address      String    @unique  // Wallet address (lowercase)
  role         String    // 'patient', 'clinic', 'researcher', 'sponsor', 'admin', 'superadmin'
  isVerified   Boolean   @default(false)
  humanityScore Int?
  verifiedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastActiveAt DateTime  @default(now())
  displayName  String?
  email        String?
  avatar       String?
}
```

### RoleChange Model (Audit Trail)
```prisma
model RoleChange {
  id        String   @id @default(cuid())
  userId    String
  fromRole  String?
  toRole    String
  changedBy String   // Address of admin
  reason    String?
  createdAt DateTime @default(now())
}
```

### Session Model
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  address   String
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

## Usage in Code

```typescript
import { prisma } from '@/shared/lib/prisma';

// Get user by address
const user = await prisma.user.findUnique({
  where: { address: '0x...' },
});

// Create or update user
const user = await prisma.user.upsert({
  where: { address: '0x...' },
  update: { role: 'clinic', lastActiveAt: new Date() },
  create: {
    address: '0x...',
    role: 'clinic',
    isVerified: true,
  },
});

// Get all users with a specific role
const clinics = await prisma.user.findMany({
  where: { role: 'clinic' },
});
```

## Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` and `DIRECT_URL` in `.env`
- Make sure your IP is whitelisted in Supabase (Settings → Database → Connection pooling)

### "Prisma Client not generated"
```bash
pnpm prisma:generate
```

### View data in Supabase Dashboard
1. Go to your Supabase project
2. Click "Table Editor" in sidebar
3. View `users`, `role_changes`, and `sessions` tables
