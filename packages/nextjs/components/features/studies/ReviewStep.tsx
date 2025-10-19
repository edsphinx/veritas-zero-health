/**
 * Review Step Component
 *
 * Step 5 of study creation wizard - final review before submission
 * Includes staggered animations for each review section
 */

import { motion } from 'framer-motion';
import { UseFormWatch } from 'react-hook-form';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CreateStudyFormData } from '@/lib/validations';

interface ReviewStepProps {
  watch: UseFormWatch<CreateStudyFormData>;
  maxParticipants: number;
}

// Stagger animations for review sections
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.standard,
  },
};

export function ReviewStep({ watch, maxParticipants }: ReviewStepProps) {
  const formValues = {
    title: watch('title'),
    description: watch('description'),
    region: watch('region'),
    compensation: watch('compensation'),
    totalFunding: watch('totalFunding'),
    paymentPerParticipant: watch('paymentPerParticipant'),
    requiredAppointments: watch('requiredAppointments'),
    minAge: watch('minAge'),
    maxAge: watch('maxAge'),
    requiresEligibilityProof: watch('requiresEligibilityProof'),
  };

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={transitions.standard}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Review your study details before creating on blockchain
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Basic Information Section */}
            <motion.div variants={itemVariants}>
              <h3 className="font-semibold mb-3 text-lg">Basic Information</h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Title</p>
                  <p className="font-medium mt-1">{formValues.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="text-sm mt-1 line-clamp-3">{formValues.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Region</p>
                    <p className="font-medium mt-1">{formValues.region}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Compensation</p>
                    <p className="font-medium mt-1">{formValues.compensation}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Funding Section */}
            <motion.div variants={itemVariants} className="pt-2">
              <h3 className="font-semibold mb-3 text-lg">Funding & Payments</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <dl className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wide">Total Funding</dt>
                    <dd className="font-bold text-2xl mt-1 text-primary">${formValues.totalFunding}</dd>
                    <dd className="text-xs text-muted-foreground">USDC</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wide">Per Participant</dt>
                    <dd className="font-bold text-2xl mt-1">${formValues.paymentPerParticipant}</dd>
                    <dd className="text-xs text-muted-foreground">USDC</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wide">Max Participants</dt>
                    <dd className="font-bold text-2xl mt-1 text-success">{maxParticipants}</dd>
                    <dd className="text-xs text-muted-foreground">
                      {maxParticipants * formValues.requiredAppointments} total appointments
                    </dd>
                  </div>
                </dl>
              </div>
            </motion.div>

            {/* Eligibility Criteria Section */}
            <motion.div variants={itemVariants} className="pt-2">
              <h3 className="font-semibold mb-3 text-lg">Eligibility Criteria</h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Age Range</p>
                    <p className="font-medium mt-1">
                      {formValues.minAge} - {formValues.maxAge} years
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      ZK Proof (Off-Chain)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Medical Criteria</p>
                    <p className="font-medium mt-1">
                      {formValues.requiresEligibilityProof ? 'Enabled' : 'Disabled'}
                    </p>
                    {formValues.requiresEligibilityProof && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        ZK Proof (On-Chain)
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Appointments Required</p>
                  <p className="font-medium mt-1">{formValues.requiredAppointments} appointments per participant</p>
                </div>
              </div>
            </motion.div>

            {/* Next Steps Alert */}
            <motion.div variants={itemVariants} className="pt-2">
              <Alert className="border-warning/20 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">Next Steps After Creation</AlertTitle>
                <AlertDescription className="text-warning">
                  <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                    <li>Study will be published on-chain to StudyRegistry contract</li>
                    <li>Escrow will be funded with {formValues.totalFunding} USDC</li>
                    <li>Patients can browse and apply anonymously using ZK proofs</li>
                    <li>Payments released automatically after appointments</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
