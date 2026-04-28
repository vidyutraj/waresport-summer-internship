import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Clock, FileText, Link2, Phone, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate, getInitials, getCurrentProgramWeek } from "@/lib/utils";
import { DeleteInternButton } from "@/components/shared/delete-intern-button";

export default async function InternDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const intern = await prisma.user.findUnique({
    where: { id: params.id, role: "INTERN" },
    include: {
      taskAssignments: {
        include: {
          task: true,
          submissions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { task: { weekNumber: "desc" } },
      },
      weeklyLogs: { orderBy: { weekNumber: "desc" } },
    },
  });

  if (!intern) notFound();

  const now = new Date();
  const currentWeek = getCurrentProgramWeek();

  const completedTasks = intern.taskAssignments.filter((a) => a.completedAt).length;
  const totalTasks = intern.taskAssignments.length;
  const overdueTasks = intern.taskAssignments.filter(
    (a) => !a.completedAt && a.task.dueDate && new Date(a.task.dueDate) < now
  ).length;

  const weekGroups = intern.taskAssignments.reduce((acc, a) => {
    const w = a.task.weekNumber;
    if (!acc[w]) acc[w] = [];
    acc[w].push(a);
    return acc;
  }, {} as Record<number, typeof intern.taskAssignments>);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/admin/interns">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Interns
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={`/api/admin/interns/${intern.id}/export-pdf`} download>
              <Download className="h-4 w-4" />
              Export progress PDF
            </a>
          </Button>
          <DeleteInternButton internId={intern.id} internName={intern.name} />
        </div>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shrink-0">
          {getInitials(intern.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{intern.name}</h1>
          <p className="text-gray-500">{intern.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {intern.track && <Badge variant="outline">{intern.track}</Badge>}
            <span className="text-xs text-gray-400">Joined {formatDate(intern.createdAt)}</span>
            {intern.linkedin && (
              <a href={intern.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 flex items-center gap-1">
                <Link2 className="h-3 w-3" />LinkedIn
              </a>
            )}
            {intern.phone && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />{intern.phone}
              </span>
            )}
          </div>
          {intern.bio && <p className="text-sm text-gray-600 mt-2 max-w-lg">{intern.bio}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-gray-500">Tasks completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Clock className="h-5 w-5 text-red-500 mb-2" />
            <p className="text-2xl font-bold">{overdueTasks}</p>
            <p className="text-xs text-gray-500">Overdue tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <FileText className="h-5 w-5 text-brand-500 mb-2" />
            <p className="text-2xl font-bold">{intern.weeklyLogs.length}</p>
            <p className="text-xs text-gray-500">Logs submitted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work submissions from tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Task work submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {intern.taskAssignments.every((a) => a.submissions.length === 0) ? (
              <p className="text-sm text-gray-400">No work submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {intern.taskAssignments
                  .filter((a) => a.submissions.length > 0)
                  .map((a) => (
                    <div key={a.id} className="rounded-lg border border-gray-100 p-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {a.task.title}{" "}
                        <span className="font-normal text-gray-400">· Week {a.task.weekNumber}</span>
                      </p>
                      <ul className="space-y-2">
                        {a.submissions.map((s) => (
                          <li key={s.id} className="text-sm border-l-2 border-brand-200 pl-3">
                            <p className="text-xs text-gray-400">{formatDate(s.createdAt)}</p>
                            {s.body && <p className="text-gray-700 mt-1 whitespace-pre-wrap">{s.body}</p>}
                            {s.linkUrl && (
                              <a
                                href={s.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-brand-600 mt-1 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {s.linkUrl}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task History</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(weekGroups).length === 0 ? (
              <p className="text-sm text-gray-400">No tasks assigned.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(weekGroups)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([week, tasks]) => (
                    <div key={week}>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                        Week {week} {Number(week) === currentWeek && "(Current)"}
                      </p>
                      <ul className="space-y-1.5">
                        {tasks.map((a) => (
                          <li key={a.id} className="flex items-center gap-2 text-sm">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${a.completedAt ? "bg-green-500" : "bg-gray-300"}`} />
                            <span className={a.completedAt ? "text-gray-900" : "text-gray-500"}>
                              {a.task.title}
                            </span>
                            {a.completedAt && (
                              <span className="text-xs text-gray-400 ml-auto">{formatDate(a.completedAt)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {intern.weeklyLogs.length === 0 ? (
              <p className="text-sm text-gray-400">No logs submitted.</p>
            ) : (
              <div className="space-y-4">
                {intern.weeklyLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Week {log.weekNumber}</span>
                      <span className="text-xs text-gray-400">{formatDate(log.submittedAt)}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Worked on</p>
                    <p className="text-sm text-gray-700 mb-2">{log.workedOn}</p>
                    {log.blockers && (
                      <>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Blockers</p>
                        <p className="text-sm text-gray-700 mb-2">{log.blockers}</p>
                      </>
                    )}
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Next week goals</p>
                    <p className="text-sm text-gray-700">{log.nextWeekGoals}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
