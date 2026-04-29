"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ExternalLink, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SubmissionKind } from "@prisma/client";
import { submissionKindShortLabel } from "@/lib/submission-kind";

export type SubmissionRow = {
  id: string;
  kind: SubmissionKind;
  body: string | null;
  linkUrl: string | null;
  createdAt: string;
};

export function TaskSubmissionForm({
  assignmentId,
  initialSubmissions,
  requiresSubmission,
  submissionKind,
}: {
  assignmentId: string;
  initialSubmissions: SubmissionRow[];
  requiresSubmission: boolean;
  submissionKind: SubmissionKind;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState(initialSubmissions);

  if (!requiresSubmission || submissionKind === "NONE") {
    return null;
  }

  async function postSubmission(json: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/tasks/assignments/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
    if (res.ok) {
      const row = await res.json();
      setItems((prev) => [
        {
          id: row.id,
          kind: row.kind,
          body: row.body,
          linkUrl: row.linkUrl,
          createdAt: row.createdAt,
        },
        ...prev,
      ]);
      setBody("");
      setLinkUrl("");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Could not submit");
    }
    setLoading(false);
  }

  async function handleTextLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    await postSubmission({ body, linkUrl });
  }

  async function handleConfirm() {
    await postSubmission({ confirm: true });
  }

  const modeLabel =
    submissionKind === "TEXT"
      ? "text response"
      : submissionKind === "LINK"
        ? "link or file"
        : "confirmation";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Submit your work</h2>
        <p className="text-xs text-gray-500 mb-4">
          This task requires a <strong>{modeLabel}</strong> before you can mark it complete.
          {submissionKind === "LINK" &&
            " Upload files to Drive, Dropbox, etc., and paste the share link."}
        </p>

        {submissionKind === "CONFIRMATION" && (
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
            <p className="text-sm text-gray-700">
              When you have finished this task, confirm below. Your admin will see the confirmation
              with a timestamp.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="button" onClick={handleConfirm} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              I confirm this task is complete
            </Button>
          </div>
        )}

        {submissionKind === "TEXT" && (
          <form
            onSubmit={handleTextLinkSubmit}
            className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="sub-body">Your response (required)</Label>
              <Textarea
                id="sub-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Describe what you delivered…"
                className="bg-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-link">Link (optional)</Label>
              <Input
                id="sub-link"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="bg-white"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} size="sm" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit
            </Button>
          </form>
        )}

        {submissionKind === "LINK" && (
          <form
            onSubmit={handleTextLinkSubmit}
            className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="sub-link-req">Link to your file or doc (required)</Label>
              <Input
                id="sub-link-req"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="bg-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-body-opt">Notes (optional)</Label>
              <Textarea
                id="sub-body-opt"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={2}
                placeholder="Any extra context…"
                className="bg-white"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} size="sm" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit
            </Button>
          </form>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Submission history</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No submissions yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-gray-100 bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs text-gray-400">{formatDate(s.createdAt)}</p>
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">
                    {submissionKindShortLabel(s.kind)}
                  </span>
                </div>
                {s.kind === "CONFIRMATION" && !s.body && !s.linkUrl && (
                  <p className="text-gray-700 font-medium">Confirmed completion</p>
                )}
                {s.body && <p className="text-gray-800 whitespace-pre-wrap">{s.body}</p>}
                {s.linkUrl && (
                  <a
                    href={s.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 text-xs font-medium mt-2 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {s.linkUrl}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
