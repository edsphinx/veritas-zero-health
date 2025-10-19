/**
 * Create Study Page
 *
 * Researcher portal page for creating new clinical trials
 * Clean architecture - page only imports wizard container
 */

import { StudyCreationWizard } from '@/components/features/studies/StudyCreationWizard';

export default function CreateStudyPage() {
  return <StudyCreationWizard />;
}
