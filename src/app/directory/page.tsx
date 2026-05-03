import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { Link2, Mail } from "lucide-react";

const TRACK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Blogs":        { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "Newsletters":  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Social Media": { bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-200" },
  "Podcast":      { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
};

const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

export default async function DirectoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const interns = await prisma.user.findMany({
    where: { role: "INTERN" },
    select: {
      id: true,
      name: true,
      email: true,
      track: true,
      linkedin: true,
      bio: true,
      avatarUrl: true,
    },
    orderBy: { name: "asc" },
  });

  // Build group map — interns can belong to multiple groups (comma-separated track)
  const groupMap: Record<string, typeof interns> = {};
  for (const intern of interns) {
    const groups = intern.track
      ? intern.track.split(",").map((t) => t.trim())
      : ["Unassigned"];
    for (const group of groups) {
      if (!groupMap[group]) groupMap[group] = [];
      groupMap[group].push(intern);
    }
  }

  const groupOrder = ["Blogs", "Newsletters", "Social Media", "Podcast", "Unassigned"];
  const sortedGroups = [
    ...groupOrder.filter((g) => groupMap[g]),
    ...Object.keys(groupMap).filter((g) => !groupOrder.includes(g)),
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team directory</h1>
        <p className="text-gray-500 mt-1">Everyone on the internship — say hi, especially if you&apos;re remote.</p>
      </div>

      {interns.length === 0 ? (
        <p className="text-center py-16 text-gray-400">No interns yet.</p>
      ) : (
        <div className="space-y-10">

          {/* ── Flowchart / grouped view ── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">By group</h2>
            <div className="flex flex-wrap gap-6 items-start">
              {sortedGroups.map((group) => {
                const color = TRACK_COLORS[group] ?? DEFAULT_COLOR;
                return (
                  <div key={group} className={`rounded-2xl border ${color.border} ${color.bg} p-4 min-w-[160px]`}>
                    <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${color.text}`}>{group}</p>
                    <div className="space-y-2">
                      {groupMap[group].map((person) => (
                        <div key={person.id} className="flex items-center gap-2">
                          {person.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={person.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className={`flex h-7 w-7 items-center justify-center rounded-full ${color.bg} border ${color.border} text-xs font-bold ${color.text} shrink-0`}>
                              {getInitials(person.name)}
                            </div>
                          )}
                          <span className="text-sm text-gray-800 font-medium">{person.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Individual cards ── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">All interns</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {interns.map((person) => {
                const groups = person.track
                  ? person.track.split(",").map((t) => t.trim())
                  : [];
                return (
                  <Card key={person.id} className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        {person.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800 text-sm font-bold shrink-0">
                            {getInitials(person.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{person.name}</p>
                          {groups.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {groups.map((g) => {
                                const c = TRACK_COLORS[g] ?? DEFAULT_COLOR;
                                return (
                                  <span key={g} className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
                                    {g}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <a
                            href={`mailto:${person.email}`}
                            className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{person.email}</span>
                          </a>
                          {person.linkedin && (
                            <a
                              href={person.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                            >
                              <Link2 className="h-3 w-3" />
                              LinkedIn
                            </a>
                          )}
                          {person.bio && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-3">{person.bio}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

        </div>
      )}
    </AppLayout>
  );
}
