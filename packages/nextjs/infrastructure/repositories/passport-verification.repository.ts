/**
 * Passport Verification Repository Factory
 *
 * Creates instances of the PassportVerificationRepository with Prisma client
 */

import { PrismaPassportVerificationRepository } from './PrismaPassportVerificationRepository';
import { prisma } from '@/lib/prisma';
import type { IPassportVerificationRepository } from '@/core/domain/repositories';

/**
 * Create a new PassportVerificationRepository instance
 *
 * @returns Configured PassportVerificationRepository implementation
 */
export function createPassportVerificationRepository(): IPassportVerificationRepository {
  return new PrismaPassportVerificationRepository(prisma);
}
