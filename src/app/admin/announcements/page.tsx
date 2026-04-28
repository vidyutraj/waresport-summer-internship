import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateAnnouncementDialog } from "@/components/shared/create-announcement-dialog";
import { DeleteAnnouncementButton } from "@/components/shared/delete-announcement-button";

export default async function AdminAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const announcements = await prisma.announcement.findMany({
    include: { creator: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Post announcements to all interns</p>
        </div>
        <CreateAnnouncementDialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New announcement
          </Button>
        </CreateAnnouncementDialog>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{a.title}</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.body}</p>
                  </div>
                  <DeleteAnnouncementButton announcementId={a.id} title={a.title} />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Posted by {a.creator.name}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
