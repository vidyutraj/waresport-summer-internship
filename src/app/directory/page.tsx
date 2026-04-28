import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link2, Mail } from "lucide-react";

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

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team directory</h1>
        <p className="text-gray-500 mt-1">
          Everyone on the internship — say hi, especially if you&apos;re remote.
        </p>
      </div>

      {interns.length === 0 ? (
        <p className="text-center py-16 text-gray-400">No interns yet. Check back after the first join.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interns.map((person) => (
            <Card key={person.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {person.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={person.avatarUrl}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800 text-sm font-bold shrink-0">
                      {getInitials(person.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{person.name}</p>
                    {person.track && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {person.track}
                      </Badge>
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
          ))}
        </div>
      )}
    </AppLayout>
  );
}
