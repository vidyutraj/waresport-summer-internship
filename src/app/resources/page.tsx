import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { BookOpen } from "lucide-react";
import { ResourcesGrid } from "@/components/shared/ResourcesGrid";

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
              <ResourcesGrid resources={resources.filter((r) => r.category === category)} />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
