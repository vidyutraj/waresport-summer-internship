import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = {
  taskIds: string[];
  mode: "TRACK" | "INTERNS";
  track?: string | null;
  userIds?: string[];
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskIds, mode, track, userIds } = (await req.json()) as Body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return NextResponse.json({ error: "Select at least one task" }, { status: 400 });
  }

  let internIds: { id: string }[] = [];

  if (mode === "TRACK") {
    if (!track) {
      return NextResponse.json({ error: "Track is required" }, { status: 400 });
    }
    internIds = await prisma.user.findMany({
      where: { role: "INTERN", track },
      select: { id: true },
    });
  } else if (mode === "INTERNS") {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Select at least one intern" }, { status: 400 });
    }
    const valid = await prisma.user.findMany({
      where: { id: { in: userIds }, role: "INTERN" },
      select: { id: true },
    });
    internIds = valid;
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  if (internIds.length === 0) {
    return NextResponse.json(
      { error: "No interns matched this assignment" },
      { status: 400 }
    );
  }

  const rows = taskIds.flatMap((taskId) =>
    internIds.map((u) => ({ taskId, userId: u.id }))
  );

  const result = await prisma.taskAssignment.createMany({
    data: rows,
    skipDuplicates: true,
  });

  return NextResponse.json({
    ok: true,
    created: result.count,
    skipped: rows.length - result.count,
  });
}
