import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: params.id },
    include: { task: { select: { title: true } } },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed =
    assignment.userId === session.user.id || session.user.role === "ADMIN";
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submissions = await prisma.taskSubmission.findMany({
    where: { assignmentId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Admins cannot post submissions here" }, { status: 403 });
  }

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: params.id },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { body, linkUrl } = await req.json();
  const text = typeof body === "string" ? body.trim() : "";
  const link = typeof linkUrl === "string" ? linkUrl.trim() : "";

  if (!text && !link) {
    return NextResponse.json(
      { error: "Add a description or a link (or both)" },
      { status: 400 }
    );
  }

  const submission = await prisma.taskSubmission.create({
    data: {
      assignmentId: params.id,
      userId: session.user.id,
      body: text || null,
      linkUrl: link || null,
    },
  });

  return NextResponse.json(submission);
}
