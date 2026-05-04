import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.weeklyLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ weekNumber: "desc" }, { submittedAt: "desc" }],
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Weekly Logs</h1>
        <p className="text-gray-500 mt-1">All intern weekly log submissions</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No logs submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold shrink-0">
                    {getInitials(log.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{log.user.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(log.submittedAt)}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Worked on</p>
                        <p className="text-sm text-gray-700">{log.workedOn}</p>
                      </div>
                      {log.blockers && (
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Blockers</p>
                          <p className="text-sm text-gray-700">{log.blockers}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Next week goals</p>
                        <p className="text-sm text-gray-700">{log.nextWeekGoals}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
