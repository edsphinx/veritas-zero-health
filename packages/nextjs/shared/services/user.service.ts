/**
 * User Service
 *
 * Handles all database operations for users
 */

import { prisma } from '@/shared/lib/prisma';
import { UserRole } from '@/shared/types/auth.types';

export interface UserData {
  id: string;
  address: string;
  role: UserRole;
  isVerified: boolean;
  humanityScore: number | null;
  verifiedAt: Date | null;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export class UserService {
  /**
   * Get user by wallet address
   */
  async getUserByAddress(address: string): Promise<UserData | null> {
    try {
      const normalizedAddress = address.toLowerCase();

      const user = await prisma.user.findUnique({
        where: { address: normalizedAddress },
      });

      if (!user) {
        return null;
      }

      return {
        ...user,
        role: user.role as UserRole,
      };
    } catch (error) {
      console.error('[UserService] Error fetching user:', error);
      return null;
    }
  }

  /**
   * Create or update user
   */
  async upsertUser(
    address: string,
    data: {
      role?: UserRole;
      isVerified?: boolean;
      humanityScore?: number;
      verifiedAt?: Date;
      displayName?: string;
      email?: string;
      avatar?: string;
    }
  ): Promise<UserData> {
    const normalizedAddress = address.toLowerCase();

    const user = await prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {
        ...data,
        lastActiveAt: new Date(),
      },
      create: {
        address: normalizedAddress,
        role: data.role || 'patient',
        isVerified: data.isVerified ?? false,
        humanityScore: data.humanityScore,
        verifiedAt: data.verifiedAt,
        displayName: data.displayName,
        email: data.email,
        avatar: data.avatar,
      },
    });

    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  /**
   * Update user role (with audit trail)
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole,
    changedBy: string,
    reason?: string
  ): Promise<UserData> {
    // Get current user to record role change
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        lastActiveAt: new Date(),
      },
    });

    // Create audit trail
    await prisma.roleChange.create({
      data: {
        userId,
        fromRole: currentUser.role,
        toRole: newRole,
        changedBy: changedBy.toLowerCase(),
        reason,
      },
    });

    return {
      ...updatedUser,
      role: updatedUser.role as UserRole,
    };
  }

  /**
   * Update verification status
   */
  async updateVerification(
    address: string,
    isVerified: boolean,
    humanityScore?: number
  ): Promise<UserData> {
    const normalizedAddress = address.toLowerCase();

    const user = await prisma.user.update({
      where: { address: normalizedAddress },
      data: {
        isVerified,
        humanityScore,
        verifiedAt: isVerified ? new Date() : null,
        lastActiveAt: new Date(),
      },
    });

    return {
      ...user,
      role: user.role as UserRole,
    };
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(address: string): Promise<void> {
    const normalizedAddress = address.toLowerCase();

    await prisma.user.update({
      where: { address: normalizedAddress },
      data: {
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(role: UserRole): Promise<UserData[]> {
    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      ...user,
      role: user.role as UserRole,
    }));
  }

  /**
   * Get role change history for a user
   */
  async getRoleHistory(userId: string) {
    return await prisma.roleChange.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Export singleton instance
export const userService = new UserService();
