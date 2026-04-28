import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, url, category, isRequired } = await req.json();

  if (!title || !url || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: {
      title,
      description,
      url,
      category,
      isRequired: isRequired ?? false,
      uploadedBy: session.user.id,
    },
  });

  return NextResponse.json(resource);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resources = await prisma.resource.findMany({
    orderBy: [{ isRequired: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(resources);
}
