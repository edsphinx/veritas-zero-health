/**
 * Blockchain → Database Sync Script
 *
 * Synchronizes on-chain study data from Optimism Sepolia with the Prisma database.
 * This script reads studies from the deployed StudyRegistry and ResearchFundingEscrow
 * contracts and ensures the database has complete, up-to-date records.
 *
 * Usage:
 *   pnpm sync:blockchain          # Apply changes to database
 *   pnpm sync:blockchain:dry-run  # Preview changes without modifying database
 *
 * What it syncs:
 * - Studies from StudyRegistry contract
 * - Eligibility criteria for each study
 * - Default milestones for studies missing them
 * - Applications/applicant counts
 *
 * @author Veritas Zero Health
 */

import { createPublicClient, http, type Address } from 'viem';
import { optimismSepolia } from 'viem/chains';
import { PrismaClient } from '@prisma/client';
import { StudyStatus, MilestoneType } from '@veritas/types/study';

// Import deployed contract addresses and ABIs
import deployedContracts from '../contracts/deployedContracts';

// ============================================================================
// Configuration
// ============================================================================

const CHAIN_ID = 11155420; // Optimism Sepolia
const PLACEHOLDER_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const PLACEHOLDER_BLOCK_NUMBER = BigInt(0);

// Contract addresses
const CONTRACTS = deployedContracts[11155420];
const STUDY_REGISTRY_ADDRESS = CONTRACTS.StudyRegistry.address as Address;
const STUDY_REGISTRY_ABI = CONTRACTS.StudyRegistry.abi;
const ESCROW_ADDRESS = CONTRACTS.ResearchFundingEscrow.address as Address;
const ESCROW_ABI = CONTRACTS.ResearchFundingEscrow.abi;

// Initialize clients
const publicClient = createPublicClient({
  chain: optimismSepolia,
  transport: http('https://sepolia.optimism.io'),
});

const prisma = new PrismaClient({
  log: ['error'], // Only log errors during sync
});

// ============================================================================
// Types
// ============================================================================

interface StudyDetailsFromChain {
  studyId: bigint;
  researcher: Address;
  status: number;
  region: string;
  compensationDetails: string;
  criteriaURI: string;
}

interface StudyCriteriaFromChain {
  minAge: number;
  maxAge: number;
  requiresAgeProof: boolean;
  requiredEligibilityCodeHash: bigint;
  requiresEligibilityProof: boolean;
}

