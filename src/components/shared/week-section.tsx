"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeekSectionProps {
  week: number;
  completed: number;
  total: number;
  isCurrentWeek: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function WeekSection({
  week,
  completed,
  total,
  isCurrentWeek,
  defaultOpen = false,
  children,
}: WeekSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const allDone = completed === total && total > 0;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-900">Week {week}</span>
          {isCurrentWeek && <Badge variant="default">Current</Badge>}
          {allDone && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Complete</Badge>}
        </div>
        <span className="text-sm text-gray-500 shrink-0">
          {completed}/{total} completed
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-white">
          <ul className="space-y-2">
            {children}
          </ul>
        </div>
      )}
    </div>
  );
}
