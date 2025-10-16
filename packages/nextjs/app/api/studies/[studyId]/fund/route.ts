/**
 * POST /api/studies/[studyId]/fund
 * Funds a study with ERC20 tokens (Mock USDC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ResearchFundingEscrow ABI
const ESCROW_ABI = [
  {
    inputs: [
      { name: 'studyId', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'fundStudyERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ERC20 ABI (for approve)
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_RESEARCH_FUNDING_ESCROW_ADDRESS as `0x${string}`;
const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS as `0x${string}`;

interface FundStudyRequest {
  amount: string; // Amount in USDC (e.g., "10000")
  tokenAddress?: string; // Optional, defaults to Mock USDC
  sponsorAddress: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body: FundStudyRequest = await request.json();

    // Validate input
    if (!studyId || isNaN(Number(studyId))) {
      return NextResponse.json(
        { error: 'Invalid study ID' },
        { status: 400 }
      );
    }

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!ESCROW_ADDRESS) {
      return NextResponse.json(
        { error: 'ResearchFundingEscrow address not configured' },
        { status: 500 }
      );
    }

    const tokenAddress = (body.tokenAddress || MOCK_USDC_ADDRESS) as `0x${string}`;

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Token address not configured' },
        { status: 500 }
      );
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // NOTE: In production, use sponsor's wallet via frontend
    // For testing, use sponsor test wallet from .env
    const account = privateKeyToAccount(
      (process.env.SPONSOR_1_PRIVATE_KEY || '0x') as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    // Parse amount (Mock USDC has 6 decimals)
    const amountInTokenUnits = parseUnits(body.amount, 6);

    // Step 1: Approve escrow to spend tokens
    const approveHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ESCROW_ADDRESS, amountInTokenUnits],
    });

    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    // Step 2: Fund the study
    const fundHash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'fundStudyERC20',
      args: [BigInt(studyId), tokenAddress, amountInTokenUnits],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: fundHash });

    return NextResponse.json({
      success: true,
      studyId: Number(studyId),
      amount: body.amount,
      token: tokenAddress,
      approveTransactionHash: approveHash,
      fundTransactionHash: fundHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error: any) {
    console.error('Error funding study:', error);

    return NextResponse.json(
      {
        error: 'Failed to fund study',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
