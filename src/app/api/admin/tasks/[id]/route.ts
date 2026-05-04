import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssignedTo, Role } from "@prisma/client";
import { parseTaskSubmissionSettings } from "@/lib/submission-kind";
import type { Task } from "@prisma/client";

async function syncAssignmentsAfterUpdate(
  task: Task,
  explicitIndividualIds: string[] | undefined
) {
  let targetUserIds: string[] = [];

  if (task.assignedTo === AssignedTo.ALL) {
    const rows = await prisma.user.findMany({
      where: { role: Role.INTERN },
      select: { id: true },
    });
    targetUserIds = rows.map((r) => r.id);
  } else if (task.assignedTo === AssignedTo.TRACK && task.track) {
    const rows = await prisma.user.findMany({
      where: { role: Role.INTERN, track: task.track },
      select: { id: true },
    });
    targetUserIds = rows.map((r) => r.id);
  } else if (task.assignedTo === AssignedTo.INDIVIDUAL) {
    if (explicitIndividualIds && explicitIndividualIds.length > 0) {
      const valid = await prisma.user.findMany({
        where: { id: { in: explicitIndividualIds }, role: Role.INTERN },
        select: { id: true },
      });
      targetUserIds = valid.map((v) => v.id);
    } else if (task.assignedUserId) {
      targetUserIds = [task.assignedUserId];
    } else {
      return;
    }
  }

  if (targetUserIds.length === 0) return;

  const existing = await prisma.taskAssignment.findMany({
    where: { taskId: task.id },
  });
  const target = new Set(targetUserIds);
  const existingByUser = new Set(existing.map((e) => e.userId));
  const toRemove = existing.filter((e) => !target.has(e.userId)).map((e) => e.id);
  const toAdd = targetUserIds.filter((uid) => !existingByUser.has(uid));

  if (toRemove.length) {
    await prisma.taskAssignment.deleteMany({ where: { id: { in: toRemove } } });
  }
  if (toAdd.length) {
    await prisma.taskAssignment.createMany({
      data: toAdd.map((userId) => ({ taskId: task.id, userId })),
      skipDuplicates: true,
    });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    title,
    description,
    weekNumber,
    dueDate,
    assignedTo,
    track,
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
    assignedUserIds?: string[];
    requiresSubmission?: boolean;
    submissionKind?: string;
  };

  const sub = parseTaskSubmissionSettings({ requiresSubmission, submissionKind });
  if (!sub.ok) {
    return NextResponse.json({ error: sub.error }, { status: 400 });
  }

  if (!title?.trim() || weekNumber == null || !assignedTo) {
    return NextResponse.json({ error: "Title, week, and assign-to are required" }, { status: 400 });
  }

  const mode = assignedTo as AssignedTo;
  if (mode === AssignedTo.TRACK && !track?.trim()) {
    return NextResponse.json({ error: "Track is required" }, { status: 400 });
  }

  const ids = Array.isArray(assignedUserIds) ? assignedUserIds : [];
  if (mode === AssignedTo.INDIVIDUAL && ids.length === 0) {
    return NextResponse.json(
      { error: "Select at least one intern" },
      { status: 400 }
    );
  }

  const assignedUserIdForRow =
    mode === AssignedTo.INDIVIDUAL && ids.length === 1 ? ids[0] : null;

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      weekNumber: Number(weekNumber),
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: mode,
      track: mode === AssignedTo.TRACK ? track!.trim() : null,
      assignedUserId: mode === AssignedTo.INDIVIDUAL ? assignedUserIdForRow : null,
      requiresSubmission: sub.requiresSubmission,
      submissionKind: sub.submissionKind,
    },
  });

  await syncAssignmentsAfterUpdate(
    updated,
    mode === AssignedTo.INDIVIDUAL ? ids : undefined
  );

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Cascades: TaskAssignment → TaskSubmission (see schema onDelete: Cascade)
  await prisma.task.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
