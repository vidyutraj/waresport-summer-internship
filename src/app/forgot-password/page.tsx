"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
    }
    setLoading(false);
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
          {submitted ? (
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-[#212529] mb-2">Check your email</h1>
              <p className="text-[#6C757D] text-sm mb-6 leading-relaxed">
                If <span className="text-[#212529] font-medium">{email}</span> is registered, you will receive a
                password reset link shortly. The link expires in 1 hour.
              </p>
              <p className="text-xs text-[#6C757D] mb-6">Don&apos;t see it? Check your spam folder.</p>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-xl border-gray-200">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 mb-5 mx-auto">
                <Mail className="h-6 w-6 text-brand-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#212529] text-center mb-2">Forgot password?</h1>
              <p className="text-[#6C757D] text-center text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#212529]">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@waresport.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl border-gray-200"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl shadow-sm">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="text-sm text-brand-600 hover:text-brand-700 transition-colors flex items-center justify-center gap-1.5 font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
