import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSchool } from "@/lib/school-store";
import { NAV } from "@/lib/nav";
import { AdminSection } from "@/components/sections/admin";
import { TeacherSection } from "@/components/sections/teacher";
import { StudentSection } from "@/components/sections/student";
import { ParentSection } from "@/components/sections/parent";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/$section")({
  head: () => ({
    meta: [
      { title: "Workspace · VIDYA OS" },
      { name: "description", content: "Role-based school workspace for admins, teachers, students and parents." },
      { property: "og:title", content: "Workspace · VIDYA OS" },
      { property: "og:description", content: "Connected attendance, results, fees and communication." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePage,
});

function LoadingShell() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function WorkspacePage() {
  const { section } = Route.useParams();
  const { currentUser, ready } = useSchool();
  const navigate = useNavigate();

  const allowed = currentUser ? NAV[currentUser.role].some((i) => i.key === section) : false;

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      navigate({ to: "/" });
      return;
    }
    if (!allowed) {
      navigate({ to: "/app/$section", params: { section: "dashboard" }, replace: true });
    }
  }, [ready, currentUser, allowed, navigate]);

  if (!ready || !currentUser || !allowed) return <LoadingShell />;

  return (
    <AppShell section={section}>
      {currentUser.role === "admin" ? <AdminSection section={section} /> : null}
      {currentUser.role === "teacher" ? <TeacherSection section={section} /> : null}
      {currentUser.role === "student" ? <StudentSection section={section} /> : null}
      {currentUser.role === "parent" ? <ParentSection section={section} /> : null}
    </AppShell>
  );
}
