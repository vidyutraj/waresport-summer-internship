"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface WeeklyLogFormProps {
  weekNumber: number;
}

export function WeeklyLogForm({ weekNumber }: WeeklyLogFormProps) {
  const router = useRouter();
  const [workedOn, setWorkedOn] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextWeekGoals, setNextWeekGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekNumber, workedOn, blockers, nextWeekGoals }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="workedOn">What did you work on this week?</Label>
        <Textarea
          id="workedOn"
          placeholder="Share your key work and contributions..."
          value={workedOn}
          onChange={(e) => setWorkedOn(e.target.value)}
          rows={4}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="blockers">Any blockers? (optional)</Label>
        <Textarea
          id="blockers"
          placeholder="Challenges or blockers you encountered..."
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nextWeekGoals">Goals for next week</Label>
        <Textarea
          id="nextWeekGoals"
          placeholder="What you plan to accomplish next week..."
          value={nextWeekGoals}
          onChange={(e) => setNextWeekGoals(e.target.value)}
          rows={3}
          required
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit weekly log"
        )}
      </Button>
    </form>
  );
}
