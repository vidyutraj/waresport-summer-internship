"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type SubmissionRow = {
  id: string;
  body: string | null;
  linkUrl: string | null;
  createdAt: string;
};

export function TaskSubmissionForm({
  assignmentId,
  initialSubmissions,
}: {
  assignmentId: string;
  initialSubmissions: SubmissionRow[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState(initialSubmissions);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/tasks/assignments/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, linkUrl }),
    });

    if (res.ok) {
      const row = await res.json();
      setItems((prev) => [
        {
          id: row.id,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Submit your work</h2>
        <p className="text-xs text-gray-500 mb-4">
          Add notes, a link to a doc, PR, deck, or Loom — your admin can review everything here.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-body">What did you deliver? (optional if you only share a link)</Label>
            <Textarea
              id="sub-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="e.g. Completed the market analysis doc, key findings in section 3…"
              className="bg-white"
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
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button type="submit" disabled={loading} size="sm" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit work
          </Button>
        </form>
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
                <p className="text-xs text-gray-400 mb-1">{formatDate(s.createdAt)}</p>
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
