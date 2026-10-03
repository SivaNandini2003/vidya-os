import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  GraduationCap,
  Megaphone,
  Plus,
  School,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PageHeader, EmptyState } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, attendanceTone, feeTone } from "@/components/common/StatusBadge";
import { BarsChart, DonutChart, MultiLineChart, TrendChart } from "@/components/charts/Charts";
import { StudentAvatar, StudentDigitalProfile, attendanceSeries } from "@/components/student/StudentDigitalProfile";
import { gradeFor, inr, useActor, useSchool, useSelectors } from "@/lib/school-store";
import { prettyDate, prettyDateTime, today } from "@/lib/dates";
import { computeRisk } from "@/lib/insights";
import type { Audience, Student } from "@/types";

export function AdminSection({ section }: { section: string }) {
  switch (section) {
    case "students":
      return <StudentsPage />;
    case "teachers":
      return <TeachersPage />;
    case "classes":
      return <ClassesPage />;
    case "attendance":
      return <AttendancePage />;
    case "academics":
      return <AcademicsPage />;
    case "fees":
      return <FeesPage />;
    case "announcements":
      return <AnnouncementsPage />;
    case "reports":
      return <ReportsPage />;
    case "insights":
      return <InsightsPage />;
    case "logs":
      return <LogsPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <AdminDashboard />;
  }
}

function useSchoolStats() {
  const { state } = useSchool();
  const s = useSelectors();
  return useMemo(() => {
    const todayRecords = state.attendance.filter((a) => a.date === today());
    const present = todayRecords.filter((a) => a.status !== "absent").length;
    const pendingFees = state.fees.reduce((t, f) => t + (f.amount - f.paidAmount), 0);
    const collected = state.fees.reduce((t, f) => t + f.paidAmount, 0);
    const validStuds = state.students.filter(st => s.averagePct(st.id) !== null);
    const avg = validStuds.length
      ? Math.round(validStuds.reduce((t, st) => t + s.averagePct(st.id)!, 0) / validStuds.length)
      : null;
    return {
      todayRecords,
      present,
      absent: todayRecords.length - present,
      todayPct: todayRecords.length ? Math.round((present / todayRecords.length) * 100) : 0,
      pendingFees,
      collected,
      avg,
    };
  }, [state, s]);
}

