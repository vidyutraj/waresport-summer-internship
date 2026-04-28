import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, linkedin, phone } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio, linkedin, phone },
  });

  return NextResponse.json({ success: true, user });
}
