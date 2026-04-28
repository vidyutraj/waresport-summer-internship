import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: { title, body, createdBy: session.user.id },
  });

  return NextResponse.json(announcement);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await prisma.announcement.findMany({
    include: { creator: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(announcements);
}