function AdminDashboard() {
  const { state } = useSchool();
  const s = useSelectors();
  const stats = useSchoolStats();

  const classPerf = state.classes.map((c) => {
    const studs = state.students.filter((st) => st.classId === c.id);
    const validStuds = studs.filter((st) => s.averagePct(st.id) !== null);
    const value = validStuds.length
      ? Math.round(validStuds.reduce((t, st) => t + s.averagePct(st.id)!, 0) / validStuds.length)
      : null;
    return { name: c.name, value };
  }).filter((c) => c.value !== null) as { name: string; value: number }[];

  const trend = attendanceSeries(
    state.attendance.slice().sort((a, b) => a.date.localeCompare(b.date)),
    8,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="School control center"
        description="Live snapshot of admissions, attendance, academics and fee collection."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total students" value={state.students.length} icon={GraduationCap} hint="Active enrolment" />
        <StatCard label="Total teachers" value={state.teachers.length} icon={Users} tone="accent" />
        <StatCard label="Classes & sections" value={state.classes.length} icon={School} tone="accent" />
        <StatCard
          label="Today's attendance"
          value={`${stats.todayPct}%`}
          hint={`${stats.present} present · ${stats.absent} absent`}
          icon={CalendarCheck}
          tone={stats.todayPct >= 85 ? "success" : "warning"}
        />
        <StatCard label="Pending fees" value={inr(stats.pendingFees)} icon={Wallet} tone="warning" />
        <StatCard 
          label="Average performance" 
          value={stats.avg !== null ? `${stats.avg}%` : "No data"} 
          icon={TrendingUp} 
          tone={stats.avg !== null ? (stats.avg >= 70 ? "success" : "warning") : "primary"} 
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Attendance trend (school-wide)</h3>
          <TrendChart data={trend} />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Today · present vs absent</h3>
          <DonutChart
            data={[
              { name: "Present", value: stats.present, color: "var(--color-chart-4)" },
              { name: "Absent", value: stats.absent, color: "var(--color-chart-5)" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Class performance (average %)</h3>
          <BarsChart data={classPerf} unit="%" />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Fee collection</h3>
          <DonutChart
            data={[
              { name: "Collected", value: stats.collected, color: "var(--color-chart-1)" },
              { name: "Pending", value: stats.pendingFees, color: "var(--color-chart-3)" },
            ]}
          />
        </div>
      </div>

      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">Recent activity</h3>
        <ul className="mt-3 space-y-3">
          {state.logs.slice(0, 8).map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{l.action}</p>
                <p className="text-xs text-muted-foreground">{l.detail}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{prettyDateTime(l.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AddStudentDialog() {
  const { state, addStudent } = useSchool();
  const actor = useActor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dob: "2010-05-14",
    gender: "Male" as Student["gender"],
    phone: "+91 98765 00000",
    address: "Bengaluru",
    classId: state.classes[0]?.id ?? "",
    parentName: "",
  });

  const cls = state.classes.find((c) => c.id === form.classId);
  const classTeacher = state.teachers.find((t) => t.id === cls?.classTeacherId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Add student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Admit a new student</DialogTitle>
          <DialogDescription>
            One record creates the digital profile, the parent link, the class roll entry and the first fee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Arjun Kumar" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date of birth">
              <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Student["gender"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Parent / guardian name">
            <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="e.g. Neha Bansal" />
          </Field>
          <Field label="Class & section">
            <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {state.classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    Class {c.grade} · Section {c.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assigned class teacher">
            <Input value={classTeacher?.name ?? "—"} readOnly className="bg-muted" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact number">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!form.name.trim()) {
                toast.error("Enter the student's name");
                return;
              }
              if (!form.parentName.trim()) {
                toast.error("Enter the parent's name");
                return;
              }
              try {
                const created = await addStudent(form, actor);
                setOpen(false);
                setForm({ ...form, name: "" });
                toast.success(`${created?.name || form.name} admitted`, {
                  description: `Now visible to ${classTeacher?.name}, the student and the parent.`,
                });
              } catch (e) {
                toast.error("Failed to add student");
              }
            }}
          >
            Save student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function StudentsPage() {
  const { state, removeStudent } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = state.students.filter(
    (st) =>
      (classFilter === "all" || st.classId === classFilter) &&
      (st.name.toLowerCase().includes(q.toLowerCase()) || st.id.toLowerCase().includes(q.toLowerCase())),
  );

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
          ← Back to students
        </Button>
        <StudentDigitalProfile studentId={selected} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description="Every student here is the single source of truth used by all other modules."
        actions={<AddStudentDialog />}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or student ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {state.classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No students match this search" description="Try a different name, ID or class." />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Class teacher</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Average</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((st) => {
                const cls = state.classes.find((c) => c.id === st.classId);
                const pct = s.attendancePct(st.id);
                const avg = s.averagePct(st.id);
                const fee = s.feeSummary(st.id);
                return (
                  <TableRow key={st.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={st.name} color={st.avatarColor} size="sm" />
                        <div>
                          <p className="font-medium">{st.name}</p>
                          <p className="text-xs text-muted-foreground">{st.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cls?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.teacherName(cls?.classTeacherId ?? "")}</TableCell>
                    <TableCell>
                      <StatusBadge tone={pct >= 85 ? "success" : pct >= 75 ? "warning" : "destructive"}>{pct}%</StatusBadge>
                    </TableCell>
                    <TableCell>
                      {avg !== null ? `${avg}% · ${gradeFor(avg)}` : "No data"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={fee.pending ? "warning" : "success"}>
                        {fee.pending ? `${inr(fee.pending)} due` : "Cleared"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelected(st.id)}>
                          Profile
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">Remove</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {st.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The student will be removed from class rolls and dashboards. Historic records stay in the logs.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  removeStudent(st.id, actor);
                                  toast.success(`${st.name} removed`);
                                }}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function TeachersPage() {
  const { state, addTeacher, removeTeacher } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", qualification: "", subjectName: "" });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teachers"
        description="Faculty, their subjects and the classes they are responsible for."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Add teacher</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add teacher</DialogTitle>
                <DialogDescription>A login is created automatically with the demo password.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Qualification"><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></Field>
                <Field label="Primary subject">
                  <Input 
                    value={form.subjectName} 
                    onChange={(e) => setForm({ ...form, subjectName: e.target.value })} 
                    list="subjects-list"
                    placeholder="e.g. Mathematics"
                  />
                  <datalist id="subjects-list">
                    {state.subjects.map((sub) => (
                      <option key={sub.id} value={sub.name} />
                    ))}
                  </datalist>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!form.name.trim() || !form.email.trim()) {
                      toast.error("Name and email are required");
                      return;
                    }
                    try {
                      await addTeacher(
                        {
                          name: form.name,
                          email: form.email,
                          phone: form.phone,
                          qualification: form.qualification,
                          subjectName: form.subjectName,
                          classIds: [],
                        },
                        actor,
                      );
                      setOpen(false);
                      setForm({ ...form, name: "", email: "" });
                      toast.success("Teacher added");
                    } catch (e) {
                      toast.error("Failed to add teacher");
                    }
                  }}
                >
                  Save teacher
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {state.teachers.map((t) => (
          <div key={t.id} className="surface-card p-5">
            <div className="flex items-center gap-3">
              <StudentAvatar name={t.name} color="#1f4d8f" />
              <div className="flex-1">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.id} · {t.qualification}</p>
              </div>
              <div className="flex items-center gap-1">
                <EditTeacherDialog teacher={t} />
                <Button variant="ghost" size="icon" onClick={() => removeTeacher(t.id, actor)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            <dl className="mt-4 space-y-1.5 text-sm">
              <p className="text-muted-foreground">Subjects: <span className="text-foreground">{t.subjectIds.map(s.subjectName).join(", ") || "—"}</span></p>
              <p className="text-muted-foreground">Classes: <span className="text-foreground">{t.classIds.map(s.className).join(", ") || "Not assigned"}</span></p>
              <p className="text-muted-foreground">{t.email}</p>
              <p className="text-muted-foreground">{t.phone}</p>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassesPage() {
  const { state, addClass, removeClass } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ grade: "8", section: "A", classTeacherId: state.teachers[0]?.id ?? "", room: "Block B · 202" });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Classes & sections"
        description="Each class links students, a class teacher and subject teachers."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Create class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create class & section</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Grade"><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></Field>
                  <Field label="Section"><Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value.toUpperCase() })} /></Field>
                </div>
                <Field label="Class teacher">
                  <Select value={form.classTeacherId} onValueChange={(v) => setForm({ ...form, classTeacherId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {state.teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Room"><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    addClass({ ...form, name: `${form.grade}-${form.section}` }, actor);
                    setOpen(false);
                    toast.success(`Class ${form.grade}-${form.section} created`);
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.classes.map((c) => {
          const studs = state.students.filter((st) => st.classId === c.id);
          const validStuds = studs.filter(st => s.averagePct(st.id) !== null);
          const avg = validStuds.length ? Math.round(validStuds.reduce((t, st) => t + s.averagePct(st.id)!, 0) / validStuds.length) : null;
          return (
            <div key={c.id} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Class {c.name}</h3>
                <div className="flex items-center gap-1">
                  <StatusBadge tone="info">{studs.length} students</StatusBadge>
                  <EditClassDialog classInfo={c} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeClass(c.id, actor)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.room}</p>
              <p className="mt-3 text-sm">Class teacher: <span className="font-medium">{s.teacherName(c.classTeacherId)}</span></p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {c.subjectTeachers.map((st) => (
                  <p key={st.subjectId}>{s.subjectName(st.subjectId)} — {s.teacherName(st.teacherId)}</p>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Class average</p>
                <Progress value={avg ?? 0} className="mt-1" />
                <p className="mt-1 text-xs font-medium">{avg !== null ? `${avg}%` : "No data"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendancePage() {
  const { state } = useSchool();
  const s = useSelectors();
  const stats = useSchoolStats();
  const [date, setDate] = useState(today());

  const dayRecords = state.attendance.filter((a) => a.date === date);

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance analytics" description="Updated the moment a teacher saves a register." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's rate" value={`${stats.todayPct}%`} icon={CalendarCheck} tone="success" />
        <StatCard label="Present today" value={stats.present} icon={Users} />
        <StatCard label="Absent today" value={stats.absent} icon={Users} tone="destructive" />
        <StatCard label="Registers saved today" value={new Set(stats.todayRecords.map((r) => r.classId)).size} icon={School} tone="accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Attendance trend</h3>
          <TrendChart data={attendanceSeries(state.attendance.slice().sort((a, b) => a.date.localeCompare(b.date)), 8)} />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Attendance by class</h3>
          <BarsChart
            unit="%"
            data={state.classes.map((c) => {
              const recs = state.attendance.filter((a) => a.classId === c.id);
              return {
                name: c.name,
                value: recs.length ? Math.round((recs.filter((r) => r.status !== "absent").length / recs.length) * 100) : 0,
              };
            })}
          />
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-sm font-semibold">Daily register</h3>
          <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {dayRecords.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">No attendance recorded for this date yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marked by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {state.students.find((st) => st.id === r.studentId)?.name ?? r.studentId}
                    </TableCell>
                    <TableCell>{s.className(r.classId)}</TableCell>
                    <TableCell><StatusBadge tone={attendanceTone(r.status)}>{r.status}</StatusBadge></TableCell>
                    <TableCell className="text-muted-foreground">{s.teacherName(r.markedByTeacherId)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function AcademicsPage() {
  const { state } = useSchool();
  const s = useSelectors();

  const subjectPerf = state.subjects.map((sub) => {
    const ms = state.marks.filter((m) => m.subjectId === sub.id);
    return {
      name: sub.code,
      value: ms.length ? Math.round(ms.reduce((t, m) => t + (m.score / m.maxScore) * 100, 0) / ms.length) : 0,
    };
  });

  const examTrend = ["Unit Test 1", "Mid Term"].map((exam) => {
    const row: Record<string, string | number> = { name: exam };
    state.classes.forEach((c) => {
      const ms = state.marks.filter((m) => m.examName === exam && m.classId === c.id);
      row[c.id] = ms.length ? Math.round(ms.reduce((t, m) => t + m.score, 0) / ms.length) : 0;
    });
    return row;
  });

  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

  return (
    <div className="space-y-5">
      <PageHeader title="Academic analytics" description="Marks entered by teachers roll up here instantly." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Subject performance</h3>
          <BarsChart data={subjectPerf} unit="%" />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Class averages across exams</h3>
          <MultiLineChart
            data={examTrend}
            lines={state.classes.map((c, i) => ({ key: c.id, label: c.name, color: colors[i % colors.length] || "#000" }))}
          />
        </div>
      </div>
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.students.map((st) => {
              const avg = s.averagePct(st.id);
              return (
                <TableRow key={st.id}>
                  <TableCell className="font-medium">{st.name}</TableCell>
                  <TableCell>{s.className(st.classId)}</TableCell>
                  <TableCell>{avg !== null ? `${avg}%` : "—"}</TableCell>
                  <TableCell>
                    {avg !== null ? (
                      <StatusBadge tone={avg >= 75 ? "success" : avg >= 50 ? "warning" : "destructive"}>{gradeFor(avg)}</StatusBadge>
                    ) : (
                      <StatusBadge>N/A</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell>{s.attendancePct(st.id)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FeesPage() {
  const { state, addFee, payFee } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: state.students[0]?.id ?? "",
    title: "Term 3 Tuition Fee",
    amount: 24000,
    dueDate: today(),
    status: "pending" as "pending" | "paid" | "overdue",
  });

  const collected = state.fees.reduce((t, f) => t + f.paidAmount, 0);
  const pending = state.fees.reduce((t, f) => t + (f.amount - f.paidAmount), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fees"
        description="Add or settle fees — parents see the change on their dashboard immediately."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Add fee</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add fee record</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <Field label="Student">
                  <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {state.students.map((st) => (
                        <SelectItem key={st.id} value={st.id}>{st.name} · {s.className(st.classId)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fee title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount (₹)">
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                  </Field>
                  <Field label="Due date">
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </Field>
                </div>
                <Field label="Payment status">
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    addFee(form, actor);
                    setOpen(false);
                    toast.success("Fee added", { description: "The parent has been notified." });
                  }}
                >
                  Save fee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected" value={inr(collected)} icon={Wallet} tone="success" />
        <StatCard label="Pending" value={inr(pending)} icon={Wallet} tone="warning" />
        <StatCard label="Collection rate" value={`${Math.round((collected / (collected + pending || 1)) * 100)}%`} icon={BarChart3} />
      </div>
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.fees.map((f) => {
              const st = state.students.find((x) => x.id === f.studentId);
              if (!st) return null;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{st.name}</TableCell>
                  <TableCell>{f.title}</TableCell>
                  <TableCell>{inr(f.amount)}</TableCell>
                  <TableCell>{inr(f.paidAmount)}</TableCell>
                  <TableCell>{prettyDate(f.dueDate)}</TableCell>
                  <TableCell><StatusBadge tone={feeTone(f.status)}>{f.status}</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    {f.paidAmount < f.amount ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          payFee(f.id, f.amount - f.paidAmount, "Recorded at office", actor);
                          toast.success("Marked as settled");
                        }}
                      >
                        Mark settled
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Cleared</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AnnouncementsPage() {
  const { state, publishAnnouncement } = useSchool();
  const actor = useActor();
  const [form, setForm] = useState({ title: "", body: "", audience: "all" as Audience, classId: state.classes[0]?.id ?? "" });

  return (
    <div className="space-y-5">
      <PageHeader title="Announcements" description="Published announcements create notifications for the selected audience." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">New announcement</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Message"><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            <Field label="Audience">
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as Audience })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="class">Specific class</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.audience === "class" ? (
              <Field label="Class">
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {state.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            <Button
              onClick={() => {
                if (!form.title.trim() || !form.body.trim()) {
                  toast.error("Add a title and a message");
                  return;
                }
                publishAnnouncement(
                  {
                    title: form.title,
                    body: form.body,
                    audience: form.audience,
                    ...(form.audience === "class" && form.classId ? { classId: form.classId } : {}),
                    authorName: actor.name,
                  },
                  actor,
                );
                setForm({ ...form, title: "", body: "" });
                toast.success("Announcement published");
              }}
            >
              <Megaphone className="size-4" /> Publish
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {state.announcements.map((a) => (
            <div key={a.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{a.title}</p>
                <StatusBadge tone="info">{a.audience === "class" ? `Class ${a.classId}` : a.audience}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.authorName} · {prettyDateTime(a.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  const { state } = useSchool();
  const s = useSelectors();
  const stats = useSchoolStats();

  return (
    <div className="space-y-5">
      <PageHeader title="Reports & analytics" description="Combined view of attendance, academics and finance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance today" value={`${stats.todayPct}%`} icon={CalendarCheck} tone="success" />
        <StatCard label="School average" value={stats.avg !== null ? `${stats.avg}%` : "No data"} icon={TrendingUp} />
        <StatCard label="Fees collected" value={inr(stats.collected)} icon={Wallet} tone="accent" />
        <StatCard label="Fees pending" value={inr(stats.pendingFees)} icon={Wallet} tone="warning" />
      </div>
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Average marks</TableHead>
              <TableHead>Pending fees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.classes.map((c) => {
              const studs = state.students.filter((st) => st.classId === c.id);
              const recs = state.attendance.filter((a) => a.classId === c.id);
              const pending = studs.reduce((t, st) => t + s.feeSummary(st.id).pending, 0);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{studs.length}</TableCell>
                  <TableCell>
                    {recs.length ? Math.round((recs.filter((r) => r.status !== "absent").length / recs.length) * 100) : 0}%
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const validStuds = studs.filter(st => s.averagePct(st.id) !== null);
                      return validStuds.length ? `${Math.round(validStuds.reduce((t, st) => t + s.averagePct(st.id)!, 0) / validStuds.length)}%` : "No data";
                    })()}
                  </TableCell>
                  <TableCell>{inr(pending)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function RiskList() {
  const { state } = useSchool();
  const insights = state.students
    .map((st) => computeRisk(st, state.attendance, state.marks, state.subjects))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {insights.map((r) => (
        <div key={r.studentId} className="surface-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{r.studentName}</p>
            <StatusBadge tone={r.level === "high" ? "destructive" : r.level === "medium" ? "warning" : "success"}>
              {r.level} risk · {r.score}/100
            </StatusBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
          {r.signals.length ? (
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {r.signals.map((sig) => <li key={sig}>{sig}</li>)}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function InsightsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Academic Risk Insight"
        description="Rule-based early-warning signals. The same interface can later be served by a trained model."
      />
      <div className="surface-card flex items-start gap-3 p-4">
        <Sparkles className="mt-0.5 size-4 text-accent" />
        <p className="text-sm text-muted-foreground">
          Signals used today: change in attendance between recent and earlier weeks, drop in subject scores between
          exams, and overall average. No predictions beyond these transparent rules.
        </p>
      </div>
      <RiskList />
    </div>
  );
}

function LogsPage() {
  const { state } = useSchool();
  const [q, setQ] = useState("");
  const rows = state.logs.filter((l) => (l.action + l.detail + l.actorName).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <PageHeader title="Activity logs" description="Every write action is recorded with actor, role and timestamp." />
      <Input placeholder="Search activity" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-sm" />
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 50).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{prettyDateTime(l.createdAt)}</TableCell>
                <TableCell className="font-medium">{l.actorName}</TableCell>
                <TableCell className="capitalize">{l.actorRole}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell className="text-muted-foreground">{l.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { state, resetDemoData } = useSchool();
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="School profile, security posture and demo controls." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">School profile</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <p className="text-muted-foreground">Name: <span className="text-foreground">Vidya Public School</span></p>
            <p className="text-muted-foreground">Academic year: <span className="text-foreground">2026–27</span></p>
            <p className="text-muted-foreground">Accounts: <span className="text-foreground">{state.users.length}</span></p>
            <p className="text-muted-foreground">Subjects: <span className="text-foreground">{state.subjects.map((x) => x.name).join(", ")}</span></p>
          </dl>
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Security</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Role-based access control on every workspace route</li>
            <li>• Session persisted per browser and cleared on sign out</li>
            <li>• URL tampering redirects users back to their own dashboard</li>
            <li>• Student records are only exposed to the linked parent, class teacher and admin</li>
            <li>• All write actions are captured in the audit log</li>
          </ul>
        </div>
      </div>
      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">Demo controls</h3>
        <p className="mt-1 text-sm text-muted-foreground">Restore the original demo story before a client presentation.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-3">Reset demo data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
              <AlertDialogDescription>
                Students, attendance, marks, fees and messages return to the original seeded story.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { resetDemoData(); toast.success("Demo data reset"); }}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function EditTeacherDialog({ teacher }: { teacher: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(teacher.name);
  const [phone, setPhone] = useState(teacher.phone || "");
  const [qual, setQual] = useState(teacher.qualification || "");
  const { updateTeacher } = useSchool();
  const actor = useActor();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon"><Pencil className="size-4 text-muted-foreground" /></Button>
      </DialogTrigger>
      <DialogContent>
         <DialogHeader><DialogTitle>Edit Teacher</DialogTitle><DialogDescription></DialogDescription></DialogHeader>
         <div className="grid gap-3">
           <Field label="Name"><Input value={name} onChange={e => setName(e.target.value)} /></Field>
           <Field label="Phone"><Input value={phone} onChange={e => setPhone(e.target.value)} /></Field>
           <Field label="Qualification"><Input value={qual} onChange={e => setQual(e.target.value)} /></Field>
         </div>
         <DialogFooter>
           <Button onClick={() => { updateTeacher(teacher.id, { name, phone, qualification: qual }, actor); setOpen(false); }}>Save changes</Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditClassDialog({ classInfo }: { classInfo: any }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(classInfo.grade);
  const [section, setSection] = useState(classInfo.section);
  const [room, setRoom] = useState(classInfo.room || "");
  const { updateClass } = useSchool();
  const actor = useActor();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="size-4 text-muted-foreground" /></Button>
      </DialogTrigger>
      <DialogContent>
         <DialogHeader><DialogTitle>Edit Class</DialogTitle><DialogDescription></DialogDescription></DialogHeader>
         <div className="grid gap-3">
           <Field label="Grade"><Input value={grade} onChange={e => setGrade(e.target.value)} /></Field>
           <Field label="Section"><Input value={section} onChange={e => setSection(e.target.value.toUpperCase())} /></Field>
           <Field label="Room"><Input value={room} onChange={e => setRoom(e.target.value)} /></Field>
         </div>
         <DialogFooter>
           <Button onClick={() => { updateClass(classInfo.id, { grade, section, room }, actor); setOpen(false); }}>Save changes</Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
