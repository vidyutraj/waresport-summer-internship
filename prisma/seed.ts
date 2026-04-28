import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Week 1 · Marketing — WARESPORT Marketing Intern Onboarding Tracker (starts first program week May 4). */
const MARKETING_WEEK1_TASKS: { title: string; description: string }[] = [
  {
    title: "Complete the Intern Onboarding Deck",
    description:
      "SETUP & ACCOUNTS\n\nWork through the full deck before starting any other tasks.",
  },
  {
    title: "Create a Reddit account (if you do not already have one)",
    description:
      "SETUP & ACCOUNTS\n\nUse a neutral, non-branded username.",
  },
  {
    title: "Create a Quora account (if you do not already have one)",
    description:
      "SETUP & ACCOUNTS\n\nUse a neutral, non-branded username.",
  },
  {
    title: "Follow Waresport on Instagram",
    description:
      "SETUP & ACCOUNTS\n\nhttps://instagram.com/waresport — follow from your personal account.",
  },
  {
    title: "Subscribe to the Waresport YouTube channel",
    description:
      "SETUP & ACCOUNTS\n\nSearch “Waresport” on YouTube and hit Subscribe.",
  },
  {
    title: "Leave a 5-Star Review for Waresport on the App Store or Google Play",
    description:
      "APP STORE REVIEW\n\nSearch “Waresport” on your device’s app store, download if needed, then leave a written 5-star review.",
  },
  {
    title: "Leave a positive review on Review Site 1",
    description:
      "PUBLIC REVIEW SITES\n\nURL: [TO BE FILLED IN BY MANAGER]",
  },
  {
    title: "Leave a positive review on Review Site 2",
    description:
      "PUBLIC REVIEW SITES\n\nURL: [TO BE FILLED IN BY MANAGER]",
  },
  {
    title: "Leave a positive review on Review Site 3",
    description:
      "PUBLIC REVIEW SITES\n\nURL: [TO BE FILLED IN BY MANAGER]",
  },
  {
    title: "Leave a positive review on Review Site 4",
    description:
      "PUBLIC REVIEW SITES\n\nURL: [TO BE FILLED IN BY MANAGER]",
  },
  {
    title: "Leave a positive review on Review Site 5",
    description:
      "PUBLIC REVIEW SITES\n\nURL: [TO BE FILLED IN BY MANAGER]",
  },
  {
    title: "Find and answer 10 relevant questions on Reddit",
    description:
      "REDDIT & QUORA COMMUNITY ENGAGEMENT\n\nUse the AI Prompt Guide (see “AI Prompt Guide” sheet) to draft authentic answers. Do NOT identify yourself as a Waresport team member.",
  },
  {
    title: "Find and answer 10 relevant questions on Quora",
    description:
      "REDDIT & QUORA COMMUNITY ENGAGEMENT\n\nUse the AI Prompt Guide (see “AI Prompt Guide” sheet) to draft authentic answers. Do NOT identify yourself as a Waresport team member.",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  const admins = [
    { name: "Devansh", email: "devansh@waresport.com", password: "Admin123!" },
    { name: "Vidyut", email: "vidyut@waresport.com", password: "Admin123!" },
  ];

  for (const admin of admins) {
    const hash = await bcrypt.hash(admin.password, 12);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
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

  const devansh = await prisma.user.findUnique({ where: { email: "devansh@waresport.com" } });
  if (!devansh) {
    console.log("⚠️ No devansh user; skipping content seed.");
    return;
  }

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
      await prisma.resource.create({ data: { ...r, uploadedBy: devansh.id } });
    }
  }
  console.log("✅ Onboarding resources up to date");

  const deleted = await prisma.task.deleteMany({ where: { weekNumber: 1 } });
  if (deleted.count > 0) {
    console.log(`🗑️ Removed ${deleted.count} previous Week 1 task(s)`);
  }

  const marketingInterns = await prisma.user.findMany({
    where: { role: "INTERN", track: "Marketing" },
    select: { id: true },
  });

  for (const t of MARKETING_WEEK1_TASKS) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        weekNumber: 1,
        assignedTo: "TRACK",
        track: "Marketing",
        createdBy: devansh.id,
        dueDate: new Date("2026-05-10T23:59:59"),
      },
    });
    if (marketingInterns.length > 0) {
      await prisma.taskAssignment.createMany({
        data: marketingInterns.map((u) => ({ taskId: task.id, userId: u.id })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`✅ Created ${MARKETING_WEEK1_TASKS.length} Marketing Week 1 tasks (assignments for ${marketingInterns.length} Marketing intern(s))`);

  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to the Waresport internship 🚀",
        body:
          "Week 1 starts your Marketing onboarding tracker in Tasks. Complete the deck first, then work through accounts, reviews, and community tasks. Ask your manager for Review Site URLs where noted.",
        createdBy: devansh.id,
      },
    });
    console.log("✅ Welcome announcement created");
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
