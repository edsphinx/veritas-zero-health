/**
 * Repository Implementation: PrismaSponsorDepositRepository
 *
 * Concrete implementation of ISponsorDepositRepository using Prisma ORM.
 * Adapts Prisma's data format to our domain entities.
 */

import type { PrismaClient } from '@prisma/client';
import type { Address } from 'viem';
import type { ISponsorDepositRepository } from '@/core/domain/ISponsorDepositRepository';
import type { SponsorDeposit, CreateSponsorDepositData } from '@/core/domain/SponsorDeposit';

export class PrismaSponsorDepositRepository implements ISponsorDepositRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateSponsorDepositData): Promise<SponsorDeposit> {
    const deposit = await this.prisma.sponsorDeposit.create({
      data: {
        sponsorAddress: data.sponsorAddress.toLowerCase(),
        studyId: data.studyId,
        escrowId: data.escrowId,
        amount: data.amount,
        chainId: data.chainId,
        transactionHash: data.transactionHash,
        blockNumber: data.blockNumber,
        depositedAt: data.depositedAt || new Date(),
      },
    });

    return this.toDomain(deposit);
  }

  async findByTransactionHash(txHash: string): Promise<SponsorDeposit | null> {
    const deposit = await this.prisma.sponsorDeposit.findFirst({
      where: { transactionHash: txHash },
    });

    return deposit ? this.toDomain(deposit) : null;
  }

  async findBySponsor(sponsorAddress: Address): Promise<SponsorDeposit[]> {
    const deposits = await this.prisma.sponsorDeposit.findMany({
      where: { sponsorAddress: sponsorAddress.toLowerCase() },
      orderBy: { depositedAt: 'desc' },
    });

    return deposits.map(d => this.toDomain(d));
  }

  async findByStudy(studyId: string): Promise<SponsorDeposit[]> {
    const deposits = await this.prisma.sponsorDeposit.findMany({
      where: { studyId },
      orderBy: { depositedAt: 'desc' },
    });

    return deposits.map(d => this.toDomain(d));
  }

  async findBySponsorAndStudy(
    sponsorAddress: Address,
    studyId: string
  ): Promise<SponsorDeposit[]> {
    const deposits = await this.prisma.sponsorDeposit.findMany({
      where: {
        sponsorAddress: sponsorAddress.toLowerCase(),
        studyId,
      },
      orderBy: { depositedAt: 'desc' },
    });

    return deposits.map(d => this.toDomain(d));
  }

  async getTotalBySponsor(sponsorAddress: Address): Promise<bigint> {
    const result = await this.prisma.sponsorDeposit.aggregate({
      where: { sponsorAddress: sponsorAddress.toLowerCase() },
      _sum: { amount: true },
    });

    return result._sum.amount || BigInt(0);
  }

  async getTotalByStudy(studyId: string): Promise<bigint> {
    const result = await this.prisma.sponsorDeposit.aggregate({
      where: { studyId },
      _sum: { amount: true },
    });

    return result._sum.amount || BigInt(0);
  }

  async getTotalBySponsorAndStudy(
    sponsorAddress: Address,
    studyId: string
  ): Promise<bigint> {
    const result = await this.prisma.sponsorDeposit.aggregate({
      where: {
        sponsorAddress: sponsorAddress.toLowerCase(),
        studyId,
      },
      _sum: { amount: true },
    });

    return result._sum.amount || BigInt(0);
  }

  async countBySponsor(sponsorAddress: Address): Promise<number> {
    return await this.prisma.sponsorDeposit.count({
      where: { sponsorAddress: sponsorAddress.toLowerCase() },
    });
  }

  async getStudyIdsBySponsor(sponsorAddress: Address): Promise<string[]> {
    const deposits = await this.prisma.sponsorDeposit.findMany({
      where: { sponsorAddress: sponsorAddress.toLowerCase() },
      select: { studyId: true },
      distinct: ['studyId'],
    });

    return deposits.map(d => d.studyId);
  }

  /**
   * Convert Prisma model to domain entity
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(prismaDeposit: any): SponsorDeposit {
    return {
      id: prismaDeposit.id,
      sponsorAddress: prismaDeposit.sponsorAddress as Address,
      studyId: prismaDeposit.studyId,
      escrowId: prismaDeposit.escrowId,
      amount: BigInt(prismaDeposit.amount),
      chainId: prismaDeposit.chainId,
      transactionHash: prismaDeposit.transactionHash,
      blockNumber: BigInt(prismaDeposit.blockNumber),
      depositedAt: prismaDeposit.depositedAt,
      createdAt: prismaDeposit.createdAt,
      updatedAt: prismaDeposit.updatedAt,
    };
  }
}

/**
 * Factory function to create repository instance
 */
export function createSponsorDepositRepository(
  prisma: PrismaClient
): ISponsorDepositRepository {
  return new PrismaSponsorDepositRepository(prisma);
}
