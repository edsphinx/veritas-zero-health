-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "humanityScore" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "email" TEXT,
    "avatar" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromRole" TEXT,
    "toRole" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "users"("address");

-- CreateIndex
CREATE INDEX "users_address_idx" ON "users"("address");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "role_changes_userId_idx" ON "role_changes"("userId");

-- CreateIndex
CREATE INDEX "role_changes_changedBy_idx" ON "role_changes"("changedBy");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_address_idx" ON "sessions"("address");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
