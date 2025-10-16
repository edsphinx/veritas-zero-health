/**
 * Add Milestones to Studies Script
 *
 * This script adds random milestones to studies 1-6 that don't have milestones on-chain.
 * It uses the ResearchFundingEscrow contract's addMilestone function.
 *
 * Usage:
 *   pnpm tsx scripts/add-milestones-to-studies.ts
 */

import { config } from 'dotenv';
import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import deployedContracts from '../contracts/deployedContracts';

// Load environment variables
config();

// ============================================================================
// Configuration
// ============================================================================

const CHAIN_ID = 11155420; // Optimism Sepolia
const CONTRACTS = deployedContracts[11155420];
const ESCROW_ADDRESS = CONTRACTS.ResearchFundingEscrow.address as Address;
const ESCROW_ABI = CONTRACTS.ResearchFundingEscrow.abi;

// Studies to add milestones to
const STUDY_IDS = [1, 2, 3, 4, 5, 6];

// Milestone types enum
enum MilestoneType {
  Enrollment = 0,
  DataSubmission = 1,
  FollowUpVisit = 2,
  StudyCompletion = 3,
  Custom = 4,
}

// ============================================================================
// Setup clients
// ============================================================================

const publicClient = createPublicClient({
  chain: optimismSepolia,
  transport: http('https://sepolia.optimism.io'),
});

// Get researcher private key from environment
const privateKey = process.env.RESEARCHER_1_PRIVATE_KEY;
if (!privateKey) {
  console.error('❌ RESEARCHER_1_PRIVATE_KEY not found in environment');
  process.exit(1);
}

// Add 0x prefix if not present
const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: optimismSepolia,
  transport: http('https://sepolia.optimism.io'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate random milestones for a study
 */
function generateRandomMilestones(_studyId: number) {
  // Random number of appointments (3-8)
  const numAppointments = Math.floor(Math.random() * 6) + 3;

  // Random total payment per participant ($200 - $1000)
  const totalPayment = Math.floor(Math.random() * 800) + 200;

  // Payment per appointment in USDC (6 decimals)
  const paymentPerAppointment = Math.floor((totalPayment / numAppointments) * 1_000_000);

  console.log(`  💰 Total payment: $${totalPayment}, ${numAppointments} appointments, $${(totalPayment / numAppointments).toFixed(2)} per appointment`);

  const milestones = [];

  for (let i = 0; i < numAppointments; i++) {
    let milestoneType: MilestoneType;
    let description: string;

    if (i === 0) {
      // First appointment
      milestoneType = MilestoneType.Enrollment;
      description = 'Initial Visit and Enrollment';
    } else if (i === numAppointments - 1) {
      // Last appointment
      milestoneType = MilestoneType.StudyCompletion;
      description = 'Final Visit and Study Completion';
    } else {
      // Middle appointments
      milestoneType = MilestoneType.FollowUpVisit;
      description = `Follow-up Visit ${i}`;
    }

    milestones.push({
      milestoneType,
      description,
      rewardAmount: BigInt(paymentPerAppointment),
    });
  }

  return milestones;
}

/**
 * Check if a study already has milestones on-chain
 */
async function hasExistingMilestones(studyId: number): Promise<boolean> {
  try {
    const milestoneIds = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getStudyMilestones',
      args: [BigInt(studyId)],
    }) as bigint[];

    return milestoneIds.length > 0;
  } catch {
    return false;
  }
}

/**
 * Add a milestone to a study on-chain
 */
async function addMilestone(
  studyId: number,
  milestoneType: MilestoneType,
  description: string,
  rewardAmount: bigint
): Promise<string> {
  const hash = await walletClient.writeContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'addMilestone',
    args: [BigInt(studyId), milestoneType, description, rewardAmount],
  });

  // Wait for transaction confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed: ${hash}`);
  }

  return hash;
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  console.log('\n🎯 Adding Milestones to Studies');
  console.log('━'.repeat(60));
  console.log(`Network: Optimism Sepolia (${CHAIN_ID})`);
  console.log(`Escrow Contract: ${ESCROW_ADDRESS}`);
  console.log(`Researcher Address: ${account.address}`);
  console.log(`Studies to process: ${STUDY_IDS.join(', ')}`);
  console.log('');

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const studyId of STUDY_IDS) {
    console.log(`\n📚 Processing Study #${studyId}...`);

    // Check if study already has milestones
    const hasMilestones = await hasExistingMilestones(studyId);

    if (hasMilestones) {
      console.log(`  ⏭️  Study already has milestones, skipping`);
      totalSkipped++;
      continue;
    }

    // Generate random milestones
    const milestones = generateRandomMilestones(studyId);
    console.log(`  📝 Generated ${milestones.length} milestones`);

    // Add each milestone
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];

      try {
        console.log(`    ${i + 1}/${milestones.length} Adding: ${milestone.description}...`);

        const hash = await addMilestone(
          studyId,
          milestone.milestoneType,
          milestone.description,
          milestone.rewardAmount
        );

        console.log(`    ✅ Added (tx: ${hash.substring(0, 10)}...)`);
        totalAdded++;

        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`    ❌ Failed to add milestone:`, error);
      }
    }
  }

  console.log('\n✅ Summary');
  console.log('━'.repeat(60));
  console.log(`Total milestones added: ${totalAdded}`);
  console.log(`Studies skipped: ${totalSkipped}`);
  console.log('\n✨ Done! Run the sync script to update the database.');
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
