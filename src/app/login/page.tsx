"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user.mustChangePassword) {
        router.push("/change-password");
      } else if (session.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      if (!result?.ok) {
        setError("Could not sign in. Try again.");
        return;
      }

      // Full page navigation: getSession() after signIn often returns null in App Router before
      // the browser applies Set-Cookie, so client-side router.push never ran.
      window.location.assign("/post-login");
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — brand gradient */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-brand-800 via-brand-600 to-brand-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.06%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Waresport</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your internship,<br />organized.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Track tasks, submit weekly logs, access resources, and stay connected with your team — all in one place.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: "Active Interns", value: "12+" },
            { label: "Tasks Tracked", value: "100+" },
            { label: "Completion Rate", value: "94%" },
            { label: "Weeks Covered", value: "12" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — light surface */}
      <div className="flex flex-1 items-center justify-center p-8 bg-surface-page">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#212529]">Waresport</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#212529] mb-2">Welcome back</h2>
            <p className="text-[#6C757D]">Sign in to your intern portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="rounded-xl border-gray-200 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#212529]">
                  Password
                </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-gray-200 shadow-sm"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 text-base rounded-xl shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6C757D]">
            Need access? Contact your Waresport admin.
          </p>
        </div>
      </div>
    </div>
  );
}
