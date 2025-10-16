import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';

/**
 * POST /api/studies/[studyId]/apply
 *
 * Receives a ZK proof from the browser extension and verifies it on-chain.
 * Uses the deployer's private key to submit the transaction (so users don't pay gas).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params;
    const body = await request.json();
    const { proof, publicInputs, proofTime } = body;

    if (!proof || !publicInputs) {
      return NextResponse.json(
        { success: false, error: 'Missing proof or public inputs' },
        { status: 400 }
      );
    }

    console.log(`📝 Received ZK proof application for study #${studyId}`);
    console.log(`  - Proof generation time: ${proofTime}ms`);
    console.log(`  - Public inputs:`, publicInputs);

    // Get deployer private key from environment
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!deployerPrivateKey) {
      console.error('❌ DEPLOYER_PRIVATE_KEY not set in environment');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get StudyRegistry contract address from environment
    const studyRegistryAddress = process.env.NEXT_PUBLIC_STUDY_REGISTRY_ADDRESS;

    if (!studyRegistryAddress) {
      console.error('❌ STUDY_REGISTRY_ADDRESS not set in environment');
      return NextResponse.json(
        { success: false, error: 'Contract address not configured' },
        { status: 500 }
      );
    }

    // Create wallet client with deployer account
    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    const publicClient = createPublicClient({
      chain: optimismSepolia,
      transport: http(process.env.OPTIMISM_SEPOLIA_RPC_URL),
    });

    console.log(`🔗 Submitting proof to StudyRegistry at ${studyRegistryAddress}`);

    // StudyRegistry ABI for submitAnonymousApplication
    const STUDY_REGISTRY_ABI = [
      {
        inputs: [
          { name: '_studyId', type: 'uint256' },
          { name: '_ageProof', type: 'bytes' },
        ],
        name: 'submitAnonymousApplication',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;

    try {
      // Call submitAnonymousApplication on StudyRegistry
      const hash = await walletClient.writeContract({
        address: studyRegistryAddress as `0x${string}`,
        abi: STUDY_REGISTRY_ABI,
        functionName: 'submitAnonymousApplication',
        args: [BigInt(studyId), proof as `0x${string}`],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log(`✅ ZK proof verified and application submitted for study #${studyId}`);
      console.log(`  - Transaction hash: ${hash}`);
      console.log(`  - Block: ${receipt.blockNumber}`);

      return NextResponse.json({
        success: true,
        studyId,
        message: 'Application submitted successfully',
        verifiedOnChain: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
      });
    } catch (contractError: unknown) {
      console.log(`❌ ZK proof verification failed for study #${studyId}`);
      console.error('Contract error:', contractError);

      return NextResponse.json(
        {
          success: false,
          error: 'Proof verification failed on-chain',
          details: contractError instanceof Error ? contractError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing study application:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process application',
      },
      { status: 500 }
    );
  }
}
