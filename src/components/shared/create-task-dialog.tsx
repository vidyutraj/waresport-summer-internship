"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, X } from "lucide-react";
import { TRACKS, getInitials } from "@/lib/utils";

interface Intern {
  id: string;
  name: string;
  email: string;
  track: string | null;
  avatarUrl: string | null;
}

export function CreateTaskDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weekNumber, setWeekNumber] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("ALL");
  const [track, setTrack] = useState("");
  const [selectedInternIds, setSelectedInternIds] = useState<Set<string>>(new Set());
  const [internSearch, setInternSearch] = useState("");
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loadingInterns, setLoadingInterns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch interns when dialog opens or when switching to INDIVIDUAL
  useEffect(() => {
    if (!open || interns.length > 0) return;
    setLoadingInterns(true);
    fetch("/api/admin/interns")
      .then((r) => r.json())
      .then((data) => setInterns(data))
      .catch(() => {})
      .finally(() => setLoadingInterns(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setTitle(""); setDescription(""); setWeekNumber("1"); setDueDate("");
    setAssignedTo("ALL"); setTrack(""); setSelectedInternIds(new Set()); setInternSearch(""); setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (assignedTo === "INDIVIDUAL" && selectedInternIds.size === 0) {
      setError("Select at least one intern");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description,
        weekNumber: parseInt(weekNumber),
        dueDate: dueDate || null,
        assignedTo,
        track: assignedTo === "TRACK" ? track : null,
        assignedUserIds:
          assignedTo === "INDIVIDUAL" ? Array.from(selectedInternIds) : undefined,
      }),
    });

    if (res.ok) {
      setOpen(false);
      reset();
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create task");
    }
    setLoading(false);
  }

  function toggleInternId(id: string) {
    setSelectedInternIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const filteredInterns = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(internSearch.toLowerCase()) ||
      i.email.toLowerCase().includes(internSearch.toLowerCase()) ||
      (i.track ?? "").toLowerCase().includes(internSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Task title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Complete onboarding checklist" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description (optional)</Label>
            <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Additional context or instructions..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Week number</Label>
              <Select value={weekNumber} onValueChange={setWeekNumber}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due-date">Due date (optional)</Label>
              <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Assignment type */}
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select value={assignedTo} onValueChange={(v) => { setAssignedTo(v); setSelectedInternIds(new Set()); setTrack(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All interns</SelectItem>
                <SelectItem value="TRACK">Specific track</SelectItem>
                <SelectItem value="INDIVIDUAL">Specific intern(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Track selector */}
          {assignedTo === "TRACK" && (
            <div className="space-y-1.5">
              <Label>Track</Label>
              <Select value={track} onValueChange={setTrack}>
                <SelectTrigger><SelectValue placeholder="Select track" /></SelectTrigger>
                <SelectContent>
                  {TRACKS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Individual intern(s) multi-select */}
          {assignedTo === "INDIVIDUAL" && (
            <div className="space-y-2">
              <Label>Select intern(s)</Label>
              {selectedInternIds.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {interns
                    .filter((i) => selectedInternIds.has(i.id))
                    .map((intern) => (
                      <span
                        key={intern.id}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-800 pl-2.5 pr-1 py-0.5 text-xs font-medium"
                      >
                        {intern.name}
                        <button
                          type="button"
                          onClick={() => toggleInternId(intern.id)}
                          className="rounded-full p-0.5 hover:bg-brand-200"
                          aria-label={`Remove ${intern.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or track..."
                    value={internSearch}
                    onChange={(e) => setInternSearch(e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {loadingInterns ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : filteredInterns.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">
                      {interns.length === 0 ? "No interns added yet" : "No interns match your search"}
                    </p>
                  ) : (
                    filteredInterns.map((intern) => (
                      <label
                        key={intern.id}
                        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <Checkbox
                          checked={selectedInternIds.has(intern.id)}
                          onCheckedChange={() => toggleInternId(intern.id)}
                        />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
                          {getInitials(intern.name)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-gray-900">{intern.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {intern.email}
                            {intern.track ? ` · ${intern.track}` : ""}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button
              type="submit"
              disabled={
                loading ||
                (assignedTo === "TRACK" && !track) ||
                (assignedTo === "INDIVIDUAL" && selectedInternIds.size === 0)
              }
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
