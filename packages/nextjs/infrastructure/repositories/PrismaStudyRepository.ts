/**
 * Prisma Study Repository Implementation
 *
 * Concrete implementation of IStudyRepository using Prisma ORM
 *
 * Type Strategy:
 * - Prisma returns native types (BigInt, Decimal)
 * - We use toAPIStudy() to convert to JSON-serializable Study type
 * - This keeps DB types accurate while ensuring API compatibility
 */

import { PrismaClient, Prisma, type Study as PrismaStudy } from '@prisma/client';
import type { IStudyRepository, StudyFilters } from '@/core/domain/repositories';
import type { Study, CreateStudyData, UpdateStudyData } from '@/core/domain/entities';
import type { StudyDB } from '@veritas/types';
import { toAPIStudy, StudyStatus } from '@veritas/types';

// Helper to convert Prisma type to StudyDB
function toStudyDB(prismaStudy: PrismaStudy): StudyDB {
  return {
    id: prismaStudy.id,
    registryId: prismaStudy.registryId,
    escrowId: prismaStudy.escrowId,
    title: prismaStudy.title,
    description: prismaStudy.description,
    researcherAddress: prismaStudy.researcherAddress,
    status: prismaStudy.status as StudyStatus, // Prisma enum to our enum
    totalFunding: prismaStudy.totalFunding.toString(),
    remainingFunding: prismaStudy.remainingFunding.toString(),
    sponsor: prismaStudy.sponsor,
    certifiedProviders: prismaStudy.certifiedProviders,
    participantCount: prismaStudy.participantCount,
    maxParticipants: prismaStudy.maxParticipants,
    chainId: prismaStudy.chainId,
    escrowTxHash: prismaStudy.escrowTxHash,
    registryTxHash: prismaStudy.registryTxHash,
    criteriaTxHash: prismaStudy.criteriaTxHash,
    escrowBlockNumber: prismaStudy.escrowBlockNumber,
    registryBlockNumber: prismaStudy.registryBlockNumber,
    createdAt: prismaStudy.createdAt,
    updatedAt: prismaStudy.updatedAt,
    startedAt: prismaStudy.startedAt,
    completedAt: prismaStudy.completedAt,
    deletedAt: prismaStudy.deletedAt,
  };
}

export class PrismaStudyRepository implements IStudyRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Study | null> {
    const prismaStudy = await this.prisma.study.findUnique({
      where: { id },
    });
    if (!prismaStudy) return null;

    const studyDB = toStudyDB(prismaStudy);
    return toAPIStudy(studyDB);
  }

  async findByRegistryId(registryId: bigint): Promise<Study | null> {
    // Prisma stores BigInt as number in some configs, handle both
    const registryIdNum = Number(registryId);
    const prismaStudy = await this.prisma.study.findUnique({
      where: { registryId: registryIdNum },
    });
    if (!prismaStudy) return null;

    const studyDB = toStudyDB(prismaStudy);
    return toAPIStudy(studyDB);
  }

  async findAll(filters?: StudyFilters): Promise<Study[]> {
    const where: Prisma.StudyWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as StudyStatus;
    }

    if (filters?.researcherId) {
      where.researcherAddress = filters.researcherId;
    }

    if (filters?.isActive !== undefined) {
      if (filters.isActive) {
        where.status = { in: ['recruiting', 'active'] as StudyStatus[] };
      } else {
        where.status = { notIn: ['recruiting', 'active'] as StudyStatus[] };
      }
    }

    const prismaStudies = await this.prisma.study.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return prismaStudies.map((ps) => toAPIStudy(toStudyDB(ps)));
  }

  async findByResearcher(researcherId: string): Promise<Study[]> {
    const prismaStudies = await this.prisma.study.findMany({
      where: { researcherAddress: researcherId },
      orderBy: { createdAt: 'desc' },
    });
    return prismaStudies.map((ps) => toAPIStudy(toStudyDB(ps)));
  }

  async create(data: CreateStudyData): Promise<Study> {
    const prismaStudy = await this.prisma.study.create({
      data: {
        registryId: Number(data.registryId),
        escrowId: Number(data.escrowId),
        title: data.title,
        description: data.description,
        researcherAddress: data.researcherAddress,
        status: data.status as StudyStatus, // Type assertion for enum
        totalFunding: data.totalFunding,
        remainingFunding: data.remainingFunding ?? data.totalFunding,
        sponsor: data.sponsor,
        certifiedProviders: data.certifiedProviders ?? [],
        participantCount: data.participantCount ?? 0,
        maxParticipants: data.maxParticipants,
        chainId: data.chainId || 11155420,
        escrowTxHash: data.escrowTxHash,
        registryTxHash: data.registryTxHash,
        criteriaTxHash: data.criteriaTxHash,
        escrowBlockNumber: BigInt(data.escrowBlockNumber),
        registryBlockNumber: BigInt(data.registryBlockNumber),
      },
    });
    const studyDB = toStudyDB(prismaStudy);
    return toAPIStudy(studyDB);
  }

  async update(id: string, data: UpdateStudyData): Promise<Study> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { criteria, milestones, applications, deposits, ...updateData } = data;

    const prismaStudy = await this.prisma.study.update({
      where: { id },
      data: updateData as Prisma.StudyUpdateInput,
    });
    const studyDB = toStudyDB(prismaStudy);
    return toAPIStudy(studyDB);
  }

  async delete(id: string): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await this.prisma.study.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(filters?: StudyFilters): Promise<number> {
    const where: Prisma.StudyWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as StudyStatus;
    }

    if (filters?.researcherId) {
      where.researcherAddress = filters.researcherId;
    }

    if (filters?.isActive !== undefined) {
      if (filters.isActive) {
        where.status = { in: ['recruiting', 'active'] as StudyStatus[] };
      } else {
        where.status = { notIn: ['recruiting', 'active'] as StudyStatus[] };
      }
    }

    return this.prisma.study.count({ where });
  }
}
