"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CreateInternDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    email: string;
    tempPassword: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/interns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, tempPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreated({
        email: data.email,
        tempPassword: data.tempPassword,
        emailSent: Boolean(data.emailSent),
        emailError: typeof data.emailError === "string" ? data.emailError : undefined,
      });
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create intern");
    }
    setLoading(false);
  }

  function handleClose() {
    setOpen(false);
    setCreated(null);
    setName(""); setEmail(""); setTempPassword(""); setError("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Intern</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Intern created successfully!</p>
              <p className="text-xs text-green-700">Share these credentials with the intern:</p>
              <div className="mt-3 space-y-1.5">
                <p className="text-sm"><span className="font-medium">Email:</span> {created.email}</p>
                <p className="text-sm"><span className="font-medium">Password:</span> <code className="bg-green-100 px-1 rounded">{created.tempPassword}</code></p>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="intern-name">Full name</Label>
              <Input id="intern-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intern-email">Email address</Label>
              <Input id="intern-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="temp-password">Password</Label>
              <Input
                id="temp-password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                minLength={8}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create intern"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/interns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, track, tempPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreated({
        email: data.email,
        tempPassword: data.tempPassword,
        emailSent: Boolean(data.emailSent),
        emailError: typeof data.emailError === "string" ? data.emailError : undefined,
      });
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create intern");
    }
    setLoading(false);
  }

  function handleClose() {
    setOpen(false);
    setCreated(null);
    setName(""); setEmail(""); setTrack(""); setTempPassword(""); setError("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Intern</DialogTitle>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Intern created successfully!</p>
              <p className="text-xs text-green-700">Share these credentials with the intern:</p>
              <div className="mt-3 space-y-1.5">
                <p className="text-sm"><span className="font-medium">Email:</span> {created.email}</p>
                <p className="text-sm"><span className="font-medium">Temp password:</span> <code className="bg-green-100 px-1 rounded">{created.tempPassword}</code></p>
              </div>
              <p className="text-xs text-green-600 mt-2">They will be prompted to change their password on first login.</p>
            </div>
            {!created.emailSent && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Welcome email was not sent.</p>
                {created.emailError && (
                  <p className="mt-2 text-xs font-mono text-amber-950/90 break-words whitespace-pre-wrap">
                    {created.emailError}
                  </p>
                )}
                <p className="text-xs mt-2 text-amber-800/90">
                  On Vercel the app sends only via SendGrid (HTTPS). Set{" "}
                  <code className="text-[11px]">SENDGRID_API_KEY</code> and{" "}
                  <code className="text-[11px]">SENDGRID_FROM_EMAIL</code> on <strong>Production</strong>, redeploy, and
                  match your verified Single Sender. SMTP is for local dev only. Check SendGrid Activity and Vercel logs.
                </p>
              </div>
            )}
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="intern-name">Full name</Label>
              <Input id="intern-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intern-email">Email address</Label>
              <Input id="intern-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Track</Label>
              <Select value={track} onValueChange={setTrack}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  {TRACKS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="temp-password">Temporary password</Label>
              <Input
                id="temp-password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                minLength={8}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create intern"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
