import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekNumber, workedOn, blockers, nextWeekGoals } = await req.json();

  if (!workedOn || !nextWeekGoals) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const log = await prisma.weeklyLog.upsert({
    where: { userId_weekNumber: { userId: session.user.id, weekNumber } },
    update: { workedOn, blockers, nextWeekGoals, submittedAt: new Date() },
    create: {
      userId: session.user.id,
      weekNumber,
      workedOn,
      blockers,
      nextWeekGoals,
    },
  });

  return NextResponse.json(log);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = session.user.role === "ADMIN" 
    ? (searchParams.get("userId") ?? undefined) 
    : session.user.id;

  const logs = await prisma.weeklyLog.findMany({
    where: userId ? { userId } : undefined,
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ weekNumber: "desc" }, { submittedAt: "desc" }],
  });

  return NextResponse.json(logs);
}
