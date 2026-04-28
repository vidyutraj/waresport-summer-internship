"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["Onboarding", "Product Overview", "Market Research", "How-To Guides", "Engineering", "Design", "Other"];

export function CreateResourceDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, url, category, isRequired }),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
      setTitle(""); setDescription(""); setUrl(""); setCategory(""); setIsRequired(false);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create resource");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="res-title">Title</Label>
            <Input id="res-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Brand Style Guide" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-desc">Description (optional)</Label>
            <Textarea id="res-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-url">URL</Label>
            <Input id="res-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600"
            />
            <span className="text-sm text-gray-700">Mark as required reading</span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !category}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
