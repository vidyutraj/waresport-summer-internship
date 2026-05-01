"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  BookOpen,
  User,
  Users,
  LogOut,
  Megaphone,
  ChevronRight,
  Zap,
  Users2,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { SocialLinksBar } from "@/components/shared/SocialLinksBar";

const internNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/directory", label: "Team directory", icon: Users2 },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/logs", label: "Weekly Logs", icon: FileText },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/directory", label: "Team directory", icon: Users2 },
  { href: "/admin/interns", label: "Interns", icon: Users },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/logs", label: "Weekly Logs", icon: FileText },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

/** Pick the most specific nav href so `/admin` does not stay active on `/admin/resources`, etc. */
function getActiveNavHref(pathname: string, items: { href: string }[]) {
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const matches = items.filter(
    (item) => path === item.href || path.startsWith(item.href + "/")
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const nav = isAdmin ? adminNav : internNav;
  const activeHref = getActiveNavHref(pathname, nav);

  return (
    <div className="flex h-screen w-64 flex-col bg-white text-[#212529] fixed left-0 top-0 z-30 border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-[#212529]">Waresport</p>
          <p className="text-xs text-[#6C757D]">Intern Portal</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-4 pb-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            isAdmin ? "bg-brand-100 text-brand-800" : "bg-gray-100 text-[#6C757D]"
          )}
        >
          {isAdmin ? "Admin" : `Intern · ${session?.user?.track ?? "Unassigned"}`}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {nav.map((item) => {
            const isActive = item.href === activeHref;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-[#6C757D] hover:bg-gray-50 hover:text-[#212529]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-80" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Social links */}
      <div className="px-4 pb-2"><SocialLinksBar /></div>

      {/* User section */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shrink-0 shadow-sm">
            {getInitials(session?.user?.name ?? "U")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#212529] truncate">{session?.user?.name}</p>
            <p className="text-xs text-[#6C757D] truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6C757D] hover:bg-gray-50 hover:text-[#212529] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
