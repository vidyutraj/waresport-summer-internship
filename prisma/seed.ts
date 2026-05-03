import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getSeedAdminsFromEnv() {
  const admins = [
    {
      name: process.env.SEED_ADMIN_1_NAME?.trim(),
      email: process.env.SEED_ADMIN_1_EMAIL?.trim().toLowerCase(),
      password: process.env.SEED_ADMIN_1_PASSWORD,
    },
    {
      name: process.env.SEED_ADMIN_2_NAME?.trim(),
      email: process.env.SEED_ADMIN_2_EMAIL?.trim().toLowerCase(),
      password: process.env.SEED_ADMIN_2_PASSWORD,
    },
  ];

  for (let i = 0; i < admins.length; i++) {
    const a = admins[i];
    if (!a.name || !a.email || !a.password) {
      throw new Error(
        `Missing SEED_ADMIN_${i + 1}_NAME, SEED_ADMIN_${i + 1}_EMAIL, or SEED_ADMIN_${i + 1}_PASSWORD. See .env.example.`
      );
    }
  }

  return admins as { name: string; email: string; password: string }[];
}

async function clearAllApplicationData() {
  await prisma.taskSubmission.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.weeklyLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const reset = process.env.SEED_RESET_DB === "true";
  if (reset) {
    console.log("🗑️  SEED_RESET_DB=true — deleting all users, tasks, logs, resources, announcements…");
    await clearAllApplicationData();
  }

  console.log("🌱 Seeding database…");

  const admins = getSeedAdminsFromEnv();

  for (const admin of admins) {
    const hash = await bcrypt.hash(admin.password, 12);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        passwordHash: hash,
        role: "ADMIN",
        mustChangePassword: false,
      },
      create: {
        name: admin.name,
        email: admin.email,
        passwordHash: hash,
        role: "ADMIN",
        mustChangePassword: false,
      },
    });
    console.log(`✅ Admin: ${admin.email}`);
  }

  const primaryAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: admins[0].email },
  });

  // Hardcoded intern accounts
  const interns = [
    { name: "Joseph Parli",  email: "josephparli@waresport.com",  password: "Waresport2025!" },
    { name: "Catherine",     email: "catherine@waresport.com",    password: "Waresport2025!" },
    { name: "David Z.",      email: "davidz@waresport.com",       password: "Waresport2025!" },
    { name: "Olivia Mohil",  email: "oliviamohil@waresport.com",  password: "Waresport2025!" },
    { name: "Paul Hoch",     email: "paulhoch@waresport.com",     password: "Waresport2025!" },
    { name: "Cecilia",       email: "cecilia@waresport.com",      password: "Waresport2025!" },
    { name: "Elilah",      email: "elilah@waresport.com",       password: "Waresport2025!" },
    { name: "Tinsley",     email: "tinsley@waresport.com",      password: "Waresport2025!" },
    { name: "Sebastian",   email: "sebastian@waresport.com",    password: "Waresport2025!" },
  ];

  for (const intern of interns) {
    const hash = await bcrypt.hash(intern.password, 12);
    await prisma.user.upsert({
      where: { email: intern.email },
      update: { name: intern.name, passwordHash: hash, role: "INTERN", mustChangePassword: false },
      create: { name: intern.name, email: intern.email, passwordHash: hash, role: "INTERN", mustChangePassword: false },
    });
    console.log(`✅ Intern: ${intern.email}`);
  }

  await prisma.resource.deleteMany({
    where: {
      title: {
        in: [
          "Welcome to Waresport",
          "Company Overview Deck",
          "Market Research Report",
          "Marketing Intern Onboarding Deck",
          "AI Prompt Guide",
        ],
      },
    },
  });

  console.log("✅ Resources up to date (add resources in admin)");

  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to the Waresport internship 🚀",
        body:
          "Check Tasks and Resources for your weekly work. Your admins will post updates here.",
        createdBy: primaryAdmin.id,
      },
    });
    console.log("✅ Welcome announcement created");
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
