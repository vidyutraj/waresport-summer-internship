import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "@/components/shared/create-task-dialog";
import { AdminTasksBulkClient } from "@/components/shared/admin-tasks-bulk";

export default async function AdminTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const tasks = await prisma.task.findMany({
    include: {
      assignments: true,
      creator: { select: { name: true } },
      assignedUser: { select: { name: true } },
    },
    orderBy: [{ weekNumber: "asc" }, { createdAt: "desc" }],
  });

  const groupedByWeek = tasks.reduce(
    (acc, t) => {
      const w = t.weekNumber;
      if (!acc[w]) acc[w] = [];
      acc[w].push(t);
      return acc;
    },
    {} as Record<number, typeof tasks>
  );

  const weeks = Object.keys(groupedByWeek)
    .map(Number)
    .sort((a, b) => b - a);

  const groupedPlain = JSON.parse(JSON.stringify(groupedByWeek)) as Record<
    number,
    import("@/components/shared/admin-tasks-bulk").TaskRow[]
  >;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">
            Manage assignments — select tasks to bulk-assign by track or specific interns
          </p>
        </div>
        <CreateTaskDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create task
          </Button>
        </CreateTaskDialog>
      </div>

      <AdminTasksBulkClient weeks={weeks} groupedByWeek={groupedPlain} />
    </AppLayout>
  );
}
