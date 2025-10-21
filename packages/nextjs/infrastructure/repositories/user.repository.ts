/**
 * User Repository Factory
 *
 * Creates instances of the UserRepository with Prisma client
 */

import { PrismaUserRepository } from './PrismaUserRepository';
import { prisma } from '@/lib/prisma';
import type { IUserRepository } from '@/core/domain/repositories';

/**
 * Create a new UserRepository instance
 *
 * @returns Configured UserRepository implementation
 */
export function createUserRepository(): IUserRepository {
  return new PrismaUserRepository(prisma);
}
