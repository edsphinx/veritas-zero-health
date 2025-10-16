/**
 * POST /api/studies/create
 * Validates study creation parameters and returns contract data
 *
 * NOTE: This endpoint does NOT execute blockchain transactions.
 * Frontend handles wallet signing via wagmi/viem.
 * This is validation + metadata storage only.
 */

import { NextRequest, NextResponse } from 'next/server';

interface CreateStudyRequest {
  // Basic study info
  title: string;
  description: string;
  region: string;
  compensation: string;

  // Funding parameters
  totalFunding: string;
  paymentPerParticipant: string;
  requiredAppointments: number;
  maxParticipants: number;

  // Eligibility criteria
  minAge: number;
  maxAge: number;
  requiresAgeProof: boolean;

  // Optional: Medical eligibility criteria (for ZK proof)
  medicalCriteria?: {
    requiredDiagnoses?: string[];
    excludedDiagnoses?: string[];
    requiredMedications?: string[];
    excludedMedications?: string[];
  };

  // Certified providers (clinics)
  certifiedProviders?: string[];

  // Creator info
  creatorAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateStudyRequest = await request.json();

    // Validate input
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!body.region || body.region.trim().length === 0) {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      );
    }

    if (!body.maxParticipants || body.maxParticipants <= 0) {
      return NextResponse.json(
        { error: 'Max participants must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.totalFunding || parseFloat(body.totalFunding) <= 0) {
      return NextResponse.json(
        { error: 'Total funding must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.paymentPerParticipant || parseFloat(body.paymentPerParticipant) <= 0) {
      return NextResponse.json(
        { error: 'Payment per participant must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.creatorAddress) {
      return NextResponse.json(
        { error: 'Creator address is required' },
        { status: 400 }
      );
    }

    // Return validated data for frontend to execute transactions
    return NextResponse.json(
      {
        success: true,
        message: 'Study parameters validated - ready for blockchain submission',
        data: {
          validated: true,
          studyParams: {
            title: body.title,
            description: body.description,
            region: body.region,
            compensation: body.compensation,
            maxParticipants: body.maxParticipants,
            minAge: body.minAge,
            maxAge: body.maxAge,
            certifiedProviders: body.certifiedProviders || [body.creatorAddress],
            eligibilityCodeHash: "0", // TODO: Generate from medicalCriteria (will be converted to BigInt on frontend)
          },
          metadata: {
            creatorAddress: body.creatorAddress,
            totalFunding: body.totalFunding,
            paymentPerParticipant: body.paymentPerParticipant,
            requiredAppointments: body.requiredAppointments,
            medicalCriteria: body.medicalCriteria,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[Study Creation Validation] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to validate study parameters',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
