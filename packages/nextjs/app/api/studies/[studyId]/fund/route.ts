/**
 * POST /api/studies/[studyId]/fund
 *
 * Indexes a sponsor deposit after it has been confirmed on the blockchain.
 * This endpoint is called after the deposit transaction is successful.
 *
 * Body:
 * {
 *   escrowId: number,
 *   sponsorAddress: string,
 *   tokenAddress: string,
 *   amount: string,
 *   transactionHash: string,
 *   blockNumber: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { createSponsorDepositRepository } from '@/infrastructure/repositories/PrismaSponsorDepositRepository';

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
    const { escrowId, sponsorAddress, tokenAddress, amount, transactionHash, blockNumber } = body;

    // Validate input
    if (!escrowId || !sponsorAddress || !tokenAddress || !amount || !transactionHash || !blockNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: escrowId, sponsorAddress, tokenAddress, amount, transactionHash, blockNumber' },
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
    if (study.escrowId !== Number(escrowId)) {
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

      // Verify block number matches
      if (receipt.blockNumber.toString() !== blockNumber) {
        return NextResponse.json(
          { error: 'Block number mismatch' },
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

    // Check if deposit already indexed
    const repository = createSponsorDepositRepository(prisma);
    const existingDeposit = await repository.findByTransactionHash(transactionHash);

    if (existingDeposit) {
      console.log(`Deposit ${transactionHash} already indexed, returning existing`);
      return NextResponse.json({
        success: true,
        message: 'Deposit already indexed',
        deposit: {
          id: existingDeposit.id,
          sponsorAddress: existingDeposit.sponsorAddress,
          amount: existingDeposit.amount,
          transactionHash: existingDeposit.transactionHash,
        },
      });
    }

    // Index the deposit
    const deposit = await repository.create({
      sponsorAddress,
      studyId: study.id,
      escrowId: Number(escrowId),
      amount: BigInt(amount),
      chainId: optimismSepolia.id,
      transactionHash,
      blockNumber: BigInt(blockNumber),
    });

    // Calculate total funding received
    const allDeposits = await repository.findByStudy(study.id);
    const totalReceived = allDeposits.reduce(
      (sum, dep) => sum + Number(dep.amount),
      0
    );

    // Convert from base units (6 decimals) to display format
    const totalReceivedUSDC = (totalReceived / 1_000_000).toFixed(2);

    // Get total funding required
    const totalRequired = parseFloat(study.totalFunding);

    // Update study status based on funding
    let newStatus = study.status;
    if (parseFloat(totalReceivedUSDC) >= totalRequired) {
      // Funding complete - move to Active
      newStatus = 'Active';
      await prisma.study.update({
        where: { id: study.id },
        data: { status: 'Active' },
      });
      console.log(`Study ${study.id} fully funded, moved to Active`);
    } else {
      // Partial funding - ensure it's in Funding status
      if (study.status !== 'Funding') {
        await prisma.study.update({
          where: { id: study.id },
          data: { status: 'Funding' },
        });
      }
      console.log(`Study ${study.id} partially funded: $${totalReceivedUSDC}/$${totalRequired}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit indexed successfully',
      deposit: {
        id: deposit.id,
        sponsorAddress: deposit.sponsorAddress,
        studyId: deposit.studyId,
        escrowId: deposit.escrowId,
        amount: deposit.amount,
        transactionHash: deposit.transactionHash,
        blockNumber: deposit.blockNumber,
        depositedAt: deposit.depositedAt,
      },
      studyStatus: newStatus,
      totalReceived: totalReceivedUSDC,
      totalRequired: totalRequired.toString(),
      fullyFunded: parseFloat(totalReceivedUSDC) >= totalRequired,
    });

  } catch (error) {
    console.error('Error indexing deposit:', error);
    return NextResponse.json(
      { error: 'Failed to index deposit', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
