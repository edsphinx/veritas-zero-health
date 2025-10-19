/**
 * Create Study Page - Multi-Step Form
 *
 * Researcher portal page for creating new clinical trials
 * Based on bk_nextjs implementation with clean architecture
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  ArrowLeft,
  ArrowRight,
  Check,
  DollarSign,
  Shield,
  Stethoscope,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  createStudySchema,
  type CreateStudyFormData,
} from '@/lib/validations';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============================================
// Types
// ============================================

type FormStep = 1 | 2 | 3 | 4 | 5;

interface TxStatus {
  step: number;
  message: string;
  hash?: string;
}

// ============================================
// Multi-Step Form Component
// ============================================

export default function CreateStudyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);

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

  // Calculated max participants
  const totalFunding = form.watch('totalFunding');
  const paymentPerParticipant = form.watch('paymentPerParticipant');
  const requiredAppointments = form.watch('requiredAppointments');
  const maxParticipants = totalFunding && paymentPerParticipant
    ? Math.floor(totalFunding / paymentPerParticipant)
    : 0;
  const costPerAppointment = paymentPerParticipant && requiredAppointments
    ? (paymentPerParticipant / requiredAppointments).toFixed(2)
    : '0.00';

  // Form submission
  async function onSubmit(data: CreateStudyFormData) {
    setIsSubmitting(true);
    try {
      // Show loading toast
      const loadingToast = toast.loading('Validating study parameters...', {
        description: 'Preparing blockchain transactions',
      });

      // TODO: Implement actual API call and blockchain transaction
      console.log('Form data:', data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.dismiss(loadingToast);
      toast.success('Study Created Successfully!', {
        description: 'Redirecting to study details...',
        duration: 3000,
      });

      // TODO: Redirect to actual study ID
      setTimeout(() => {
        router.push('/researcher/studies');
      }, 1500);

    } catch (error) {
      console.error('Error creating study:', error);
      toast.error('Failed to Create Study', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
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
        return !!(form.getValues('title') && form.getValues('description') &&
                  form.getValues('region') && form.getValues('compensation'));
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

  // ============================================
  // Render
  // ============================================

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

        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Create New Study</h1>
        </div>
        <p className="text-muted-foreground">
          Create a privacy-preserving clinical trial with zero-knowledge proof verification
        </p>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        transition={{ ...transitions.standard, delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        step < currentStep
                          ? 'bg-success border-success text-success-foreground'
                          : step === currentStep
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      {step < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{step}</span>
                      )}
                    </div>
                    <p className="text-xs mt-2 text-center">
                      {step === 1 && 'Basic Info'}
                      {step === 2 && 'Funding'}
                      {step === 3 && 'Age'}
                      {step === 4 && 'Medical'}
                      {step === 5 && 'Review'}
                    </p>
                  </div>
                  {index < 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-colors ${
                        step < currentStep ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.standard}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Provide basic details about your clinical trial
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Study Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Type 2 Diabetes Treatment Study"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A clear, descriptive title for your study (10-200 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the study, methodology, and objectives..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Detailed description of your study (50-2000 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., North America, Europe, Global"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="compensation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compensation Description *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., $500/month for 6 months"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Funding & Payments */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.standard}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle>Funding & Payments</CardTitle>
                        <CardDescription>
                          Define funding parameters and compensation structure
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="totalFunding"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Funding (USDC) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Total amount to deposit in escrow
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentPerParticipant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment per Participant (USDC) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Amount per successful completion
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requiredAppointments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Appointments *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Appointments to complete
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Calculated Stats */}
                    {maxParticipants > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Calculated Parameters</AlertTitle>
                        <AlertDescription>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <div>
                              <p className="text-sm font-medium">Max Participants</p>
                              <p className="text-2xl font-bold">{maxParticipants}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total Appointments</p>
                              <p className="text-2xl font-bold">{maxParticipants * requiredAppointments}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Cost per Appointment</p>
                              <p className="text-2xl font-bold">${costPerAppointment}</p>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Age Verification */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.standard}
              >
                <Card className="border-success/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-success" />
                        <div>
                          <CardTitle>Age Verification (Off-Chain)</CardTitle>
                          <CardDescription>
                            Define age requirements with ZK proof verification
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-xs font-medium text-success">ZK Proof Available</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Age *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Age *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Alert className="border-success/20 bg-success/10">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertTitle className="text-success">Anonymous Age Verification with Zero-Knowledge Proofs</AlertTitle>
                      <AlertDescription className="text-success">
                        <ul className="text-sm space-y-1 mt-2">
                          <li>• Patients prove age range without revealing exact age</li>
                          <li>• Generated client-side in browser extension (33-60ms)</li>
                          <li>• Verified cryptographically on Optimism Sepolia</li>
                          <li>• No personal data leaves patient&apos;s device</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Medical Eligibility - Placeholder for now */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.standard}
              >
                <Card className="border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle>Medical Eligibility (On-Chain)</CardTitle>
                          <CardDescription>
                            Optional: Define detailed medical criteria with ZK proof verification
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">ZK Proof Available</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="requiresEligibilityProof"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 p-4 rounded-lg border border-border">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                            />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel>Require medical eligibility proof (verified on-chain)</FormLabel>
                            <FormDescription>
                              Enable detailed medical criteria with biomarkers, vitals, medications, and diagnoses
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!form.watch('requiresEligibilityProof') && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Medical Criteria Disabled</AlertTitle>
                        <AlertDescription>
                          This study will only verify age. Enable medical eligibility proof to add biomarkers,
                          vital signs, medications, diagnoses, and allergies criteria.
                        </AlertDescription>
                      </Alert>
                    )}

                    {form.watch('requiresEligibilityProof') && (
                      <Alert className="border-warning/20 bg-warning/10">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <AlertTitle className="text-warning">Full medical criteria form coming soon</AlertTitle>
                        <AlertDescription className="text-warning">
                          The detailed medical criteria form (biomarkers, vitals, medications, diagnoses, allergies)
                          will be implemented in the next iteration. For now, this enables the medical proof requirement.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={transitions.standard}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Review & Submit</CardTitle>
                    <CardDescription>
                      Review your study details before creating on blockchain
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Basic Information</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-muted-foreground">Title:</dt>
                        <dd className="font-medium">{form.getValues('title')}</dd>
                        <dt className="text-muted-foreground">Region:</dt>
                        <dd className="font-medium">{form.getValues('region')}</dd>
                      </dl>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-2">Funding</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-muted-foreground">Total Funding:</dt>
                        <dd className="font-medium">${form.getValues('totalFunding')} USDC</dd>
                        <dt className="text-muted-foreground">Per Participant:</dt>
                        <dd className="font-medium">${form.getValues('paymentPerParticipant')} USDC</dd>
                        <dt className="text-muted-foreground">Max Participants:</dt>
                        <dd className="font-medium">{maxParticipants}</dd>
                      </dl>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-2">Eligibility</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-muted-foreground">Age Range:</dt>
                        <dd className="font-medium">
                          {form.getValues('minAge')} - {form.getValues('maxAge')} years
                        </dd>
                        <dt className="text-muted-foreground">Medical Criteria:</dt>
                        <dd className="font-medium">
                          {form.getValues('requiresEligibilityProof') ? 'Enabled' : 'Disabled'}
                        </dd>
                      </dl>
                    </div>

                    <Alert className="border-warning/20 bg-warning/10">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <AlertTitle className="text-warning">Next Steps After Creation</AlertTitle>
                      <AlertDescription className="text-warning">
                        <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                          <li>Study will be published on-chain to StudyRegistry contract</li>
                          <li>Escrow will be funded with USDC</li>
                          <li>Patients can browse and apply anonymously using ZK proofs</li>
                          <li>Payments released automatically after appointments</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
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
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
