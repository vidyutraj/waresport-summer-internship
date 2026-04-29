import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, track, tempPassword } = await req.json();

  if (!name || !email || !tempPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: "INTERN",
      track: track || null,
      mustChangePassword: true,
    },
  });

  // Send welcome email (non-blocking — don't fail the request if email fails)
  sendWelcomeEmail({ name, email: normalizedEmail, tempPassword }).catch((err) => {
    console.error("Failed to send welcome email:", JSON.stringify(err, null, 2));
  });

  return NextResponse.json({ success: true, email: user.email, tempPassword });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const interns = await prisma.user.findMany({
    where: { role: "INTERN" },
    select: {
      id: true, name: true, email: true, track: true, createdAt: true, avatarUrl: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(interns);
}