interface SyncStats {
  studies: { synced: number; created: number; failed: number };
  criteria: { synced: number; created: number; failed: number };
  milestones: { synced: number; created: number; failed: number };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert contract status to StudyStatus enum
 * Contract statuses:
 * 0 = Recruiting (Created in smart contract, but we map based on funding)
 * 1 = Closed -> Paused
 * 2 = Completed -> Completed
 */
function convertContractStatus(contractStatus: number, hasMilestones: boolean = false): StudyStatus {
  switch (contractStatus) {
    case 0:
      // If recruiting and has milestones, it needs funding
      return hasMilestones ? StudyStatus.Funding : StudyStatus.Created;
    case 1:
      return StudyStatus.Paused;
    case 2:
      return StudyStatus.Completed;
    default:
      return StudyStatus.Created;
  }
}

/**
 * Convert USDC from base units (6 decimals) to display format
 * Example: 100000000 -> "100.00"
 */
function convertUSDCToDisplay(baseUnits: string): string {
  return (Number(baseUnits) / 1_000_000).toFixed(2);
}

/**
 * Generate default milestones for a study
 * NOTE: rewardAmount is stored in human-readable format (e.g., "100.00")
 */
function getDefaultMilestones(escrowId: number) {
  const milestones = [
    {
      escrowId,
      milestoneId: 0,
      milestoneType: MilestoneType.Initial,
      description: 'Enrollment and Baseline Assessment',
      rewardAmount: convertUSDCToDisplay('100000000'), // 100 USDC -> "100.00"
      transactionHash: PLACEHOLDER_TX_HASH,
      blockNumber: PLACEHOLDER_BLOCK_NUMBER,
      chainId: CHAIN_ID,
    },
    {
      escrowId,
      milestoneId: 1,
      milestoneType: MilestoneType.Intermediate,
      description: 'First Follow-up Visit',
      rewardAmount: convertUSDCToDisplay('150000000'), // 150 USDC -> "150.00"
      transactionHash: PLACEHOLDER_TX_HASH,
      blockNumber: PLACEHOLDER_BLOCK_NUMBER,
      chainId: CHAIN_ID,
    },
    {
      escrowId,
      milestoneId: 2,
      milestoneType: MilestoneType.Intermediate,
      description: 'Mid-study Assessment',
      rewardAmount: convertUSDCToDisplay('150000000'), // 150 USDC -> "150.00"
      transactionHash: PLACEHOLDER_TX_HASH,
      blockNumber: PLACEHOLDER_BLOCK_NUMBER,
      chainId: CHAIN_ID,
    },
    {
      escrowId,
      milestoneId: 3,
      milestoneType: MilestoneType.FollowUp,
      description: 'Final Follow-up Visit',
      rewardAmount: convertUSDCToDisplay('200000000'), // 200 USDC -> "200.00"
      transactionHash: PLACEHOLDER_TX_HASH,
      blockNumber: PLACEHOLDER_BLOCK_NUMBER,
      chainId: CHAIN_ID,
    },
    {
      escrowId,
      milestoneId: 4,
      milestoneType: MilestoneType.Completion,
      description: 'Study Completion',
      rewardAmount: convertUSDCToDisplay('400000000'), // 400 USDC -> "400.00"
      transactionHash: PLACEHOLDER_TX_HASH,
      blockNumber: PLACEHOLDER_BLOCK_NUMBER,
      chainId: CHAIN_ID,
    },
  ];

  return milestones;
}

/**
 * Get default medical criteria values
 */
function getDefaultMedicalCriteria() {
  return {
    hba1cMin: 5.0,
    hba1cMax: 7.0,
    ldlMin: 50,
    ldlMax: 130,
    cholesterolMin: 125,
    cholesterolMax: 200,
    systolicBPMin: 90,
    systolicBPMax: 140,
    diastolicBPMin: 60,
    diastolicBPMax: 90,
    bmiMin: 18.5,
    bmiMax: 30,
  };
}

// ============================================================================
// Main Sync Functions
// ============================================================================

/**
 * Fetch study details from blockchain
 */
async function fetchStudyFromChain(studyId: number): Promise<StudyDetailsFromChain | null> {
  try {
    const result = await publicClient.readContract({
      address: STUDY_REGISTRY_ADDRESS,
      abi: STUDY_REGISTRY_ABI,
      functionName: 'getStudyDetails',
      args: [BigInt(studyId)],
    });

    return result as StudyDetailsFromChain;
  } catch (error) {
    console.error(`  ❌ Failed to fetch study ${studyId} from chain:`, error);
    return null;
  }
}

/**
 * Fetch study criteria from blockchain
 */
async function fetchCriteriaFromChain(studyId: number): Promise<StudyCriteriaFromChain | null> {
  try {
    const result = await publicClient.readContract({
      address: STUDY_REGISTRY_ADDRESS,
      abi: STUDY_REGISTRY_ABI,
      functionName: 'getStudyCriteria',
      args: [BigInt(studyId)],
    });

    return result as StudyCriteriaFromChain;
  } catch (error) {
    console.error(`  ❌ Failed to fetch criteria for study ${studyId}:`, error);
    return null;
  }
}

/**
 * Fetch verified applicants count from blockchain
 */
async function fetchApplicantsCount(studyId: number): Promise<bigint> {
  try {
    const result = await publicClient.readContract({
      address: STUDY_REGISTRY_ADDRESS,
      abi: STUDY_REGISTRY_ABI,
      functionName: 'getVerifiedApplicantsCount',
      args: [BigInt(studyId)],
    });

    return result as bigint;
  } catch {
    console.error(`  ⚠️  Could not fetch applicants count for study ${studyId}`);
    return BigInt(0);
  }
}

/**
 * Fetch milestones from blockchain for a study
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMilestonesFromChain(escrowId: number): Promise<any[]> {
  try {
    // First, get the array of milestone IDs for this study
    const milestoneIds = await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getStudyMilestones',
      args: [BigInt(escrowId)],
    }) as bigint[];

    if (milestoneIds.length === 0) {
      return [];
    }

    console.log(`  📋 Found ${milestoneIds.length} milestone IDs on-chain for escrow ${escrowId}`);

    // Fetch each milestone's full data
    const milestones = [];
    for (const milestoneId of milestoneIds) {
      try {
        const milestone = await publicClient.readContract({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: 'getMilestone',
          args: [milestoneId],
        });
        milestones.push(milestone);
      } catch {
        console.error(`    ⚠️  Failed to fetch milestone ${milestoneId}`);
      }
    }

    return milestones;
  } catch (error) {
    console.error(`  ⚠️  Could not fetch milestones for escrow ${escrowId}:`, error);
    return [];
  }
}

/**
 * Sync a single study to the database
 * Returns studyDbId and hasMilestones flag for status determination
 */
async function syncStudy(
  studyId: number,
  studyDetails: StudyDetailsFromChain,
  hasMilestones: boolean,
  dryRun: boolean
): Promise<{ studyDbId: string | null; isNew: boolean; success: boolean }> {
  try {
    // Check if study already exists
    const existingStudy = await prisma.study.findUnique({
      where: { registryId: studyId },
    });

    const status = convertContractStatus(studyDetails.status, hasMilestones);

    // Extract title and description from compensation details or use defaults
    const title = `Clinical Study #${studyId}`;
    const description = studyDetails.compensationDetails || `Study in ${studyDetails.region}`;

    if (existingStudy) {
      // Update existing study
      if (!dryRun) {
        await prisma.study.update({
          where: { registryId: studyId },
          data: {
            status,
            researcherAddress: studyDetails.researcher.toLowerCase(),
          },
        });
      }
      return { studyDbId: existingStudy.id, isNew: false, success: true };
    } else {
      // Create new study
      if (!dryRun) {
        const newStudy = await prisma.study.create({
          data: {
            registryId: studyId,
            escrowId: studyId, // Assuming same ID for now
            title,
            description,
            researcherAddress: studyDetails.researcher.toLowerCase(),
            status,
            chainId: CHAIN_ID,
            escrowTxHash: PLACEHOLDER_TX_HASH,
            registryTxHash: PLACEHOLDER_TX_HASH,
            criteriaTxHash: PLACEHOLDER_TX_HASH,
            escrowBlockNumber: PLACEHOLDER_BLOCK_NUMBER,
            registryBlockNumber: PLACEHOLDER_BLOCK_NUMBER,
          },
        });
        return { studyDbId: newStudy.id, isNew: true, success: true };
      }
      return { studyDbId: null, isNew: true, success: true };
    }
  } catch (error) {
    console.error(`  ❌ Failed to sync study ${studyId}:`, error);
    return { studyDbId: null, isNew: false, success: false };
  }
}

/**
 * Sync study criteria to the database
 */
async function syncCriteria(
  studyDbId: string,
  studyId: number,
  criteria: StudyCriteriaFromChain,
  dryRun: boolean
): Promise<{ isNew: boolean; success: boolean }> {
  try {
    // Check if criteria already exists
    const existingCriteria = await prisma.studyCriteria.findUnique({
      where: { studyId: studyDbId },
    });

    if (existingCriteria) {
      return { isNew: false, success: true };
    }

    // Create new criteria with default medical values
    if (!dryRun) {
      const medicalDefaults = getDefaultMedicalCriteria();
      await prisma.studyCriteria.create({
        data: {
          studyId: studyDbId,
          escrowId: studyId,
          minAge: criteria.minAge,
          maxAge: criteria.maxAge,
          eligibilityCodeHash: criteria.requiredEligibilityCodeHash.toString(),
          ...medicalDefaults,
          transactionHash: PLACEHOLDER_TX_HASH,
          blockNumber: PLACEHOLDER_BLOCK_NUMBER,
          chainId: CHAIN_ID,
        },
      });
    }

    return { isNew: true, success: true };
  } catch (error) {
    console.error(`  ❌ Failed to sync criteria for study ${studyId}:`, error);
    return { isNew: false, success: false };
  }
}

/**
 * Sync milestones for a study
 */
async function syncMilestones(
  studyDbId: string,
  escrowId: number,
  dryRun: boolean
): Promise<{ count: number; success: boolean }> {
  try {
    // Check if milestones already exist
    const existingMilestones = await prisma.studyMilestone.findMany({
      where: { studyId: studyDbId },
    });

    if (existingMilestones.length > 0) {
      return { count: 0, success: true };
    }

    // Fetch milestones from blockchain
    const chainMilestones = await fetchMilestonesFromChain(escrowId);

    if (chainMilestones.length === 0) {
      console.log(`  ⚠️  No milestones found on-chain, using defaults`);
      // Fallback to default milestones if none found on-chain
      if (!dryRun) {
        const milestones = getDefaultMilestones(escrowId);
        await prisma.studyMilestone.createMany({
          data: milestones.map((m) => ({
            studyId: studyDbId,
            escrowId: m.escrowId,
            milestoneId: m.milestoneId,
            milestoneType: m.milestoneType,
            description: m.description,
            rewardAmount: m.rewardAmount,
            transactionHash: m.transactionHash,
            blockNumber: m.blockNumber,
            chainId: m.chainId,
          })),
        });
      }
      return { count: 5, success: true };
    }

    // Create milestones from blockchain data
    if (!dryRun) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const milestonesToCreate = chainMilestones.map((m: any, index: number) => {
        // Milestone structure from contract:
        // [0] id (bigint)
        // [1] studyId (bigint)
        // [2] milestoneType (number)
        // [3] description (string)
        // [4] rewardAmount (bigint)
        // [5] status (number)
        // [6] verificationDataHash (bytes32)
        // [7] createdAt (bigint)
        // [8] completedAt (bigint)
        // [9] verifiedAt (bigint)

        const _milestoneId = m[0] || m.id;
        const milestoneType = m[2] || m.milestoneType;
        const description = m[3] || m.description;
        const rewardAmount = m[4] || m.rewardAmount;

        if (!rewardAmount) {
          console.log(`  ⚠️  Milestone ${index} missing reward amount, using structure indices`);
          throw new Error(`Milestone ${index} missing reward amount`);
        }

        return {
          studyId: studyDbId,
          escrowId: escrowId,
          milestoneId: index,
          milestoneType: Number(milestoneType),
          description: description || `Milestone ${index}`,
          rewardAmount: convertUSDCToDisplay(rewardAmount.toString()),
          transactionHash: PLACEHOLDER_TX_HASH,
          blockNumber: PLACEHOLDER_BLOCK_NUMBER,
          chainId: CHAIN_ID,
        };
      });

      await prisma.studyMilestone.createMany({
        data: milestonesToCreate,
      });
    }

    return { count: chainMilestones.length, success: true };
  } catch (error) {
    console.error(`  ❌ Failed to sync milestones for escrow ${escrowId}:`, error);
    return { count: 0, success: false };
  }
}

