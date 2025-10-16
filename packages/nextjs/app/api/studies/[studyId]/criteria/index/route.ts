/**
 * POST /api/studies/[studyId]/criteria/index
 *
 * Indexes eligibility criteria for a study after it has been set on the blockchain.
 * This endpoint is called after the setStudyCriteria transaction is confirmed.
 *
 * Body:
 * {
 *   escrowId: number,
 *   minAge: number,
 *   maxAge: number,
 *   eligibilityCodeHash: string,
 *   transactionHash: string,
 *   blockNumber: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http } from 'viem';
import { optimismSepolia } from 'viem/chains';

const prisma = new PrismaClient();

// Create public client to verify transactions
const publicClient = createPublicClient({
  chain: optimismSepolia,
  transport: http(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body = await request.json();
    const {
      escrowId,
      minAge,
      maxAge,
      eligibilityCodeHash,
      transactionHash,
      blockNumber,
      // Optional medical criteria details
      medicalCriteria,
    } = body;

    // Validate input
    if (
      !escrowId ||
      minAge === undefined ||
      maxAge === undefined ||
      !eligibilityCodeHash ||
      !transactionHash ||
      !blockNumber
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, minAge, maxAge, eligibilityCodeHash, transactionHash, blockNumber' },
        { status: 400 }
      );
    }

    // Find the study in our database
    const study = await prisma.study.findUnique({
      where: { id: studyId },
    });

    if (!study) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      );
    }

    // Verify escrowId matches
    if (study.escrowId !== escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID mismatch' },
        { status: 400 }
      );
    }

    // Verify transaction exists on blockchain
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      if (!receipt || !receipt.status || receipt.status !== 'success') {
        return NextResponse.json(
          { error: `Transaction ${transactionHash} not found or failed` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error verifying transaction ${transactionHash}:`, error);
      return NextResponse.json(
        { error: `Failed to verify transaction ${transactionHash}` },
        { status: 500 }
      );
    }

    // Check if criteria already indexed
    const existingCriteria = await prisma.studyCriteria.findUnique({
      where: { escrowId: Number(escrowId) },
    });

    if (existingCriteria) {
      console.log('Criteria already indexed, updating...');
      // Update existing criteria
      const updated = await prisma.studyCriteria.update({
        where: { escrowId: Number(escrowId) },
        data: {
          minAge: Number(minAge),
          maxAge: Number(maxAge),
          eligibilityCodeHash,
          transactionHash,
          blockNumber: BigInt(blockNumber),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully updated study criteria',
        criteria: {
          id: updated.id,
          minAge: updated.minAge,
          maxAge: updated.maxAge,
          eligibilityCodeHash: updated.eligibilityCodeHash,
          transactionHash: updated.transactionHash,
        },
      });
    }

    // Prepare medical criteria data
    const medicalData = medicalCriteria ? {
      // Biomarkers
      hba1cMin: medicalCriteria.hba1c?.enabled ? parseFloat(medicalCriteria.hba1c.min) : null,
      hba1cMax: medicalCriteria.hba1c?.enabled ? parseFloat(medicalCriteria.hba1c.max) : null,
      ldlMin: medicalCriteria.ldl?.enabled ? parseFloat(medicalCriteria.ldl.min) : null,
      ldlMax: medicalCriteria.ldl?.enabled ? parseFloat(medicalCriteria.ldl.max) : null,
      cholesterolMin: medicalCriteria.cholesterol?.enabled ? parseFloat(medicalCriteria.cholesterol.min) : null,
      cholesterolMax: medicalCriteria.cholesterol?.enabled ? parseFloat(medicalCriteria.cholesterol.max) : null,
      hdlMin: medicalCriteria.hdl?.enabled ? parseFloat(medicalCriteria.hdl.min) : null,
      hdlMax: medicalCriteria.hdl?.enabled ? parseFloat(medicalCriteria.hdl.max) : null,
      triglyceridesMin: medicalCriteria.triglycerides?.enabled ? parseFloat(medicalCriteria.triglycerides.min) : null,
      triglyceridesMax: medicalCriteria.triglycerides?.enabled ? parseFloat(medicalCriteria.triglycerides.max) : null,
      // Vital Signs
      systolicBPMin: medicalCriteria.systolicBP?.enabled ? parseFloat(medicalCriteria.systolicBP.min) : null,
      systolicBPMax: medicalCriteria.systolicBP?.enabled ? parseFloat(medicalCriteria.systolicBP.max) : null,
      diastolicBPMin: medicalCriteria.diastolicBP?.enabled ? parseFloat(medicalCriteria.diastolicBP.min) : null,
      diastolicBPMax: medicalCriteria.diastolicBP?.enabled ? parseFloat(medicalCriteria.diastolicBP.max) : null,
      bmiMin: medicalCriteria.bmi?.enabled ? parseFloat(medicalCriteria.bmi.min) : null,
      bmiMax: medicalCriteria.bmi?.enabled ? parseFloat(medicalCriteria.bmi.max) : null,
      heartRateMin: medicalCriteria.heartRate?.enabled ? parseFloat(medicalCriteria.heartRate.min) : null,
      heartRateMax: medicalCriteria.heartRate?.enabled ? parseFloat(medicalCriteria.heartRate.max) : null,
      // Medications & Allergies
      requiredMedications: medicalCriteria.requiredMedications || [],
      excludedMedications: medicalCriteria.excludedMedications || [],
      excludedAllergies: medicalCriteria.excludedAllergies || [],
      // Diagnoses
      requiredDiagnoses: medicalCriteria.requiredDiagnoses || [],
      excludedDiagnoses: medicalCriteria.excludedDiagnoses || [],
    } : {};

    // Index the criteria
    const indexed = await prisma.studyCriteria.create({
      data: {
        studyId: study.id,
        escrowId: Number(escrowId),
        minAge: Number(minAge),
        maxAge: Number(maxAge),
        eligibilityCodeHash,
        chainId: optimismSepolia.id,
        transactionHash,
        blockNumber: BigInt(blockNumber),
        ...medicalData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully indexed study criteria',
      criteria: {
        id: indexed.id,
        minAge: indexed.minAge,
        maxAge: indexed.maxAge,
        eligibilityCodeHash: indexed.eligibilityCodeHash,
        transactionHash: indexed.transactionHash,
      },
    });

  } catch (error) {
    console.error('Error indexing criteria:', error);
    return NextResponse.json(
      { error: 'Failed to index criteria', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
