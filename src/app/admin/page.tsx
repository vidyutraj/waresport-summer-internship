import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare, FileText, AlertCircle, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { getInitials, getCurrentProgramWeek } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const currentWeek = getCurrentProgramWeek();

  const [
    internCount,
    allAssignments,
    currentWeekLogs,
    interns,
    overdueTasks,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "INTERN" } }),
    prisma.taskAssignment.findMany({
      where: { task: { weekNumber: currentWeek } },
      include: { task: true, user: { select: { name: true, email: true, track: true } } },
    }),
    prisma.weeklyLog.findMany({
      where: { weekNumber: currentWeek },
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: "INTERN" },
      select: {
        id: true, name: true, email: true, track: true, createdAt: true,
        taskAssignments: {
          where: { task: { weekNumber: currentWeek } },
          include: { task: true },
        },
        weeklyLogs: { where: { weekNumber: currentWeek } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.taskAssignment.findMany({
      where: { completedAt: null, task: { dueDate: { lt: now } } },
      include: { task: true, user: { select: { name: true } } },
    }),
  ]);

  const completedCount = allAssignments.filter((a) => a.completedAt).length;
  const completionRate =
    allAssignments.length > 0
      ? Math.round((completedCount / allAssignments.length) * 100)
      : 0;

  const logsSubmitted = currentWeekLogs.length;
  const logsPending = Math.max(0, internCount - logsSubmitted);

  const stats = [
    { label: "Total Interns", value: internCount, icon: Users, color: "text-brand-600 bg-brand-100" },
    { label: "Tasks Completed (Week)", value: `${completedCount}/${allAssignments.length}`, icon: CheckSquare, color: "text-green-600 bg-green-100" },
    { label: "Logs Pending", value: logsPending, icon: FileText, color: "text-amber-600 bg-amber-100" },
    { label: "Overdue Tasks", value: overdueTasks.length, icon: AlertCircle, color: "text-red-600 bg-red-100" },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview for Week {currentWeek}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intern roster */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Intern Roster — Week {currentWeek}</CardTitle>
              <Link href="/admin/interns" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {interns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No interns yet.</p>
              ) : (
                <div className="space-y-2">
                  {interns.slice(0, 8).map((intern) => {
                    const completed = intern.taskAssignments.filter((a) => a.completedAt).length;
                    const total = intern.taskAssignments.length;
                    const hasLog = intern.weeklyLogs.length > 0;

                    return (
                      <Link key={intern.id} href={`/admin/interns/${intern.id}`}>
                        <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold shrink-0">
                            {getInitials(intern.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{intern.name}</p>
                            <p className="text-xs text-gray-500">{intern.track ?? "No track"}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500">{completed}/{total} tasks</span>
                            {hasLog ? (
                              <Badge variant="success">Log ✓</Badge>
                            ) : (
                              <Badge variant="warning">No log</Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completion rate + overdue */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-sm text-gray-500 mt-1">tasks completed this week</p>
              <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {overdueTasks.length > 0 && (
            <Card className="border-red-100">
              <CardHeader>
                <CardTitle className="text-base text-red-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {overdueTasks.slice(0, 5).map((a) => (
                    <li key={a.id} className="text-xs">
                      <span className="font-medium text-gray-900">{a.user.name}</span>
                      <span className="text-gray-500"> — {a.task.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
