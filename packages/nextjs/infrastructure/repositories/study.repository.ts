/**
 * Study Repository Factory
 *
 * Creates instances of the StudyRepository with Prisma client
 */

import { PrismaStudyRepository } from './PrismaStudyRepository';
import { prisma } from '@/lib/prisma';
import type { IStudyRepository } from '@/core/domain/repositories';

/**
 * Create a new StudyRepository instance
 *
 * @returns Configured StudyRepository implementation
 */
export function createStudyRepository(): IStudyRepository {
  return new PrismaStudyRepository(prisma);
}
