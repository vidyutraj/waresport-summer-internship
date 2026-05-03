"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, Loader2, Pencil } from "lucide-react";
import { EditTaskDialog } from "@/components/shared/edit-task-dialog";
import { DeleteTaskButton } from "@/components/shared/delete-task-button";
import { WeekSection } from "@/components/shared/week-section";
import { formatDate, getInitials } from "@/lib/utils";
import { submissionKindShortLabel } from "@/lib/submission-kind";
import type { SubmissionKind } from "@prisma/client";

type Assignment = { id: string; userId: string; completedAt: string | null };
export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  weekNumber: number;
  dueDate: string | null;
  assignedTo: string;
  track: string | null;
  requiresSubmission: boolean;
  submissionKind: string;
  assignments: Assignment[];
  creator: { name: string };
  assignedUser: { name: string } | null;
};

type InternOpt = { id: string; name: string; email: string; track: string | null };

export function AdminTasksBulkClient({
  weeks,
  groupedByWeek,
}: {
  weeks: number[];
  groupedByWeek: Record<number, TaskRow[]>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interns, setInterns] = useState<InternOpt[]>([]);
  const [selectedInterns, setSelectedInterns] = useState<Set<string>>(new Set());
  const [loadingInterns, setLoadingInterns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggleTask(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openAssign() {
    if (selectedIds.length === 0) return;
    setError("");
    setDialogOpen(true);
    if (interns.length === 0) {
      setLoadingInterns(true);
      try {
        const r = await fetch("/api/admin/interns");
        const data = await r.json();
        setInterns(Array.isArray(data) ? data : []);
      } finally {
        setLoadingInterns(false);
      }
    }
  }

  function toggleIntern(id: string) {
    setSelectedInterns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulkAssign() {
    setSubmitting(true);
    setError("");
    const body = { taskIds: selectedIds, mode: "INTERNS" as const, userIds: Array.from(selectedInterns) };

    if (selectedInterns.size === 0) {
      setError("Select at least one intern");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/admin/tasks/bulk-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setDialogOpen(false);
      setSelected(new Set());
      setSelectedInterns(new Set());
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Bulk assign failed");
    }
    setSubmitting(false);
  }

  if (weeks.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No tasks created yet. Create your first task above.</p>
      </div>
    );
  }

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm font-medium text-brand-900">
            {selectedIds.length} task{selectedIds.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={openAssign}>
              Bulk assign…
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {weeks.map((week) => {
          const list = groupedByWeek[week];
          const completed = list.reduce((sum, t) => sum + t.assignments.filter(a => a.completedAt).length, 0);
          const total = list.reduce((sum, t) => sum + t.assignments.length, 0);
          return (
            <WeekSection
              key={week}
              week={week}
              completed={completed}
              total={total}
              isCurrentWeek={false}
              defaultOpen={week === Math.max(...weeks)}
            >
              {list.map((task) => {
                    const taskCompleted = task.assignments.filter((a) => a.completedAt).length;
                    const taskTotal = task.assignments.length;
                    const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                    const isOn = selected.has(task.id);

                    return (
                      <li
                        key={task.id}
                        className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                          isOn ? "border-brand-300 bg-brand-50/40" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isOn}
                            onCheckedChange={() => toggleTask(task.id)}
                            aria-label={`Select ${task.title}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                            {overdue && <Badge variant="destructive">Overdue</Badge>}
                            {task.assignedTo === "ALL" && <Badge variant="outline">All interns</Badge>}
                            {task.assignedTo === "INDIVIDUAL" && (
                              <Badge variant="default">
                                {task.assignments.length > 1
                                  ? `${task.assignments.length} interns`
                                  : task.assignedUser?.name ?? "Individual"}
                              </Badge>
                            )}
                            {task.requiresSubmission && task.submissionKind !== "NONE" && (
                              <Badge variant="outline" className="text-xs">
                                Submit: {submissionKindShortLabel(task.submissionKind as SubmissionKind)}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {task.dueDate && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due {formatDate(task.dueDate)}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">by {task.creator.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <EditTaskDialog task={task}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-brand-600"
                              title="Edit task"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </EditTaskDialog>
                          <DeleteTaskButton
                            taskId={task.id}
                            title={task.title}
                            onDeleted={(id) =>
                              setSelected((prev) => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                              })
                            }
                          />
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">
                            {taskCompleted}/{taskTotal}
                          </span>
                        </div>
                      </li>
                    );
                  })}
            </WeekSection>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk assign {selectedIds.length} task(s)</DialogTitle>
            <DialogDescription>
              Creates assignments for interns who don&apos;t already have one for each selected task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Interns</Label>
              {loadingInterns ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y">
                  {interns.map((i) => (
                    <label
                      key={i.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedInterns.has(i.id)}
                        onCheckedChange={() => toggleIntern(i.id)}
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                        {getInitials(i.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{i.name}</p>
                        <p className="text-xs text-gray-500 truncate">{i.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={runBulkAssign} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
