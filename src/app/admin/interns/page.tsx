import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getInitials, formatDate, getCurrentProgramWeek } from "@/lib/utils";
import { CreateInternDialog } from "@/components/shared/create-intern-dialog";
import { DeleteInternButton } from "@/components/shared/delete-intern-button";
import { UserPlus } from "lucide-react";

export default async function AdminInternsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const interns = await prisma.user.findMany({
    where: { role: "INTERN" },
    include: {
      taskAssignments: { include: { task: true } },
      weeklyLogs: { orderBy: { weekNumber: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const currentWeek = getCurrentProgramWeek();

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interns</h1>
          <p className="text-gray-500 mt-1">{interns.length} interns registered</p>
        </div>
        <CreateInternDialog>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add intern
          </Button>
        </CreateInternDialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {interns.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>No interns yet. Add your first intern above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Intern</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Track</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Tasks (week)</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Log status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => {
                    const weekTasks = intern.taskAssignments.filter(
                      (a) => a.task.weekNumber === currentWeek
                    );
                    const completed = weekTasks.filter((a) => a.completedAt).length;
                    const hasLog = intern.weeklyLogs.some((l) => l.weekNumber === currentWeek);

                    return (
                      <tr key={intern.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold shrink-0">
                              {getInitials(intern.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{intern.name}</p>
                              <p className="text-xs text-gray-500">{intern.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {intern.track ? (
                            <Badge variant="outline">{intern.track}</Badge>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-700">
                            {completed}/{weekTasks.length}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {hasLog ? (
                            <Badge variant="success">Submitted</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-500">{formatDate(intern.createdAt)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/interns/${intern.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                            <DeleteInternButton internId={intern.id} internName={intern.name} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
