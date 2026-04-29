"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export function DeleteTaskButton({
  taskId,
  title,
  onDeleted,
}: {
  taskId: string;
  title: string;
  onDeleted?: (taskId: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/tasks/${taskId}`, { method: "DELETE" });

    if (res.ok) {
      setOpen(false);
      onDeleted?.(taskId);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to delete task");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
        onClick={() => setOpen(true)}
        title="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              <strong className="text-gray-900">{title}</strong> will be removed for all assigned
              interns, along with their progress and submissions for this task. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
