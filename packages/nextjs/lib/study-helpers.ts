/**
 * Study Helper Functions
 *
 * Utility functions for study-related business logic
 */

import type { Study } from '@veritas/types';

/**
 * Calculate the number of verified applicants for a study
 * @param study - Study with optional applications relation
 * @returns Number of applicants with verified proofs
 */
export function getVerifiedApplicantsCount(study: Study | null | undefined): number {
  if (!study?.applications) return 0;
  return study.applications.filter((app) => app.proofVerified).length;
}

/**
 * Calculate study progress percentage
 * @param study - Study with participant counts
 * @returns Progress percentage (0-100)
 */
export function getStudyProgress(study: Study): number {
  if (study.maxParticipants === 0) return 0;
  return Math.round((study.participantCount / study.maxParticipants) * 100);
}

/**
 * Check if study is accepting applications
 * @param study - Study to check
 * @returns True if study is recruiting and not full
 */
export function isStudyAcceptingApplications(study: Study): boolean {
  return (
    study.status === 'recruiting' &&
    study.participantCount < study.maxParticipants
  );
}

/**
 * Calculate remaining participant slots
 * @param study - Study with participant counts
 * @returns Number of remaining slots
 */
export function getRemainingSlots(study: Study): number {
  return Math.max(0, study.maxParticipants - study.participantCount);
}
