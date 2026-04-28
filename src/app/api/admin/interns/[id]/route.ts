import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent admins from deleting themselves
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role !== "INTERN") {
    return NextResponse.json({ error: "Can only delete intern accounts" }, { status: 400 });
  }

  // Cascades handle taskAssignments and weeklyLogs automatically (defined in schema)
  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
