/**
 * Prisma User Repository Implementation
 *
 * Concrete implementation of IUserRepository using Prisma ORM
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { IUserRepository, UserFilters } from '@/core/domain/repositories';
import type { User, UserRole, CreateUserData, UpdateUserData } from '@/core/domain/entities';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<User | null>;
  }

  async findByAddress(address: string): Promise<User | null> {
    // Normalize address to lowercase for consistency
    const normalizedAddress = address.toLowerCase();
    return this.prisma.user.findUnique({
      where: { address: normalizedAddress },
    }) as Promise<User | null>;
  }

  async findAll(filters?: UserFilters): Promise<User[]> {
    const where: Prisma.UserWhereInput = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as Promise<User[]>;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    }) as Promise<User[]>;
  }

  async create(data: CreateUserData): Promise<User> {
    // Normalize address to lowercase
    const normalizedAddress = data.address.toLowerCase();

    return this.prisma.user.create({
      data: {
        ...data,
        address: normalizedAddress,
      },
    }) as Promise<User>;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    }) as Promise<User>;
  }

  async updateVerification(
    id: string,
    isVerified: boolean,
    humanityScore?: number | null
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        isVerified,
        humanityScore,
        verifiedAt: isVerified ? new Date() : null,
      },
    }) as Promise<User>;
  }

  async delete(id: string): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(address: string): Promise<boolean> {
    const normalizedAddress = address.toLowerCase();
    const count = await this.prisma.user.count({
      where: { address: normalizedAddress },
    });
    return count > 0;
  }
}
