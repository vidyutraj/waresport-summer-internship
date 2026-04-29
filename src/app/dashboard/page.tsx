import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Megaphone, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDate, getCurrentProgramWeek } from "@/lib/utils";
import { TaskCheckbox } from "@/components/shared/task-checkbox";
import { canMarkTaskComplete } from "@/lib/submission-kind";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const userId = session.user.id;

  const now = new Date();
  const currentWeek = getCurrentProgramWeek();

  const [assignments, announcements] = await Promise.all([
    prisma.taskAssignment.findMany({
      where: { userId },
      include: { task: true, _count: { select: { submissions: true } } },
      orderBy: { task: { weekNumber: "asc" } },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { creator: { select: { name: true } } },
    }),
  ]);

  const currentWeekTasks = assignments.filter((a) => a.task.weekNumber === currentWeek);
  const completedCount = currentWeekTasks.filter((a) => a.completedAt).length;
  const totalCount = currentWeekTasks.length;
  const pendingTasks = currentWeekTasks.filter((a) => !a.completedAt);
  const overdueTasks = assignments.filter(
    (a) => !a.completedAt && a.task.dueDate && new Date(a.task.dueDate) < now
  );

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good {getGreeting()}, {session.user.name?.split(" ")[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your internship overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Tasks this week</span>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{completedCount}/{totalCount}</p>
            <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Pending tasks</span>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingTasks.length}</p>
            <p className="text-xs text-gray-400 mt-1">this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Overdue</span>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{overdueTasks.length}</p>
            <p className="text-xs text-gray-400 mt-1">tasks past due date</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current week tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Week {currentWeek} Tasks</CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-700">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {currentWeekTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No tasks assigned for this week</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {currentWeekTasks.map((assignment) => (
                    <li key={assignment.id}>
                      <TaskCheckbox
                        assignmentId={assignment.id}
                        title={assignment.task.title}
                        description={assignment.task.description}
                        dueDate={assignment.task.dueDate}
                        completedAt={assignment.completedAt}
                        taskId={assignment.task.id}
                        canMarkComplete={canMarkTaskComplete(
                          assignment.task,
                          assignment._count.submissions
                        )}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-brand-600" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No announcements yet</p>
              ) : (
                <ul className="space-y-3">
                  {announcements.map((a) => (
                    <li key={a.id} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.body}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
