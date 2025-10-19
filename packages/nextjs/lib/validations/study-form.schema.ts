/**
 * Study Form Validation Schema
 *
 * Zod schema for create/edit study form validation
 * Based on bk_nextjs implementation with multi-step form support
 */

import { z } from 'zod';

// ============================================
// Helper Schemas
// ============================================

// Biomarker/Vital range schema
const rangeSchema = z.object({
  enabled: z.boolean(),
  min: z.string().optional(),
  max: z.string().optional(),
});

// ============================================
// Step 1: Basic Information
// ============================================

export const basicInfoSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  region: z
    .string()
    .min(2, 'Region must be specified'),
  compensation: z
    .string()
    .min(5, 'Compensation description required'),
});

// ============================================
// Step 2: Funding & Payments
// ============================================

export const fundingSchema = z.object({
  totalFunding: z
    .number()
    .positive('Total funding must be positive')
    .max(10000000, 'Maximum funding is 10M USDC'),
  paymentPerParticipant: z
    .number()
    .positive('Payment per participant must be positive')
    .max(1000000, 'Maximum payment is 1M USDC per participant'),
  requiredAppointments: z
    .number()
    .int()
    .min(1, 'At least 1 appointment required')
    .max(20, 'Maximum 20 appointments'),
});

// ============================================
// Step 3: Age Verification (Off-chain ZK)
// ============================================

export const ageVerificationSchema = z.object({
  minAge: z
    .number()
    .int()
    .min(0, 'Minimum age must be 0 or greater')
    .max(120, 'Minimum age must be less than 120'),
  maxAge: z
    .number()
    .int()
    .min(0, 'Maximum age must be 0 or greater')
    .max(120, 'Maximum age must be less than 120'),
  requiresAgeProof: z.boolean(),
}).refine(
  (data) => data.minAge <= data.maxAge,
  {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['maxAge'],
  }
);

// ============================================
// Step 4: Medical Eligibility (On-chain ZK)
// ============================================

export const medicalEligibilitySchema = z.object({
  requiresEligibilityProof: z.boolean(),
  eligibilityCodeHash: z.string(),

  // Biomarkers
  hba1c: rangeSchema,
  cholesterol: rangeSchema,
  ldl: rangeSchema,
  hdl: rangeSchema,
  triglycerides: rangeSchema,

  // Vital Signs
  systolicBP: rangeSchema,
  diastolicBP: rangeSchema,
  bmi: rangeSchema,
  heartRate: rangeSchema,

  // Medications, Diagnoses, Allergies
  requiredMedications: z.array(z.string()),
  excludedMedications: z.array(z.string()),
  requiredDiagnoses: z.array(z.string()),
  excludedDiagnoses: z.array(z.string()),
  excludedAllergies: z.array(z.string()),
});

// ============================================
// Complete Multi-Step Form Schema
// ============================================

export const createStudySchema = basicInfoSchema
  .merge(fundingSchema)
  .merge(ageVerificationSchema)
  .merge(medicalEligibilitySchema)
  .refine(
    (data) => {
      // Payment per participant must not exceed total funding
      return data.paymentPerParticipant <= data.totalFunding;
    },
    {
      message: 'Payment per participant cannot exceed total funding',
      path: ['paymentPerParticipant'],
    }
  )
  .refine(
    (data) => {
      // At least 1 participant should be funded
      const maxParticipants = Math.floor(data.totalFunding / data.paymentPerParticipant);
      return maxParticipants >= 1;
    },
    {
      message: 'Total funding must be enough for at least 1 participant',
      path: ['totalFunding'],
    }
  );

// ============================================
// TypeScript Types
// ============================================

export type RangeFormData = z.infer<typeof rangeSchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type FundingFormData = z.infer<typeof fundingSchema>;
export type AgeVerificationFormData = z.infer<typeof ageVerificationSchema>;
export type MedicalEligibilityFormData = z.infer<typeof medicalEligibilitySchema>;
export type CreateStudyFormData = z.infer<typeof createStudySchema>;
