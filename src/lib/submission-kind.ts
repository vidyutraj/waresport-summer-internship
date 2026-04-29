import { SubmissionKind } from "@prisma/client";

export const SUBMISSION_KIND_OPTIONS: { value: SubmissionKind; label: string; description: string }[] = [
  { value: "TEXT", label: "Text response", description: "Intern writes notes or answers in a text box." },
  {
    value: "LINK",
    label: "Link / file",
    description: "Intern must provide a URL (e.g. Google Drive, Figma, Loom).",
  },
  {
    value: "CONFIRMATION",
    label: "Confirmation only",
    description: "Intern confirms they completed the task (one-click).",
  },
];

export function parseTaskSubmissionSettings(body: {
  requiresSubmission?: unknown;
  submissionKind?: unknown;
}):
  | { ok: true; requiresSubmission: boolean; submissionKind: SubmissionKind }
  | { ok: false; error: string } {
  const requiresSubmission = Boolean(body.requiresSubmission);
  if (!requiresSubmission) {
    return { ok: true, requiresSubmission: false, submissionKind: SubmissionKind.NONE };
  }
  const raw = String(body.submissionKind ?? "").toUpperCase();
  if (raw === "TEXT") return { ok: true, requiresSubmission: true, submissionKind: SubmissionKind.TEXT };
  if (raw === "LINK") return { ok: true, requiresSubmission: true, submissionKind: SubmissionKind.LINK };
  if (raw === "CONFIRMATION")
    return { ok: true, requiresSubmission: true, submissionKind: SubmissionKind.CONFIRMATION };
  return { ok: false, error: "Invalid submission type (use TEXT, LINK, or CONFIRMATION)" };
}

export function canMarkTaskComplete(
  task: { requiresSubmission?: boolean | null; submissionKind?: SubmissionKind | null },
  submissionCount: number
): boolean {
  if (!task.requiresSubmission) return true;
  const kind = task.submissionKind ?? SubmissionKind.NONE;
  if (kind === SubmissionKind.NONE) return true;
  return submissionCount > 0;
}

export const SUBMIT_BEFORE_COMPLETE_HINT =
  "Submit your work on the task page before marking complete.";

export function submissionKindShortLabel(
  kind: SubmissionKind | string | null | undefined
): string {
  switch (kind) {
    case "TEXT":
      return "Text";
    case "LINK":
      return "Link / file";
    case "CONFIRMATION":
      return "Confirm";
    case "NONE":
      return "—";
    default:
      return "—";
  }
}
