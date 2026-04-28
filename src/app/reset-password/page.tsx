"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-[#212529] mb-2">Password reset!</h1>
        <p className="text-[#6C757D] text-sm mb-1">Your password has been updated successfully.</p>
        <p className="text-[#6C757D] text-xs">Redirecting you to sign in...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <XCircle className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-[#212529] mb-2">Invalid link</h1>
        <p className="text-[#6C757D] text-sm mb-5">
          This reset link is invalid or has already been used.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full rounded-xl shadow-sm">Request a new link</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-5 mx-auto">
        <Lock className="h-6 w-6 text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-[#212529] text-center mb-2">Set new password</h1>
      <p className="text-[#6C757D] text-center text-sm mb-6">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#212529]">
            New password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl border-gray-200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-[#212529]">
            Confirm password
          </Label>
          <Input
            id="confirm"
            type="password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="rounded-xl border-gray-200"
          />
        </div>

        {password.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    passwordStrength(password) >= level
                      ? level <= 1
                        ? "bg-red-500"
                        : level <= 2
                          ? "bg-orange-500"
                          : level <= 3
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#6C757D]">
              {["", "Weak", "Fair", "Good", "Strong"][passwordStrength(password)]}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full h-11 mt-1 rounded-xl shadow-sm">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </>
  );
}

function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-page p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#212529]">Waresport</span>
        </div>
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <Suspense fallback={<div className="text-center text-[#6C757D]">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
