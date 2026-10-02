import { Link, useNavigate } from "@tanstack/react-router";
import { useState, Component, type ReactNode, type ErrorInfo } from "react";
import * as Icons from "lucide-react";
import { Bell, LogOut, Menu, RotateCcw, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NAV, ROLE_LABEL } from "@/lib/nav";
import { useSchool, useSelectors } from "@/lib/school-store";
import { prettyDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Workspace caught error:", error, errorInfo);
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Icons.AlertTriangle className="size-8 text-destructive" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">Something went wrong here</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This section failed to load. Please try resetting the demo data or navigating to another page.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

export function AppShell({ section, children }: { section: string; children: ReactNode }) {
  const { currentUser, logout, resetDemoData, markAllNotificationsRead, markNotificationRead } = useSchool();
  const selectors = useSelectors();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;
  const items = NAV[currentUser.role];
  const notifications = selectors.notificationsFor(currentUser.id);
  const unread = notifications.filter((n) => !n.readBy.includes(currentUser.id));

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="brand-gradient grid size-9 place-items-center rounded-xl font-display text-sm font-bold text-primary-foreground">
          V
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">VIDYA OS</p>
          <p className="truncate text-xs text-sidebar-foreground/70">The operating system for modern schools.</p>
        </div>
      </div>
      <Separator className="bg-sidebar-border" />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.key}
              to="/app/$section"
              params={{ section: item.key }}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                section === item.key
                  ? "bg-sidebar-primary/20 text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <NavIcon name={item.icon} className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="space-y-3 px-4 py-4">
        <div className="rounded-xl bg-sidebar-accent/70 p-3 text-xs text-sidebar-foreground/80">
          <p className="flex items-center gap-2 font-medium text-sidebar-accent-foreground">
            <ShieldCheck className="size-3.5" /> Role-based access
          </p>
          <p className="mt-1">
            You are signed in as {ROLE_LABEL[currentUser.role]}. Other role dashboards are blocked.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            resetDemoData();
            toast.success("Demo data reset to the original story");
          }}
        >
          <RotateCcw className="size-4" /> Reset demo data
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border lg:block">{sidebar}</aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-float">
            <button
              className="absolute right-3 top-4 z-10 rounded-md p-1 text-sidebar-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold capitalize">
              {items.find((i) => i.key === section)?.label ?? "Dashboard"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {ROLE_LABEL[currentUser.role]} workspace · Vidya Public School
            </p>
          </div>

          <ThemeToggle />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="size-5" />
                {unread.length ? (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                    {unread.length > 9 ? "9+" : unread.length}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                <Button variant="ghost" size="sm" onClick={() => markAllNotificationsRead(currentUser.id)}>
                  Mark all read
                </Button>
              </div>
              <Separator />
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
                ) : (
                  notifications.slice(0, 12).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id, currentUser.id)}
                      className={cn(
                        "block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.readBy.includes(currentUser.id) && "bg-accent/5",
                      )}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {n.type} · {prettyDateTime(n.createdAt)}
                      </p>
                    </button>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3">
            <span
              className="grid size-8 place-items-center rounded-full text-xs font-semibold text-primary-foreground"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold leading-tight">{currentUser.name}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">
                {ROLE_LABEL[currentUser.role]}
              </span>
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}
