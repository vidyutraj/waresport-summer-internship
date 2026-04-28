import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Must match the 1–12 week options when creating tasks. */
export const INTERNSHIP_PROGRAM_TOTAL_WEEKS = 12;

function parseProgramStartDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/**
 * Current internship program week (1–12), aligned with task `weekNumber` in the admin UI.
 * Set `INTERNSHIP_PROGRAM_START_DATE` in `.env` to the first calendar day of week 1 (YYYY-MM-DD).
 * If unset, defaults to `1` so week-1 tasks show in dev.
 */
export function getCurrentProgramWeek(): number {
  const raw = process.env.INTERNSHIP_PROGRAM_START_DATE?.trim();
  if (!raw) return 1;
  const start = parseProgramStartDate(raw);
  if (!start) return 1;
  const diff = Date.now() - start.getTime();
  if (diff < 0) return 1;
  const week = Math.floor(diff / MS_PER_WEEK) + 1;
  return Math.min(INTERNSHIP_PROGRAM_TOTAL_WEEKS, Math.max(1, week));
}

export const TRACKS = [
  "Engineering",
  "Marketing",
  "Business Dev",
  "Design",
  "Operations",
] as const;

const trackColorMap: Record<string, string> = {
  Engineering: "bg-blue-100 text-blue-800",
  Marketing: "bg-pink-100 text-pink-800",
  "Business Dev": "bg-purple-100 text-purple-800",
  Design: "bg-orange-100 text-orange-800",
  Operations: "bg-green-100 text-green-800",
  All: "bg-gray-100 text-gray-800",
};

export function getTrackColor(track: string) {
  return trackColorMap[track] ?? "bg-gray-100 text-gray-800";
}
