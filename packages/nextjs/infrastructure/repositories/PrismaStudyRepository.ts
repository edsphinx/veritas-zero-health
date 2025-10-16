/**
 * Prisma Study Repository (Adapter)
 *
 * Implements IStudyRepository using Prisma ORM.
 * This is the concrete implementation of the repository port.
 */

import { PrismaClient } from '@prisma/client';
import type { IStudyRepository } from '@/core/domain/IStudyRepository';
import type { Study, CreateStudyData } from '@/core/domain/Study';
import { StudyStatus } from '@/core/domain/Study';

export class PrismaStudyRepository implements IStudyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateStudyData): Promise<Study> {
    const study = await this.prisma.study.create({
      data: {
        registryId: data.registryId,
        escrowId: data.escrowId,
        title: data.title,
        description: data.description,
        researcherAddress: data.researcherAddress.toLowerCase(),
        status: StudyStatus.Created,
        chainId: data.chainId || 11155420,
        escrowTxHash: data.escrowTxHash,
        registryTxHash: data.registryTxHash,
        criteriaTxHash: data.criteriaTxHash,
        escrowBlockNumber: data.escrowBlockNumber,
        registryBlockNumber: data.registryBlockNumber,
      },
    });

    return this.toDomain(study);
  }

  async findByRegistryId(registryId: number): Promise<Study | null> {
    const study = await this.prisma.study.findUnique({
      where: { registryId },
    });

    return study ? this.toDomain(study) : null;
  }

  async findByEscrowId(escrowId: number): Promise<Study | null> {
    const study = await this.prisma.study.findFirst({
      where: { escrowId },
    });

    return study ? this.toDomain(study) : null;
  }

  async findByResearcher(researcherAddress: string): Promise<Study[]> {
    const studies = await this.prisma.study.findMany({
      where: {
        researcherAddress: researcherAddress.toLowerCase(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return studies.map((s) => this.toDomain(s));
  }

  async findById(id: string): Promise<Study | null> {
    const study = await this.prisma.study.findUnique({
      where: { id },
    });

    return study ? this.toDomain(study) : null;
  }

  async updateStatus(id: string, status: string): Promise<Study> {
    const study = await this.prisma.study.update({
      where: { id },
      data: { status },
    });

    return this.toDomain(study);
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<Study[]> {
    const studies = await this.prisma.study.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip: params?.skip,
      take: params?.take,
    });

    return studies.map((s) => this.toDomain(s));
  }

  async count(): Promise<number> {
    return this.prisma.study.count();
  }

  async countByResearcher(researcherAddress: string): Promise<number> {
    return this.prisma.study.count({
      where: {
        researcherAddress: researcherAddress.toLowerCase(),
      },
    });
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaStudy: any): Study {
    return {
      id: prismaStudy.id,
      registryId: prismaStudy.registryId,
      escrowId: prismaStudy.escrowId,
      title: prismaStudy.title,
      description: prismaStudy.description,
      researcherAddress: prismaStudy.researcherAddress,
      status: prismaStudy.status as string,
      chainId: prismaStudy.chainId,
      escrowTxHash: prismaStudy.escrowTxHash,
      registryTxHash: prismaStudy.registryTxHash,
      criteriaTxHash: prismaStudy.criteriaTxHash,
      escrowBlockNumber: String(prismaStudy.escrowBlockNumber),
      registryBlockNumber: String(prismaStudy.registryBlockNumber),
      createdAt: prismaStudy.createdAt,
      updatedAt: prismaStudy.updatedAt,
    };
  }
}

/**
 * Factory function for creating the repository
 */
export function createStudyRepository(prisma: PrismaClient): IStudyRepository {
  return new PrismaStudyRepository(prisma);
}
