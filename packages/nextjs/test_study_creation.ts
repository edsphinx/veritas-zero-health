import { PrismaClient } from '@prisma/client';
import { StudyStatus } from '@veritas/types';

const prisma = new PrismaClient();

async function testStudyCreation() {
  try {
    console.log('Testing study creation with status field...');
    
    // Create test study
    const study = await prisma.study.create({
      data: {
        registryId: 999,
        escrowId: 999,
        title: 'Test Study - Status Fix',
        description: 'Testing the status field fix',
        researcherAddress: '0xf39ca026377a84de1ee49cb62bac4e3aba8c73f7',
        status: StudyStatus.Created,
        chainId: 11155420,
        escrowTxHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        registryTxHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
        criteriaTxHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
        escrowBlockNumber: BigInt(34411100),
        registryBlockNumber: BigInt(34411101),
      },
    });

    console.log('✅ Study created successfully!');
    console.log('Study ID:', study.id);
    console.log('Registry ID:', study.registryId);
    console.log('Escrow ID:', study.escrowId);
    console.log('Status:', study.status);
    console.log('Title:', study.title);
    
    // Clean up - delete test study
    await prisma.study.delete({
      where: { id: study.id },
    });
    
    console.log('✅ Test study cleaned up');
    console.log('\n🎉 SUCCESS: Study creation works correctly with status field!');
    
  } catch (error) {
    console.error('❌ Error creating study:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testStudyCreation();
