import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const subs = await prisma.taskSubmission.deleteMany();
  const assigns = await prisma.taskAssignment.deleteMany();
  const tasks = await prisma.task.deleteMany();

  console.log(
    `Removed ${tasks.count} task(s), ${assigns.count} assignment(s), ${subs.count} submission(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
