import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssignedTo } from "@prisma/client";
import { parseTaskSubmissionSettings } from "@/lib/submission-kind";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    description,
    weekNumber,
    dueDate,
    assignedTo,
    track,
    assignedUserId,
    assignedUserIds,
    requiresSubmission,
    submissionKind,
  } = body as {
    title: string;
    description?: string | null;
    weekNumber: number;
    dueDate?: string | null;
    assignedTo: string;
    track?: string | null;
    assignedUserId?: string | null;
    assignedUserIds?: string[];
    requiresSubmission?: boolean;
    submissionKind?: string;
  };

  const sub = parseTaskSubmissionSettings({ requiresSubmission, submissionKind });
  if (!sub.ok) {
    return NextResponse.json({ error: sub.error }, { status: 400 });
  }

  if (!title || !weekNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const individualIds: string[] =
    Array.isArray(assignedUserIds) && assignedUserIds.length > 0
      ? assignedUserIds
      : assignedUserId
        ? [assignedUserId]
        : [];

  if (assignedTo === "INDIVIDUAL" && individualIds.length === 0) {
    return NextResponse.json(
      { error: "Please select at least one intern to assign this task to" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      weekNumber,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: (assignedTo ?? "ALL") as AssignedTo,
      track: assignedTo === "TRACK" ? track : null,
      assignedUserId:
        assignedTo === "INDIVIDUAL" && individualIds.length === 1 ? individualIds[0] : null,
      requiresSubmission: sub.requiresSubmission,
      submissionKind: sub.submissionKind,
      createdBy: session.user.id,
    },
  });

  // Auto-assign TaskAssignment records
  let internIds: { id: string }[] = [];

  if (assignedTo === "ALL") {
    internIds = await prisma.user.findMany({
      where: { role: "INTERN" },
      select: { id: true },
    });
  } else if (assignedTo === "TRACK" && track) {
    internIds = await prisma.user.findMany({
      where: { role: "INTERN", tracks: { has: track } },
      select: { id: true },
    });
  } else if (assignedTo === "INDIVIDUAL" && individualIds.length > 0) {
    const valid = await prisma.user.findMany({
      where: { id: { in: individualIds }, role: "INTERN" },
      select: { id: true },
    });
    internIds = valid;
  }

  if (internIds.length > 0) {
    await prisma.taskAssignment.createMany({
      data: internIds.map((intern) => ({ taskId: task.id, userId: intern.id })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json(task);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    include: { assignments: true },
    orderBy: [{ weekNumber: "asc" }],
  });

  return NextResponse.json(tasks);
}
