"use client";

import { useState, useTransition } from "react";
import { Check, Clock, ExternalLink } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SUBMIT_BEFORE_COMPLETE_HINT } from "@/lib/submission-kind";

interface TaskCheckboxProps {
  assignmentId: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  taskId: string;
  /** When false, user cannot mark complete until they submit (server also enforces). */
  canMarkComplete?: boolean;
}

export function TaskCheckbox({
  assignmentId,
  title,
  description,
  dueDate,
  completedAt,
  taskId,
  canMarkComplete = true,
}: TaskCheckboxProps) {
  const [completed, setCompleted] = useState(!!completedAt);
  const [isPending, startTransition] = useTransition();
  const [apiError, setApiError] = useState("");
  const router = useRouter();

  const isOverdue = dueDate && !completed && new Date(dueDate) < new Date();

  async function toggle() {
    const newValue = !completed;
    if (newValue && !canMarkComplete) {
      setApiError(SUBMIT_BEFORE_COMPLETE_HINT);
      return;
    }
    setApiError("");
    setCompleted(newValue);

    startTransition(async () => {
      const res = await fetch(`/api/tasks/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newValue }),
      });

      if (!res.ok) {
        setCompleted(!newValue);
        try {
          const data = await res.json();
          setApiError(typeof data.error === "string" ? data.error : "Could not update task");
        } catch {
          setApiError("Could not update task");
        }
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 border transition-colors",
        completed
          ? "bg-green-50 border-green-100"
          : isOverdue
            ? "bg-red-50 border-red-100"
            : "bg-white border-gray-100 hover:border-gray-200"
      )}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
          completed
            ? "bg-green-500 border-green-500 scale-110"
            : "border-gray-300 hover:border-brand-400",
          !canMarkComplete && !completed && "opacity-60 cursor-not-allowed hover:border-gray-300"
        )}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        title={!canMarkComplete && !completed ? SUBMIT_BEFORE_COMPLETE_HINT : undefined}
      >
        {completed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-medium", completed && "line-through text-gray-400")}>
            {title}
          </p>
          {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          {completed && <Badge variant="success">Done</Badge>}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{description}</p>
        )}
        {dueDate && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">Due {formatDate(dueDate)}</span>
          </div>
        )}
        {!canMarkComplete && !completed && (
          <p className="text-xs text-amber-700 mt-1.5">{SUBMIT_BEFORE_COMPLETE_HINT}</p>
        )}
        {apiError && <p className="text-xs text-red-600 mt-1.5">{apiError}</p>}
      </div>

      <Link
        href={`/tasks/${taskId}`}
        className="shrink-0 text-gray-400 hover:text-brand-600 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}
