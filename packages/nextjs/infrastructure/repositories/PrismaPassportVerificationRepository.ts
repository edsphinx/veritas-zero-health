/**
 * Prisma PassportVerification Repository Implementation
 *
 * Concrete implementation of IPassportVerificationRepository using Prisma ORM
 *
 * Type Strategy:
 * - Prisma returns native types (Date, Json)
 * - We convert to PassportVerificationDB (intermediate type)
 * - Then to PassportVerificationAPI using toAPIPassportVerification()
 * - This keeps DB types accurate while ensuring API compatibility
 */

import { PrismaClient, type PassportVerification as PrismaPassportVerification } from '@prisma/client';
import type { IPassportVerificationRepository } from '@/core/domain/repositories';
import type {
  PassportVerificationAPI,
  PassportVerificationDB,
  CreatePassportVerificationData,
  UpdatePassportVerificationData,
} from '@veritas/types';
import { toAPIPassportVerification } from '@veritas/types';

// Helper to convert Prisma type to PassportVerificationDB
function toPassportVerificationDB(
  prisma: PrismaPassportVerification
): PassportVerificationDB {
  return {
    id: prisma.id,
    userId: prisma.userId,
    address: prisma.address,
    score: prisma.score,
    threshold: prisma.threshold,
    passingScore: prisma.passingScore,
    verified: prisma.verified,
    stampScores: prisma.stampScores as Record<string, number> | null,
    lastScoreTimestamp: prisma.lastScoreTimestamp,
    expirationTimestamp: prisma.expirationTimestamp,
    apiResponseRaw: prisma.apiResponseRaw,
    minScoreRequired: prisma.minScoreRequired,
    verifiedAt: prisma.verifiedAt,
    createdAt: prisma.createdAt,
    updatedAt: prisma.updatedAt,
  };
}

export class PrismaPassportVerificationRepository
  implements IPassportVerificationRepository
{
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<PassportVerificationAPI | null> {
    const prismaVerification = await this.prisma.passportVerification.findUnique({
      where: { id },
    });

    if (!prismaVerification) return null;

    const verificationDB = toPassportVerificationDB(prismaVerification);
    return toAPIPassportVerification(verificationDB);
  }

  async findLatestByUserId(userId: string): Promise<PassportVerificationAPI | null> {
    const prismaVerification = await this.prisma.passportVerification.findFirst({
      where: { userId },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!prismaVerification) return null;

    const verificationDB = toPassportVerificationDB(prismaVerification);
    return toAPIPassportVerification(verificationDB);
  }

  async findLatestByAddress(address: string): Promise<PassportVerificationAPI | null> {
    const prismaVerification = await this.prisma.passportVerification.findFirst({
      where: { address: address.toLowerCase() },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!prismaVerification) return null;

    const verificationDB = toPassportVerificationDB(prismaVerification);
    return toAPIPassportVerification(verificationDB);
  }

  async findAllByUserId(userId: string): Promise<PassportVerificationAPI[]> {
    const prismaVerifications = await this.prisma.passportVerification.findMany({
      where: { userId },
      orderBy: { verifiedAt: 'desc' },
    });

    return prismaVerifications.map((pv) =>
      toAPIPassportVerification(toPassportVerificationDB(pv))
    );
  }

  async findAllByAddress(address: string): Promise<PassportVerificationAPI[]> {
    const prismaVerifications = await this.prisma.passportVerification.findMany({
      where: { address: address.toLowerCase() },
      orderBy: { verifiedAt: 'desc' },
    });

    return prismaVerifications.map((pv) =>
      toAPIPassportVerification(toPassportVerificationDB(pv))
    );
  }

  async create(
    data: CreatePassportVerificationData
  ): Promise<PassportVerificationAPI> {
    const prismaVerification = await this.prisma.passportVerification.create({
      data: {
        userId: data.userId,
        address: data.address.toLowerCase(),
        score: data.score,
        threshold: data.threshold,
        passingScore: data.passingScore,
        verified: data.verified,
        stampScores: data.stampScores || undefined,
        lastScoreTimestamp:
          typeof data.lastScoreTimestamp === 'string'
            ? new Date(data.lastScoreTimestamp)
            : data.lastScoreTimestamp,
        expirationTimestamp:
          typeof data.expirationTimestamp === 'string'
            ? new Date(data.expirationTimestamp)
            : data.expirationTimestamp,
        minScoreRequired: data.minScoreRequired || 20,
        apiResponseRaw: data.apiResponseRaw || undefined,
      },
    });

    const verificationDB = toPassportVerificationDB(prismaVerification);
    return toAPIPassportVerification(verificationDB);
  }

  async update(
    id: string,
    data: UpdatePassportVerificationData
  ): Promise<PassportVerificationAPI> {
    const prismaVerification = await this.prisma.passportVerification.update({
      where: { id },
      data: {
        ...(data.score !== undefined && { score: data.score }),
        ...(data.threshold !== undefined && { threshold: data.threshold }),
        ...(data.passingScore !== undefined && { passingScore: data.passingScore }),
        ...(data.verified !== undefined && { verified: data.verified }),
        ...(data.stampScores !== undefined && {
          stampScores: data.stampScores || undefined // Convert null to undefined for Prisma
        }),
        ...(data.lastScoreTimestamp !== undefined && {
          lastScoreTimestamp:
            typeof data.lastScoreTimestamp === 'string'
              ? new Date(data.lastScoreTimestamp)
              : data.lastScoreTimestamp,
        }),
        ...(data.expirationTimestamp !== undefined && {
          expirationTimestamp:
            typeof data.expirationTimestamp === 'string'
              ? new Date(data.expirationTimestamp)
              : data.expirationTimestamp,
        }),
        ...(data.minScoreRequired !== undefined && {
          minScoreRequired: data.minScoreRequired,
        }),
        ...(data.apiResponseRaw !== undefined && {
          apiResponseRaw: data.apiResponseRaw || undefined // Convert null to undefined for Prisma
        }),
      },
    });

    const verificationDB = toPassportVerificationDB(prismaVerification);
    return toAPIPassportVerification(verificationDB);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.passportVerification.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.passportVerification.count({
      where: { userId },
    });
  }

  async findExpired(): Promise<PassportVerificationAPI[]> {
    const now = new Date();
    const prismaVerifications = await this.prisma.passportVerification.findMany({
      where: {
        expirationTimestamp: {
          lt: now,
        },
      },
      orderBy: { expirationTimestamp: 'desc' },
    });

    return prismaVerifications.map((pv) =>
      toAPIPassportVerification(toPassportVerificationDB(pv))
    );
  }

  async hasValidVerification(userId: string): Promise<boolean> {
    const now = new Date();
    const count = await this.prisma.passportVerification.count({
      where: {
        userId,
        verified: true,
        expirationTimestamp: {
          gt: now,
        },
      },
    });

    return count > 0;
  }
}
