-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('patient', 'clinic', 'researcher', 'sponsor', 'admin', 'superadmin', 'guest');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('created', 'funding', 'recruiting', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'verified', 'approved', 'rejected', 'enrolled');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('initial', 'intermediate', 'followup', 'completion');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "humanityScore" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "displayName" TEXT,
    "avatar" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromRole" "UserRole",
    "toRole" "UserRole" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "passport_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "passingScore" BOOLEAN NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "stampScores" JSONB,
    "lastScoreTimestamp" TIMESTAMP(3) NOT NULL,
    "expirationTimestamp" TIMESTAMP(3) NOT NULL,
    "apiResponseRaw" JSONB,
    "minScoreRequired" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passport_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studies" (
    "id" TEXT NOT NULL,
    "registryId" INTEGER NOT NULL,
    "escrowId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "researcherAddress" TEXT NOT NULL,
    "status" "StudyStatus" NOT NULL,
    "totalFunding" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "chainId" INTEGER NOT NULL DEFAULT 11155420,
    "escrowTxHash" TEXT NOT NULL,
    "registryTxHash" TEXT NOT NULL,
    "criteriaTxHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "escrowBlockNumber" BIGINT NOT NULL,
    "registryBlockNumber" BIGINT NOT NULL,

    CONSTRAINT "studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_deposits" (
    "id" TEXT NOT NULL,
    "sponsorAddress" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "escrowId" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155420,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_criteria" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "escrowId" INTEGER NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "eligibilityCodeHash" TEXT NOT NULL,
    "hba1cMin" DOUBLE PRECISION,
    "hba1cMax" DOUBLE PRECISION,
    "ldlMin" DOUBLE PRECISION,
    "ldlMax" DOUBLE PRECISION,
    "cholesterolMin" DOUBLE PRECISION,
    "cholesterolMax" DOUBLE PRECISION,
    "hdlMin" DOUBLE PRECISION,
    "hdlMax" DOUBLE PRECISION,
    "triglyceridesMin" DOUBLE PRECISION,
    "triglyceridesMax" DOUBLE PRECISION,
    "systolicBPMin" DOUBLE PRECISION,
    "systolicBPMax" DOUBLE PRECISION,
    "diastolicBPMin" DOUBLE PRECISION,
    "diastolicBPMax" DOUBLE PRECISION,
    "bmiMin" DOUBLE PRECISION,
    "bmiMax" DOUBLE PRECISION,
    "heartRateMin" DOUBLE PRECISION,
    "heartRateMax" DOUBLE PRECISION,
    "requiredMedications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedMedications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedAllergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredDiagnoses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedDiagnoses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chainId" INTEGER NOT NULL DEFAULT 11155420,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_milestones" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "escrowId" INTEGER NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "milestoneType" "MilestoneType" NOT NULL,
    "description" TEXT NOT NULL,
    "rewardAmount" DECIMAL(20,2) NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155420,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_applications" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "registryId" INTEGER NOT NULL,
    "applicantNumber" INTEGER NOT NULL,
    "proofVerified" BOOLEAN NOT NULL DEFAULT false,
    "proofTransactionHash" TEXT,
    "proofBlockNumber" BIGINT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "enrolled" BOOLEAN NOT NULL DEFAULT false,
    "enrollmentTokenId" INTEGER,
    "enrollmentTxHash" TEXT,
    "enrollmentBlockNumber" BIGINT,
    "patientAddress" TEXT,
    "patientSBTTokenId" INTEGER,
    "chainId" INTEGER NOT NULL,
    "applicationTxHash" TEXT NOT NULL,
    "applicationBlockNumber" BIGINT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "users"("address");

-- CreateIndex
CREATE INDEX "users_address_idx" ON "users"("address");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isVerified_idx" ON "users"("isVerified");

-- CreateIndex
CREATE INDEX "role_changes_userId_idx" ON "role_changes"("userId");

-- CreateIndex
CREATE INDEX "role_changes_changedBy_idx" ON "role_changes"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "passport_verifications_userId_idx" ON "passport_verifications"("userId");

-- CreateIndex
CREATE INDEX "passport_verifications_address_idx" ON "passport_verifications"("address");

-- CreateIndex
CREATE INDEX "passport_verifications_verified_idx" ON "passport_verifications"("verified");

-- CreateIndex
CREATE INDEX "passport_verifications_verifiedAt_idx" ON "passport_verifications"("verifiedAt");

-- CreateIndex
CREATE INDEX "passport_verifications_expirationTimestamp_idx" ON "passport_verifications"("expirationTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "passport_verifications_userId_verifiedAt_key" ON "passport_verifications"("userId", "verifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "studies_registryId_key" ON "studies"("registryId");

-- CreateIndex
CREATE INDEX "studies_researcherAddress_idx" ON "studies"("researcherAddress");

-- CreateIndex
CREATE INDEX "studies_registryId_idx" ON "studies"("registryId");

-- CreateIndex
CREATE INDEX "studies_escrowId_idx" ON "studies"("escrowId");

-- CreateIndex
CREATE INDEX "studies_status_idx" ON "studies"("status");

-- CreateIndex
CREATE INDEX "studies_chainId_idx" ON "studies"("chainId");

-- CreateIndex
CREATE INDEX "sponsor_deposits_sponsorAddress_idx" ON "sponsor_deposits"("sponsorAddress");

-- CreateIndex
CREATE INDEX "sponsor_deposits_studyId_idx" ON "sponsor_deposits"("studyId");

-- CreateIndex
CREATE INDEX "sponsor_deposits_escrowId_idx" ON "sponsor_deposits"("escrowId");

-- CreateIndex
CREATE INDEX "sponsor_deposits_transactionHash_idx" ON "sponsor_deposits"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "study_criteria_studyId_key" ON "study_criteria"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "study_criteria_escrowId_key" ON "study_criteria"("escrowId");

-- CreateIndex
CREATE INDEX "study_criteria_escrowId_idx" ON "study_criteria"("escrowId");

-- CreateIndex
CREATE INDEX "study_criteria_transactionHash_idx" ON "study_criteria"("transactionHash");

-- CreateIndex
CREATE INDEX "study_milestones_studyId_idx" ON "study_milestones"("studyId");

-- CreateIndex
CREATE INDEX "study_milestones_escrowId_idx" ON "study_milestones"("escrowId");

-- CreateIndex
CREATE INDEX "study_milestones_transactionHash_idx" ON "study_milestones"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "study_milestones_escrowId_milestoneId_key" ON "study_milestones"("escrowId", "milestoneId");

-- CreateIndex
CREATE INDEX "study_applications_studyId_idx" ON "study_applications"("studyId");

-- CreateIndex
CREATE INDEX "study_applications_registryId_idx" ON "study_applications"("registryId");

-- CreateIndex
CREATE INDEX "study_applications_status_idx" ON "study_applications"("status");

-- CreateIndex
CREATE INDEX "study_applications_patientAddress_idx" ON "study_applications"("patientAddress");

-- CreateIndex
CREATE INDEX "study_applications_applicationTxHash_idx" ON "study_applications"("applicationTxHash");

-- CreateIndex
CREATE INDEX "study_applications_proofTransactionHash_idx" ON "study_applications"("proofTransactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "study_applications_registryId_applicantNumber_key" ON "study_applications"("registryId", "applicantNumber");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_verifications" ADD CONSTRAINT "passport_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_deposits" ADD CONSTRAINT "sponsor_deposits_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_criteria" ADD CONSTRAINT "study_criteria_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_milestones" ADD CONSTRAINT "study_milestones_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_applications" ADD CONSTRAINT "study_applications_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
