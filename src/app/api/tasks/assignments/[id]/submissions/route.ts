import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionKind } from "@prisma/client";

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
    include: { task: true },
  });

  if (!assignment || assignment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = assignment.task;
  if (!task.requiresSubmission || task.submissionKind === SubmissionKind.NONE) {
    return NextResponse.json(
      { error: "This task does not require a submission" },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const text = typeof payload.body === "string" ? payload.body.trim() : "";
  const link = typeof payload.linkUrl === "string" ? payload.linkUrl.trim() : "";
  const confirmed = payload.confirm === true;

  let body: string | null = null;
  let linkUrl: string | null = null;
  const kind = task.submissionKind;

  if (task.submissionKind === SubmissionKind.TEXT) {
    if (!text) {
      return NextResponse.json({ error: "Please add a written response" }, { status: 400 });
    }
    body = text;
    linkUrl = link || null;
  } else if (task.submissionKind === SubmissionKind.LINK) {
    if (!link) {
      return NextResponse.json(
        { error: "Please add a link to your file or document" },
        { status: 400 }
      );
    }
    try {
      // eslint-disable-next-line no-new
      new URL(link);
    } catch {
      return NextResponse.json({ error: "Please enter a valid URL" }, { status: 400 });
    }
    linkUrl = link;
    body = text || null;
  } else if (task.submissionKind === SubmissionKind.CONFIRMATION) {
    if (!confirmed) {
      return NextResponse.json({ error: "Confirm to submit" }, { status: 400 });
    }
    body = null;
    linkUrl = null;
  } else {
    return NextResponse.json({ error: "Invalid task submission configuration" }, { status: 400 });
  }

  const submission = await prisma.taskSubmission.create({
    data: {
      assignmentId: params.id,
      userId: session.user.id,
      kind,
      body,
      linkUrl,
    },
  });

  return NextResponse.json(submission);
}
