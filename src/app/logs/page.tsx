import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getCurrentProgramWeek } from "@/lib/utils";
import { WeeklyLogForm } from "@/components/shared/weekly-log-form";
import { FileText, Clock } from "lucide-react";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/logs");

  const currentWeek = getCurrentProgramWeek();

  const [logs, currentLog] = await Promise.all([
    prisma.weeklyLog.findMany({
      where: { userId: session.user.id },
      orderBy: { weekNumber: "desc" },
    }),
    prisma.weeklyLog.findUnique({
      where: { userId_weekNumber: { userId: session.user.id, weekNumber: currentWeek } },
    }),
  ]);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Logs</h1>
        <p className="text-gray-500 mt-1">Your weekly progress reflections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit / view current week log */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-600" />
                Week {currentWeek} — Current Week
                {currentLog ? (
                  <Badge variant="success">Submitted</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentLog ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Worked on</p>
                    <p className="text-sm text-gray-700">{currentLog.workedOn}</p>
                  </div>
                  {currentLog.blockers && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Blockers</p>
                      <p className="text-sm text-gray-700">{currentLog.blockers}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Next week goals</p>
                    <p className="text-sm text-gray-700">{currentLog.nextWeekGoals}</p>
                  </div>
                  <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Submitted {formatDate(currentLog.submittedAt)}</span>
                  </div>
                </div>
              ) : (
                <WeeklyLogForm weekNumber={currentWeek} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Past logs */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Past Submissions</h2>
          {logs.filter((l) => l.weekNumber !== currentWeek).length === 0 ? (
            <p className="text-sm text-gray-400">No past logs yet.</p>
          ) : (
            <div className="space-y-3">
              {logs
                .filter((l) => l.weekNumber !== currentWeek)
                .map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">Week {log.weekNumber}</span>
                        <Badge variant="success">Submitted</Badge>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{log.workedOn}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(log.submittedAt)}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
