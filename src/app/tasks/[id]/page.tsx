import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, Tag } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TaskCheckbox } from "@/components/shared/task-checkbox";
import { TaskSubmissionForm } from "@/components/shared/task-submission-form";
import { canMarkTaskComplete, submissionKindShortLabel } from "@/lib/submission-kind";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId: params.id, userId: session.user.id } },
    include: {
      task: { include: { creator: { select: { name: true } } } },
      submissions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!assignment) notFound();

  const { task } = assignment;
  const canComplete = canMarkTaskComplete(task, assignment.submissions.length);

  return (
    <AppLayout>
      <div className="mb-6">
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                {task.requiresSubmission && task.submissionKind !== "NONE" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Submission required · {submissionKindShortLabel(task.submissionKind)}
                  </p>
                )}
              </div>
              <Badge variant="default">Week {task.weekNumber}</Badge>
            </div>

            {task.description && (
              <div className="prose prose-sm max-w-none text-gray-600 mb-6">
                <p>{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-gray-100">
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Due date</p>
                    <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Assigned to</p>
                  <p className="text-sm font-medium capitalize">{task.assignedTo.toLowerCase()}</p>
                </div>
              </div>
              {task.track && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Track</p>
                    <p className="text-sm font-medium">{task.track}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <TaskSubmissionForm
                assignmentId={assignment.id}
                requiresSubmission={task.requiresSubmission}
                submissionKind={task.submissionKind}
                initialSubmissions={assignment.submissions.map((s) => ({
                  id: s.id,
                  kind: s.kind,
                  body: s.body,
                  linkUrl: s.linkUrl,
                  createdAt: s.createdAt.toISOString(),
                }))}
              />
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <TaskCheckbox
                assignmentId={assignment.id}
                title={task.title}
                dueDate={task.dueDate}
                completedAt={assignment.completedAt}
                taskId={task.id}
                canMarkComplete={canComplete}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
