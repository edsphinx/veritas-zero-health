/**
 * POST /api/studies/create-initial
 *
 * Creates an initial empty study record in the database.
 * Called at the START of the wizard before any blockchain transactions.
 *
 * This allows the wizard to have a database ID to reference
 * as it completes each step and indexes blockchain data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsonResponse } from '@/lib/json-bigint';
import { createStudyRepository } from '@/infrastructure/repositories';
import { StudyStatus } from '@veritas/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.address) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only researchers can create studies
    if (session.user?.role !== 'researcher') {
      return NextResponse.json(
        { success: false, error: 'Only researchers can create studies' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description } = body;

    // Create initial study with placeholder data
    // These will be updated as wizard progresses
    const studyRepository = createStudyRepository();

    const study = await studyRepository.create({
      // IDs will be set when blockchain transactions complete
      registryId: null,
      escrowId: null,

      // Basic info
      title: title || 'Untitled Study (Draft)',
      description: description || 'Study in creation...',
      researcherAddress: session.address,
      status: StudyStatus.Created,

      // Funding (will be updated in escrow step)
      totalFunding: '0',
      sponsor: session.address, // Default to researcher as sponsor
      maxParticipants: 0, // Will be set in wizard

      // Placeholder transaction hashes (will be updated)
      escrowTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      registryTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      criteriaTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',

      // Placeholder block numbers
      escrowBlockNumber: BigInt(0),
      registryBlockNumber: BigInt(0),

      // Default chain
      chainId: 11155420, // Optimism Sepolia
    });

    console.log('[Create Initial] Created study:', {
      id: study.id,
      researcher: session.address,
    });

    return jsonResponse({
      success: true,
      data: {
        studyId: study.id,
        message: 'Initial study created successfully',
      },
    });
  } catch (error) {
    console.error('[Create Initial] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create initial study',
      },
      { status: 500 }
    );
  }
}
