import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { completed } = await req.json();

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: params.id },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.taskAssignment.update({
    where: { id: params.id },
    data: { completedAt: completed ? new Date() : null },
  });

  return NextResponse.json(updated);
}
