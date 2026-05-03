import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { TaskCheckbox } from "@/components/shared/task-checkbox";
import { WeekSection } from "@/components/shared/week-section";
import { getCurrentProgramWeek } from "@/lib/utils";
import { canMarkTaskComplete } from "@/lib/submission-kind";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/tasks");

  const currentWeek = getCurrentProgramWeek();

  const assignments = await prisma.taskAssignment.findMany({
    where: { userId: session.user.id },
    include: { task: true, _count: { select: { submissions: true } } },
    orderBy: [{ task: { weekNumber: "asc" } }, { task: { dueDate: "asc" } }],
  });

  const groupedByWeek = assignments.reduce((acc, a) => {
    const week = a.task.weekNumber;
    if (!acc[week]) acc[week] = [];
    acc[week].push(a);
    return acc;
  }, {} as Record<number, typeof assignments>);

  const weeks = Object.keys(groupedByWeek)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500 mt-1">Your full task list, grouped by week</p>
      </div>

      {weeks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No tasks assigned yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => {
            const tasks = groupedByWeek[week];
            const completed = tasks.filter((t) => t.completedAt).length;
            const isCurrentWeek = week === currentWeek;
            return (
              <WeekSection
                key={week}
                week={week}
                completed={completed}
                total={tasks.length}
                isCurrentWeek={isCurrentWeek}
                defaultOpen={isCurrentWeek}
              >
                {tasks.map((assignment) => (
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
              </WeekSection>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
