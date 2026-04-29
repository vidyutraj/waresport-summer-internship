import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateResourceDialog } from "@/components/shared/create-resource-dialog";
import { EditResourceDialog } from "@/components/shared/edit-resource-dialog";
import { DeleteResourceButton } from "@/components/shared/delete-resource-button";

export default async function AdminResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const resources = await prisma.resource.findMany({
    include: { uploader: { select: { name: true } } },
    orderBy: [{ isRequired: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-gray-500 mt-1">Manage the knowledge base</p>
        </div>
        <CreateResourceDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add resource
          </Button>
        </CreateResourceDialog>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No resources yet. Add your first resource above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{resource.title}</h3>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {resource.isRequired && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                    <EditResourceDialog resource={resource} />
                    <DeleteResourceButton resourceId={resource.id} title={resource.title} />
                  </div>
                </div>
                {resource.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{resource.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge variant="outline">{resource.category}</Badge>
                  {resource.isRequired && <Badge variant="warning">Required</Badge>}
                </div>
                <div className="flex items-center justify-between">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
