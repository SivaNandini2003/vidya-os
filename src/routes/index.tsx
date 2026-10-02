import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, Layers, Lock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSchool } from "@/lib/school-store";
import { ROLE_LABEL } from "@/lib/nav";
import type { Role } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · VIDYA OS" },
      {
        name: "description",
        content:
          "Sign in to VIDYA OS — connected admin, teacher, student and parent workspaces built around one student digital profile.",
      },
      { property: "og:title", content: "Sign in · VIDYA OS" },
      {
        property: "og:description",
        content: "One student, one digital profile, every school activity connected.",
      },
    ],
  }),
  component: LoginPage,
});

const demoAccounts: { role: Role; email: string; label: string }[] = [
  { role: "admin", email: "admin@vidya.edu", label: "Rohit Malhotra · Principal" },
  { role: "teacher", email: "priya.sharma@vidya.edu", label: "Priya Sharma · Class teacher 10-A" },
  { role: "student", email: "arjun.kumar@student.vidya.edu", label: "Arjun Kumar · 10-A" },
  { role: "parent", email: "meena.kumar@gmail.com", label: "Meena Kumar · Arjun's mother" },
];

function LoginPage() {
  const { login, currentUser, ready } = useSchool();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@vidya.edu");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && currentUser) navigate({ to: "/app/$section", params: { section: "dashboard" } });
  }, [ready, currentUser, navigate]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const res = await login(email, password);
      if (!res.ok) {
        setError(res.error ?? "Sign in failed");
        return;
      }
      toast.success(`Signed in as ${ROLE_LABEL[res.user!.role]}`);
      navigate({ to: "/app/$section", params: { section: "dashboard" } });
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="hero-mesh relative hidden flex-col justify-between p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary font-display font-bold text-sidebar-primary-foreground">
            V
          </span>
          <div>
            <p className="font-display text-base font-semibold text-sidebar-accent-foreground">VIDYA OS</p>
            <p className="text-xs text-sidebar-foreground/75">The operating system for modern schools.</p>
          </div>
        </div>

        <div className="max-w-lg">
          <p className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/40 px-3 py-1 text-xs font-medium text-sidebar-accent-foreground">
            <Sparkles className="size-3.5" /> One connected school system
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-sidebar-accent-foreground">
            One student. One digital profile. Every school activity connected.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/80">
            Admission, attendance, marks, assignments, fees and communication all resolve to the same
            student record — so a single action updates every dashboard that depends on it.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Users, text: "Admin creates the student & assigns a class teacher" },
              { icon: GraduationCap, text: "Teacher marks attendance and enters marks" },
              { icon: Layers, text: "Student & parent dashboards update instantly" },
              { icon: ShieldCheck, text: "Role-based access with full activity logs" },
            ].map((f) => (
              <div key={f.text} className="flex gap-3 rounded-xl bg-sidebar-accent/40 p-3">
                <f.icon className="size-4 shrink-0 text-sidebar-primary" />
                <p className="text-xs leading-relaxed text-sidebar-foreground/85">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/60">Demo environment · sample data resets on request</p>
      </section>

      <section className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <p className="font-display text-2xl font-semibold">VIDYA OS</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The operating system for modern schools.
            </p>
          </div>

          <div className="surface-card mt-6 p-6 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Sign in to your workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your dashboard is determined by your role. URLs of other roles stay blocked.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  autoComplete="username"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" />
              </Button>
            </form>

            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> Sessions are stored locally for this demo. Password: demo1234
            </p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo accounts
            </p>
            <div className="mt-2 grid gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  onClick={() => {
                    setEmail(a.email);
                    setPassword("demo1234");
                    setError(null);
                  }}
                  className="surface-card flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-accent"
                >
                  <span>
                    <span className="block text-sm font-medium">{ROLE_LABEL[a.role]}</span>
                    <span className="block text-xs text-muted-foreground">{a.label}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
