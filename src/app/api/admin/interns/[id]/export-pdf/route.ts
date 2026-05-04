import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function safeFileName(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "intern";
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const intern = await prisma.user.findUnique({
    where: { id: params.id, role: "INTERN" },
    include: {
      taskAssignments: {
        include: {
          task: true,
          submissions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { task: { weekNumber: "asc" } },
      },
      weeklyLogs: { orderBy: { weekNumber: "asc" } },
    },
  });

  if (!intern) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const total = intern.taskAssignments.length;
  const completed = intern.taskAssignments.filter((a) => a.completedAt).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  let y = margin;

  doc.setFontSize(18);
  doc.text("Intern progress report", margin, y);
  y += 28;
  doc.setFontSize(11);
  doc.text(`Name: ${intern.name}`, margin, y);
  y += 16;
  doc.text(`Email: ${intern.email}`, margin, y);
  y += 16;
  if (intern.track) {
    doc.text(`Track: ${intern.track}`, margin, y);
    y += 16;
  }
  if (intern.linkedin) {
    const linkLines = doc.splitTextToSize(`LinkedIn: ${intern.linkedin}`, 500);
    doc.text(linkLines, margin, y);
    y += 14 * linkLines.length + 4;
  }
  y += 8;

  doc.setFontSize(11);
  doc.text(`Tasks completed: ${completed} / ${total} (${rate}% completion rate)`, margin, y);
  y += 16;
  doc.text(`Weekly logs submitted: ${intern.weeklyLogs.length}`, margin, y);
  y += 22;

  doc.setFontSize(13);
  doc.text("Task history", margin, y);
  y += 6;

  const taskRows = intern.taskAssignments.map((a) => [
    String(a.task.weekNumber),
    a.task.title,
    a.completedAt ? "Done" : "Open",
    a.completedAt ? a.completedAt.toLocaleDateString() : "—",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Week", "Task", "Status", "Completed"]],
    body: taskRows.length ? taskRows : [["—", "No tasks assigned", "", ""]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [211, 0, 0] },
  });

  y = (doc as DocWithTable).lastAutoTable?.finalY ?? y;
  y += 20;

  doc.setFontSize(13);
  doc.text("Weekly logs", margin, y);
  y += 6;

  if (intern.weeklyLogs.length === 0) {
    doc.setFontSize(10);
    doc.text("No logs submitted.", margin, y + 4);
    y += 20;
  } else {
    const logRows = intern.weeklyLogs.map((l) => [
      String(l.weekNumber),
      l.workedOn.slice(0, 200) + (l.workedOn.length > 200 ? "…" : ""),
      l.submittedAt.toLocaleDateString(),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Week", "Worked on (excerpt)", "Submitted"]],
      body: logRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [211, 0, 0] },
    });
    y = (doc as DocWithTable).lastAutoTable?.finalY ?? y;
    y += 20;
  }

  if (y > 620) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(13);
  doc.text("Work submissions (by task)", margin, y);
  y += 6;

  const subRows: string[][] = [];
  for (const a of intern.taskAssignments) {
    for (const s of a.submissions) {
      const typeLabel =
        s.kind === "CONFIRMATION"
          ? "Confirm"
          : s.kind === "LINK"
            ? "Link/file"
            : s.kind === "TEXT"
              ? "Text"
              : String(s.kind);
      let excerpt = (s.body ?? "").slice(0, 120) + ((s.body?.length ?? 0) > 120 ? "…" : "");
      if (s.kind === "CONFIRMATION" && !excerpt && !s.linkUrl) excerpt = "Confirmed";
      subRows.push([
        a.task.title,
        typeLabel,
        excerpt || "—",
        s.linkUrl ?? "—",
        s.createdAt.toLocaleString(),
      ]);
    }
  }

  autoTable(doc, {
    startY: y,
    head: [["Task", "Type", "Notes (excerpt)", "Link", "Submitted"]],
    body: subRows.length ? subRows : [["—", "—", "No submissions yet", "", ""]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [211, 0, 0] },
  });

  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(100);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated ${new Date().toLocaleString()} — Waresport`,
      margin,
      doc.internal.pageSize.height - 28
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  const fname = `intern-progress-${safeFileName(intern.name)}.pdf`;

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
