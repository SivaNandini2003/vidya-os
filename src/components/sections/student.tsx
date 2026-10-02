import { Bell, CalendarCheck, CalendarDays, FileText, Megaphone, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, attendanceTone, feeTone } from "@/components/common/StatusBadge";
import { BarsChart, TrendChart } from "@/components/charts/Charts";
import { StudentDigitalProfile, attendanceSeries } from "@/components/student/StudentDigitalProfile";
import { gradeFor, inr, useSchool, useSelectors } from "@/lib/school-store";
import { greeting, prettyDate, prettyDateTime, today } from "@/lib/dates";

function useMe() {
  const { state, currentUser } = useSchool();
  const student = state.students.find((st) => st.id === currentUser?.linkedId);
  return student;
}

export function StudentSection({ section }: { section: string }) {
  const student = useMe();
  if (!student) return <EmptyState title="Student record not found" description="Contact the school office." />;

  switch (section) {
    case "profile":
      return <StudentDigitalProfile studentId={student.id} />;
    case "attendance":
      return <AttendancePage studentId={student.id} />;
    case "results":
      return <ResultsPage studentId={student.id} />;
    case "assignments":
      return <AssignmentsPage studentId={student.id} />;
    case "exams":
      return <ExamsPage studentId={student.id} />;
    case "fees":
      return <FeesPage studentId={student.id} />;
    case "announcements":
      return <AnnouncementsPage studentId={student.id} />;
    case "notifications":
      return <NotificationsPage />;
    default:
      return <Dashboard studentId={student.id} />;
  }
}

