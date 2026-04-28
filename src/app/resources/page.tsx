import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resources = await prisma.resource.findMany({
    orderBy: [{ isRequired: "desc" }, { createdAt: "desc" }],
    include: { uploader: { select: { name: true } } },
  });

  const categories = Array.from(new Set(resources.map((r) => r.category)));

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <p className="text-gray-500 mt-1">Knowledge base and reference materials</p>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No resources yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources
                  .filter((r) => r.category === category)
                  .map((resource) => (
                    <Card key={resource.id} className="hover:border-brand-200 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {resource.title}
                          </h3>
                          {resource.isRequired && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{resource.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs text-gray-400">{formatDate(resource.createdAt)}</span>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {resource.isRequired && (
                          <Badge variant="warning" className="mt-3 w-full justify-center">Required reading</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