/**
 * Calculate and update totalFunding for a study based on its milestones
 */
async function updateTotalFunding(studyDbId: string): Promise<void> {
  try {
    // Get all milestones for the study
    const milestones = await prisma.studyMilestone.findMany({
      where: { studyId: studyDbId },
    });

    if (milestones.length === 0) {
      console.log(`  ⚠️  No milestones found, setting totalFunding to 0`);
      await prisma.study.update({
        where: { id: studyDbId },
        data: { totalFunding: '0.00' },
      });
      return;
    }

    // Calculate total funding (sum of all milestone rewards)
    // rewardAmount is already in display format (e.g., "100.00")
    const totalFunding = milestones.reduce((sum: any, milestone: any) => {
      return sum + parseFloat(milestone.rewardAmount.toString());
    }, 0);

    // Update study with calculated totalFunding
    await prisma.study.update({
      where: { id: studyDbId },
      data: { totalFunding: totalFunding.toFixed(2) },
    });

    console.log(`  💰 Updated totalFunding: $${totalFunding.toFixed(2)} USDC`);
  } catch (error) {
    console.error(`  ❌ Failed to update totalFunding for study ${studyDbId}:`, error);
  }
}

/**
 * Main sync function
 */
async function syncStudies(dryRun: boolean): Promise<void> {
  const stats: SyncStats = {
    studies: { synced: 0, created: 0, failed: 0 },
    criteria: { synced: 0, created: 0, failed: 0 },
    milestones: { synced: 0, created: 0, failed: 0 },
  };

  console.log('\n🔄 Blockchain → Database Sync');
  console.log('━'.repeat(50));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  LIVE MODE (changes will be applied)'}`);
  console.log(`Network: Optimism Sepolia (${CHAIN_ID})`);
  console.log(`StudyRegistry: ${STUDY_REGISTRY_ADDRESS}`);
  console.log('');

  try {
    // Step 1: Get total studies from chain
    console.log('📊 Fetching on-chain data...');
    const totalStudies = await publicClient.readContract({
      address: STUDY_REGISTRY_ADDRESS,
      abi: STUDY_REGISTRY_ABI,
      functionName: 'getTotalStudies',
    });

    const totalStudiesNum = Number(totalStudies);
    console.log(`Found ${totalStudiesNum} studies on-chain\n`);

    if (totalStudiesNum === 0) {
      console.log('⚠️  No studies found on-chain. Nothing to sync.');
      return;
    }

    // Step 2: Sync each study
    // Note: Study IDs start from 1, not 0
    for (let i = 1; i <= totalStudiesNum; i++) {
      console.log(`📝 Syncing Study #${i}...`);

      // Fetch study details from chain
      const studyDetails = await fetchStudyFromChain(i);
      if (!studyDetails) {
        stats.studies.failed++;
        continue;
      }

      // Check if study has milestones on-chain
      const chainMilestones = await fetchMilestonesFromChain(i);
      const hasMilestones = chainMilestones.length > 0;

      // Sync study to database
      const studyResult = await syncStudy(i, studyDetails, hasMilestones, dryRun);
      if (!studyResult.success) {
        stats.studies.failed++;
        continue;
      }

      if (studyResult.isNew) {
        console.log(`  ⚠️  Study not in DB ${dryRun ? '(will create)' : '(created)'}`);
        stats.studies.created++;
      } else {
        console.log(`  ✓ Study exists in DB`);
        stats.studies.synced++;
      }

      // If dry run and study doesn't exist, we can't sync relations
      if (dryRun && !studyResult.studyDbId) {
        console.log(`  ⚠️  Skipping criteria/milestones sync (study not in DB yet)`);
        continue;
      }

      const studyDbId = studyResult.studyDbId!;

      // Fetch and sync criteria
      const criteria = await fetchCriteriaFromChain(i);
      if (criteria) {
        const criteriaResult = await syncCriteria(studyDbId, i, criteria, dryRun);
        if (criteriaResult.success) {
          if (criteriaResult.isNew) {
            console.log(`  ⚠️  Missing criteria ${dryRun ? '(will create)' : '(created)'}`);
            stats.criteria.created++;
          } else {
            console.log(`  ✓ Criteria exists in DB`);
            stats.criteria.synced++;
          }
        } else {
          stats.criteria.failed++;
        }
      } else {
        console.log(`  ⚠️  No criteria found on-chain`);
      }

      // Sync milestones
      const milestonesResult = await syncMilestones(studyDbId, i, dryRun);
      if (milestonesResult.success) {
        if (milestonesResult.count > 0) {
          console.log(
            `  ⚠️  Missing ${milestonesResult.count} milestones ${dryRun ? '(will create)' : '(created)'}`
          );
          stats.milestones.created += milestonesResult.count;
        } else {
          console.log(`  ✓ Milestones exist in DB`);
          stats.milestones.synced++;
        }

        // Calculate and update totalFunding after syncing milestones
        if (!dryRun) {
          await updateTotalFunding(studyDbId);
        }
      } else {
        stats.milestones.failed++;
      }

      // Fetch applicants count (for info only)
      const applicantsCount = await fetchApplicantsCount(i);
      if (applicantsCount > 0) {
        console.log(`  📋 ${applicantsCount} verified applicants on-chain`);
      }

      console.log(''); // Empty line between studies
    }

    // Step 3: Print summary
    console.log('✅ Sync Summary');
    console.log('━'.repeat(50));
    console.log(
      `Studies:    ${stats.studies.synced} synced, ${stats.studies.created} ${dryRun ? 'to create' : 'created'}, ${stats.studies.failed} failed`
    );
    console.log(
      `Criteria:   ${stats.criteria.synced} synced, ${stats.criteria.created} ${dryRun ? 'to create' : 'created'}, ${stats.criteria.failed} failed`
    );
    console.log(
      `Milestones: ${stats.milestones.synced} synced, ${stats.milestones.created} ${dryRun ? 'to create' : 'created'}, ${stats.milestones.failed} failed`
    );

    if (dryRun) {
      console.log('\n💡 Run without --dry-run to apply changes.');
    } else {
      console.log('\n✨ Sync completed successfully!');
    }
  } catch (error) {
    console.error('\n❌ Fatal error during sync:', error);
    throw error;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  try {
    await syncStudies(dryRun);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
