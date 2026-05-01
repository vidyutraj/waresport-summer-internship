import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email: normalized } });

  // Create a new token (expires in 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { email: normalized, token, expiresAt },
  });

  try {
    await sendPasswordResetEmail({ name: user.name, email: normalized, token });
  } catch (err) {
    console.error("Password reset email failed:", err);
  }

  return NextResponse.json({ success: true });
}
