import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateResourceDialog } from "@/components/shared/create-resource-dialog";
import { EditResourceDialog } from "@/components/shared/edit-resource-dialog";
import { DeleteResourceButton } from "@/components/shared/delete-resource-button";
import { ResourcesGrid } from "@/components/shared/ResourcesGrid";

export default async function AdminResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const resources = await prisma.resource.findMany({
    include: { uploader: { select: { name: true } } },
    orderBy: [{ isRequired: "desc" }, { createdAt: "desc" }],
  });

  const adminControls: Record<string, { edit: React.ReactNode; delete: React.ReactNode }> = {};
  for (const resource of resources) {
    adminControls[resource.id] = {
      edit: <EditResourceDialog resource={resource} />,
      delete: <DeleteResourceButton resourceId={resource.id} title={resource.title} />,
    };
  }

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
        <ResourcesGrid resources={resources} isAdmin adminControls={adminControls} />
      )}
    </AppLayout>
  );
}
