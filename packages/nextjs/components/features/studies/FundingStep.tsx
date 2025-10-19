/**
 * Funding Step Component
 *
 * Step 2 of study creation wizard - funding and payment configuration
 */

import { motion } from 'framer-motion';
import { Control, UseFormWatch } from 'react-hook-form';
import { DollarSign, AlertCircle } from 'lucide-react';
import { fadeUpVariants, transitions } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CreateStudyFormData } from '@/lib/validations';

interface FundingStepProps {
  control: Control<CreateStudyFormData>;
  watch: UseFormWatch<CreateStudyFormData>;
}

export function FundingStep({ control, watch }: FundingStepProps) {
  const totalFunding = watch('totalFunding');
  const paymentPerParticipant = watch('paymentPerParticipant');
  const requiredAppointments = watch('requiredAppointments');

  const maxParticipants = totalFunding && paymentPerParticipant
    ? Math.floor(totalFunding / paymentPerParticipant)
    : 0;
  const costPerAppointment = paymentPerParticipant && requiredAppointments
    ? (paymentPerParticipant / requiredAppointments).toFixed(2)
    : '0.00';

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
            control={control}
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
            control={control}
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
            control={control}
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
  );
}
