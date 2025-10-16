import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get study IDs for registryId 1-6
  const studies = await prisma.study.findMany({
    where: {
      registryId: { in: [1, 2, 3, 4, 5, 6] },
    },
    select: { id: true, registryId: true },
  });

  console.log(`Found ${studies.length} studies to clean`);

  for (const study of studies) {
    const deleted = await prisma.studyMilestone.deleteMany({
      where: { studyId: study.id },
    });
    console.log(`Deleted ${deleted.count} milestones from study #${study.registryId}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
