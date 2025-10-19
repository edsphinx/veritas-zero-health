/**
 * Study Creation Wizard Component
 *
 * Container component that orchestrates the multi-step study creation process
 * Includes AnimatePresence for smooth step transitions and button animations
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { createStudySchema, type CreateStudyFormData } from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { ProgressIndicator } from './ProgressIndicator';
import { BasicInfoStep } from './BasicInfoStep';
import { FundingStep } from './FundingStep';
import { AgeVerificationStep } from './AgeVerificationStep';
import { MedicalEligibilityStep } from './MedicalEligibilityStep';
import { ReviewStep } from './ReviewStep';

type FormStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = [
  'Basic Info',
  'Funding',
  'Age Criteria',
  'Medical Criteria',
  'Review',
];

// Button animation variants
const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export function StudyCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStudyFormData>({
    resolver: zodResolver(createStudySchema),
    defaultValues: {
      // Step 1: Basic Information
      title: '',
      description: '',
      region: '',
      compensation: '',

      // Step 2: Funding
      totalFunding: 10000,
      paymentPerParticipant: 250,
      requiredAppointments: 5,

      // Step 3: Age Verification
      minAge: 18,
      maxAge: 65,
      requiresAgeProof: true,

      // Step 4: Medical Eligibility
      requiresEligibilityProof: false,
      eligibilityCodeHash: '0',
      hba1c: { enabled: false, min: '', max: '' },
      cholesterol: { enabled: false, min: '', max: '' },
      ldl: { enabled: false, min: '', max: '' },
      hdl: { enabled: false, min: '', max: '' },
      triglycerides: { enabled: false, min: '', max: '' },
      systolicBP: { enabled: false, min: '', max: '' },
      diastolicBP: { enabled: false, min: '', max: '' },
      bmi: { enabled: false, min: '', max: '' },
      heartRate: { enabled: false, min: '', max: '' },
      requiredMedications: [],
      excludedMedications: [],
      requiredDiagnoses: [],
      excludedDiagnoses: [],
      excludedAllergies: [],
    },
  });

  // Calculated values
  const totalFunding = form.watch('totalFunding');
  const paymentPerParticipant = form.watch('paymentPerParticipant');
  const requiredAppointments = form.watch('requiredAppointments');
  const maxParticipants =
    totalFunding && paymentPerParticipant
      ? Math.floor(totalFunding / paymentPerParticipant)
      : 0;

  // Form submission
  async function onSubmit(data: CreateStudyFormData) {
    setIsSubmitting(true);
    try {
      const loadingToast = toast.loading('Validating study parameters...', {
        description: 'Preparing blockchain transactions',
      });

      // TODO: Implement actual API call and blockchain transaction
      console.log('Form data:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.dismiss(loadingToast);
      toast.success('Study Created Successfully!', {
        description: 'Redirecting to study details...',
        duration: 3000,
      });

      setTimeout(() => {
        router.push('/researcher/studies');
      }, 1500);
    } catch (error) {
      console.error('Error creating study:', error);
      toast.error('Failed to Create Study', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as FormStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  };

  // Step validation
  const isStepValid = (step: FormStep): boolean => {
    switch (step) {
      case 1:
        return !!(
          form.getValues('title') &&
          form.getValues('description') &&
          form.getValues('region') &&
          form.getValues('compensation')
        );
      case 2:
        return maxParticipants >= 1;
      case 3:
        return form.getValues('minAge') <= form.getValues('maxAge');
      case 4:
        return true; // Optional step
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={transitions.standard}
      >
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/researcher/studies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studies
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary/10">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create New Clinical Trial</h1>
            <p className="text-muted-foreground">
              Multi-step wizard with ZK proof verification
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={5}
        stepLabels={STEP_LABELS}
      />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Content with AnimatePresence */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <BasicInfoStep control={form.control} />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <FundingStep control={form.control} watch={form.watch} />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AgeVerificationStep control={form.control} />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <MedicalEligibilityStep control={form.control} watch={form.watch} />
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ReviewStep watch={form.watch} maxParticipants={maxParticipants} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons with Animations */}
          <div className="flex justify-between gap-4">
            <motion.div
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </motion.div>

            {currentStep < 5 ? (
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover={!isSubmitting ? "hover" : "idle"}
                whileTap={!isSubmitting ? "tap" : "idle"}
              >
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Study
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