function Dashboard({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const student = state.students.find((st) => st.id === studentId)!;
  const cls = state.classes.find((c) => c.id === student.classId);
  const status = s.todayStatus(studentId);
  const pct = s.attendancePct(studentId);
  const avg = s.averagePct(studentId);
  const marks = s.studentMarks(studentId).slice(-4).reverse();
  const assignments = s.studentAssignments(studentId);
  const pending = assignments.filter((a) => !a.completedBy.includes(studentId));
  const exams = state.exams.filter((e) => e.classId === student.classId && e.date >= today());
  const announcements = s.announcementsFor("student", student.classId).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${student.name.split(" ")[0]}`}
        description={`${student.id} · Class ${cls?.name} · Class teacher ${s.teacherName(cls?.classTeacherId ?? "")}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today"
          value={status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not marked"}
          icon={CalendarCheck}
          tone={status === "absent" ? "destructive" : status === "late" ? "warning" : "success"}
        />
        <StatCard label="Attendance" value={`${pct}%`} icon={TrendingUp} tone={pct >= 85 ? "success" : "warning"} />
        <StatCard label="Average score" value={avg !== null ? `${avg}% · ${gradeFor(avg)}` : "No data"} icon={TrendingUp} tone="accent" />
        <StatCard label="Pending assignments" value={pending.length} icon={FileText} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Attendance trend</h3>
          <TrendChart data={attendanceSeries(s.studentAttendance(studentId))} />
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Recent marks</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {marks.map((m) => (
              <li key={m.id} className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0">
                <span>{s.subjectName(m.subjectId)} · {m.examName}</span>
                <span className="font-medium">{m.score}/100</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Pending assignments</h3>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing pending. Nice work.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {pending.map((a) => (
                <li key={a.id} className="rounded-lg border border-border p-2.5">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{s.subjectName(a.subjectId)} · due {prettyDate(a.dueDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Upcoming exams</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {exams.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0">
                <span>{s.subjectName(e.subjectId)}</span>
                <span className="text-xs text-muted-foreground">{prettyDate(e.date)} · {e.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Announcements</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-2.5">
                <p className="font-medium">{a.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AttendancePage({ studentId }: { studentId: string }) {
  const s = useSelectors();
  const records = s.studentAttendance(studentId);
  const pct = s.attendancePct(studentId);
  return (
    <div className="space-y-5">
      <PageHeader title="My attendance" description="Updated the moment your teacher saves the register." />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Overall" value={`${pct}%`} icon={CalendarCheck} tone={pct >= 85 ? "success" : "warning"} />
        <StatCard label="Present" value={records.filter((r) => r.status === "present").length} icon={CalendarCheck} />
        <StatCard label="Late" value={records.filter((r) => r.status === "late").length} icon={CalendarCheck} tone="warning" />
        <StatCard label="Absent" value={records.filter((r) => r.status === "absent").length} icon={CalendarCheck} tone="destructive" />
      </div>
      <div className="surface-card p-5">
        <Progress value={pct} />
        <div className="mt-4"><TrendChart data={attendanceSeries(records)} /></div>
      </div>
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...records].reverse().slice(0, 20).map((r) => (
              <TableRow key={r.id}>
                <TableCell>{prettyDate(r.date)}</TableCell>
                <TableCell className="text-muted-foreground">{r.period}</TableCell>
                <TableCell><StatusBadge tone={attendanceTone(r.status)}>{r.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ResultsPage({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const marks = s.studentMarks(studentId);
  const avg = s.averagePct(studentId);
  const subjectPerf = state.subjects.map((sub) => {
    const ms = marks.filter((m) => m.subjectId === sub.id);
    if (!ms.length) return null;
    return { name: sub.code, value: Math.round(ms.reduce((t, m) => t + m.score, 0) / ms.length) };
  }).filter((x) => x !== null) as { name: string; value: number }[];

  return (
    <div className="space-y-5">
      <PageHeader title="My results" description="Subject-wise marks, totals and grades." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average" value={avg !== null ? `${avg}%` : "No data"} icon={TrendingUp} tone="accent" />
        <StatCard label="Grade" value={avg !== null ? gradeFor(avg) : "N/A"} icon={TrendingUp} tone="success" />
        <StatCard label="Total marks" value={`${marks.reduce((t, m) => t + m.score, 0)}/${marks.reduce((t, m) => t + m.maxScore, 0)}`} icon={TrendingUp} />
      </div>
      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">Subject performance</h3>
        <BarsChart data={subjectPerf} unit="%" />
      </div>
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.subjects.flatMap((sub) => {
              const subMarks = marks.filter((m) => m.subjectId === sub.id);
              if (!subMarks.length) {
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                  </TableRow>
                );
              }
              return subMarks.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{s.subjectName(m.subjectId)}</TableCell>
                  <TableCell>{m.examName}</TableCell>
                  <TableCell>{m.score}/{m.maxScore}</TableCell>
                  <TableCell><StatusBadge tone={m.score >= 75 ? "success" : m.score >= 50 ? "warning" : "destructive"}>{gradeFor(m.score)}</StatusBadge></TableCell>
                  <TableCell className="text-muted-foreground">{prettyDate(m.date)}</TableCell>
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AssignmentsPage({ studentId }: { studentId: string }) {
  const s = useSelectors();
  const { toggleAssignmentDone } = useSchool();
  const assignments = s.studentAssignments(studentId);

  return (
    <div className="space-y-5">
      <PageHeader title="Assignments" description="Mark work as submitted — your teacher sees the count update." />
      {assignments.length === 0 ? (
        <EmptyState title="No assignments yet" />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const done = a.completedBy.includes(studentId);
            return (
              <div key={a.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.subjectName(a.subjectId)} · {s.teacherName(a.teacherId)} · due {prettyDate(a.dueDate)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={done ? "success" : a.dueDate < today() ? "destructive" : "warning"}>
                    {done ? "Completed" : a.dueDate < today() ? "Overdue" : "Pending"}
                  </StatusBadge>
                  <Button
                    size="sm"
                    variant={done ? "outline" : "default"}
                    onClick={() => {
                      toggleAssignmentDone(a.id, studentId, !done);
                      toast.success(done ? "Marked as pending" : "Marked as submitted");
                    }}
                  >
                    {done ? "Undo" : "Mark submitted"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExamsPage({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const student = state.students.find((st) => st.id === studentId)!;
  const exams = state.exams.filter((e) => e.classId === student.classId);
  return (
    <div className="space-y-5">
      <PageHeader title="Exam schedule" description={`Class ${s.className(student.classId)} · Term 2 examinations`} />
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{s.subjectName(e.subjectId)}</TableCell>
                <TableCell>{e.title}</TableCell>
                <TableCell>{prettyDate(e.date)}</TableCell>
                <TableCell>{e.time}</TableCell>
                <TableCell>{e.room}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FeesPage({ studentId }: { studentId: string }) {
  const s = useSelectors();
  const fees = s.feeSummary(studentId);
  return (
    <div className="space-y-5">
      <PageHeader title="Fees" description="Fee status maintained by the school office." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={inr(fees.total)} icon={Wallet} />
        <StatCard label="Paid" value={inr(fees.paid)} icon={Wallet} tone="success" />
        <StatCard label="Pending" value={inr(fees.pending)} icon={Wallet} tone={fees.pending ? "warning" : "success"} />
      </div>
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fee</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.records.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.title}</TableCell>
                <TableCell>{inr(f.amount)}</TableCell>
                <TableCell>{inr(f.paidAmount)}</TableCell>
                <TableCell>{prettyDate(f.dueDate)}</TableCell>
                <TableCell><StatusBadge tone={feeTone(f.status)}>{f.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AnnouncementsPage({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const student = state.students.find((st) => st.id === studentId)!;
  const list = s.announcementsFor("student", student.classId);
  return (
    <div className="space-y-5">
      <PageHeader title="Announcements" description="School-wide and class notices." />
      {list.length === 0 ? (
        <EmptyState title="No announcements yet" />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{a.title}</p>
                <StatusBadge tone="info"><Megaphone className="size-3" /> {a.audience}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.authorName} · {prettyDateTime(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { currentUser, markAllNotificationsRead, markNotificationRead } = useSchool();
  const s = useSelectors();
  const list = s.notificationsFor(currentUser!.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Attendance, results, fees, assignments and messages in one place."
        actions={
          <Button variant="outline" onClick={() => markAllNotificationsRead(currentUser!.id)}>
            <Bell className="size-4" /> Mark all read
          </Button>
        }
      />
      {list.length === 0 ? (
        <EmptyState title="Nothing here yet" description="New updates will appear as they happen." />
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const unread = !n.readBy.includes(currentUser!.id);
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id, currentUser!.id)}
                className={`surface-card block w-full p-4 text-left ${unread ? "border-accent/50" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{n.title}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="muted">{n.type}</StatusBadge>
                    <StatusBadge tone={unread ? "info" : "muted"}>{unread ? "Unread" : "Read"}</StatusBadge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 inline size-3" />
                  {prettyDateTime(n.createdAt)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
