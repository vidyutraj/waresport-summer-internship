"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Zap, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      await update({ mustChangePassword: false });
      const dest = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
      window.location.href = dest;
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-6 mx-auto">
            <Lock className="h-6 w-6 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#212529] text-center mb-2">Set your password</h1>
          <p className="text-[#6C757D] text-center text-sm mb-6">
            This is your first login. Please create a secure password to continue.
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

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 mt-2 rounded-xl shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Set password & continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
