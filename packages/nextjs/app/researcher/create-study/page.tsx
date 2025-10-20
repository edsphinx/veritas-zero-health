/**
 * Create Study Page
 *
 * Researcher portal page for creating new clinical trials.
 * Multi-step wizard with blockchain transaction execution between steps.
 */

import { StudyCreationWizard } from '@/components/features/studies/wizard';

export default function CreateStudyPage() {
  return <StudyCreationWizard />;
}
