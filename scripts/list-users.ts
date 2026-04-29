import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env or export it for this command.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true, createdAt: true },
    orderBy: { email: "asc" },
  });

  if (users.length === 0) {
    console.log("No users in this database. Run npm run db:seed or db:seed:fresh.");
    return;
  }

  console.log(`${users.length} user(s) in database (from DATABASE_URL host):\n`);
  console.table(users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
