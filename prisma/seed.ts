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

  const primary = await prisma.user.findUniqueOrThrow({
    where: { email: admins[0].email },
  });

  await prisma.resource.deleteMany({
    where: {
      title: {
        in: [
          "Welcome to Waresport",
          "Company Overview Deck",
          "Market Research Report",
        ],
      },
    },
  });

  const coreResources = [
    {
      title: "Marketing Intern Onboarding Deck",
      category: "Onboarding",
      url: "https://notion.so",
      isRequired: true,
      description: "Work through the full deck before other Week 1 tasks.",
    },
    {
      title: "AI Prompt Guide",
      category: "Onboarding",
      url: "https://notion.so",
      isRequired: true,
      description:
        "Use for authentic Reddit & Quora answers — do not identify as Waresport staff.",
    },
  ];

  for (const r of coreResources) {
    const exists = await prisma.resource.findFirst({ where: { title: r.title } });
    if (!exists) {
      await prisma.resource.create({ data: { ...r, uploadedBy: primary.id } });
    }
  }
  console.log("✅ Onboarding resources up to date (tasks are not seeded — add them in admin)");

  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to the Waresport internship 🚀",
        body:
          "Check Tasks and Resources for your weekly work. Your admins will post updates here.",
        createdBy: primary.id,
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
