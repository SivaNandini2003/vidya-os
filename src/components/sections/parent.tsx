import { useState } from "react";
import { CalendarCheck, CalendarDays, CreditCard, FileText, Megaphone, MessageSquare, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PageHeader, EmptyState } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, attendanceTone, feeTone } from "@/components/common/StatusBadge";
import { BarsChart, TrendChart } from "@/components/charts/Charts";
import { StudentAvatar, StudentDigitalProfile, attendanceSeries } from "@/components/student/StudentDigitalProfile";
import { NotificationsPage } from "@/components/sections/student";
import { gradeFor, inr, useActor, useSchool, useSelectors } from "@/lib/school-store";
import { greeting, prettyDate, prettyDateTime, today } from "@/lib/dates";

function useChildren() {
  const { state, currentUser } = useSchool();
  return state.students.filter((st) => st.parentId === currentUser?.linkedId);
}

export function ParentSection({ section }: { section: string }) {
  const children = useChildren();
  const child = children[0];
  if (!child) return <EmptyState title="No child linked to this account" description="Contact the school office." />;

  switch (section) {
    case "child":
      return <StudentDigitalProfile studentId={child.id} />;
    case "attendance":
      return <AttendancePage studentId={child.id} />;
    case "performance":
      return <PerformancePage studentId={child.id} />;
    case "assignments":
      return <AssignmentsPage studentId={child.id} />;
    case "fees":
      return <FeesPage studentId={child.id} />;
    case "exams":
      return <ExamsPage studentId={child.id} />;
    case "messages":
      return <MessagesPage studentId={child.id} />;
    case "announcements":
      return <AnnouncementsPage studentId={child.id} />;
    case "notifications":
      return <NotificationsPage />;
    default:
      return <Dashboard studentId={child.id} />;
  }
}

function Dashboard({ studentId }: { studentId: string }) {
  const { state, currentUser } = useSchool();
  const s = useSelectors();
  const child = state.students.find((st) => st.id === studentId)!;
  const cls = state.classes.find((c) => c.id === child.classId);
  const status = s.todayStatus(studentId);
  const pct = s.attendancePct(studentId);
  const avg = s.averagePct(studentId);
  const fees = s.feeSummary(studentId);
  const assignments = s.studentAssignments(studentId).filter((a) => !a.completedBy.includes(studentId));
  const exams = state.exams.filter((e) => e.classId === child.classId && e.date >= today()).slice(0, 4);
  const messages = state.messages.filter((m) => m.studentId === studentId).slice(-3).reverse();
  const announcements = s.announcementsFor("parent", child.classId).slice(0, 3);
  const marks = s.studentMarks(studentId).slice(-4).reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${currentUser?.name.split(" ")[0]}`}
        description="Everything about your child's school day, in one screen."
      />

      <div className="surface-card overflow-hidden">
        <div className="hero-mesh flex flex-col gap-4 p-5 text-sidebar-foreground sm:flex-row sm:items-center">
          <StudentAvatar name={child.name} color={child.avatarColor} size="lg" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-sidebar-accent-foreground">{child.name}</h2>
            <p className="text-sm text-sidebar-foreground/80">
              {child.id} · Class {cls?.name} · Class teacher {s.teacherName(cls?.classTeacherId ?? "")}
            </p>
          </div>
          <StatusBadge tone={attendanceTone(status)}>
            {status === "absent"
              ? `${child.name.split(" ")[0]} was absent today`
              : status
                ? `${child.name.split(" ")[0]} is ${status} today`
                : "Attendance not marked yet"}
          </StatusBadge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value={`${pct}%`} icon={CalendarCheck} tone={pct >= 85 ? "success" : "warning"} />
        <StatCard label="Average score" value={avg !== null ? `${avg}% · ${gradeFor(avg)}` : "No data"} icon={TrendingUp} tone="accent" />
        <StatCard label="Pending assignments" value={assignments.length} icon={FileText} tone="warning" />
        <StatCard
          label="Pending fees"
          value={inr(fees.pending)}
          icon={Wallet}
          tone={fees.pending ? "warning" : "success"}
        />
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
          {assignments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">All assignments submitted.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {assignments.map((a) => (
                <li key={a.id} className="rounded-lg border border-border p-2.5">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">due {prettyDate(a.dueDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Upcoming exams</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0">
                <span>{s.subjectName(e.subjectId)}</span>
                <span className="text-xs text-muted-foreground">{prettyDate(e.date)} · {e.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Teacher messages</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((m) => (
                <li key={m.id} className="rounded-lg border border-border p-2.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {m.fromRole === "teacher" ? s.teacherName(m.teacherId) : "You"}
                  </p>
                  <p className="line-clamp-2 text-sm">{m.body}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">School announcements</h3>
        <ul className="mt-3 space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="border-b border-border/70 pb-3 last:border-0">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
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
      <PageHeader title="Attendance" description="Daily register as recorded by the class teacher." />
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
              <TableHead>Status</TableHead>
              <TableHead>Marked by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...records].reverse().slice(0, 20).map((r) => (
              <TableRow key={r.id}>
                <TableCell>{prettyDate(r.date)}</TableCell>
                <TableCell><StatusBadge tone={attendanceTone(r.status)}>{r.status}</StatusBadge></TableCell>
                <TableCell className="text-muted-foreground">{s.teacherName(r.markedByTeacherId)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PerformancePage({ studentId }: { studentId: string }) {
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
      <PageHeader title="Academic performance" description="Marks published by subject teachers." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average" value={avg !== null ? `${avg}%` : "No data"} icon={TrendingUp} tone="accent" />
        <StatCard label="Grade" value={avg !== null ? gradeFor(avg) : "N/A"} icon={TrendingUp} tone="success" />
        <StatCard label="Assessments" value={marks.length} icon={TrendingUp} />
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
              <TableHead>Teacher</TableHead>
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
                  <TableCell className="text-muted-foreground">{s.teacherName(m.enteredByTeacherId)}</TableCell>
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
  const assignments = s.studentAssignments(studentId);
  return (
    <div className="space-y-5">
      <PageHeader title="Assignments" description="What your child has been given and what is still pending." />
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
                </div>
                <StatusBadge tone={done ? "success" : a.dueDate < today() ? "destructive" : "warning"}>
                  {done ? "Submitted" : a.dueDate < today() ? "Overdue" : "Pending"}
                </StatusBadge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeesPage({ studentId }: { studentId: string }) {
  const s = useSelectors();
  const { payFee } = useSchool();
  const actor = useActor();
  const fees = s.feeSummary(studentId);
  const [payId, setPayId] = useState<string | null>(null);
  const payTarget = fees.records.find((f) => f.id === payId);

  return (
    <div className="space-y-5">
      <PageHeader title="Fees" description="Simulated payment flow — ready for a real gateway later." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total fee" value={inr(fees.total)} icon={Wallet} />
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
              <TableHead className="text-right">Action</TableHead>
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
                <TableCell className="text-right">
                  {f.paidAmount < f.amount ? (
                    <Dialog open={payId === f.id} onOpenChange={(o) => setPayId(o ? f.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm"><CreditCard className="size-4" /> Pay now</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pay {payTarget?.title}</DialogTitle>
                          <DialogDescription>
                            Demo payment. In production this opens your school's payment gateway.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-medium">{inr((payTarget?.amount ?? 0) - (payTarget?.paidAmount ?? 0))}</span></div>
                          <Input readOnly value="UPI · demo@vidyaos" className="bg-muted" />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPayId(null)}>Cancel</Button>
                          <Button
                            onClick={() => {
                              payFee(f.id, f.amount - f.paidAmount, "UPI (demo)", actor);
                              setPayId(null);
                              toast.success("Payment successful", { description: "Receipt added to payment history." });
                            }}
                          >
                            Pay {inr(f.amount - f.paidAmount)}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-xs text-muted-foreground">Cleared</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">Payment history</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {fees.records.flatMap((f) => f.payments.map((p) => ({ ...p, title: f.title }))).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            fees.records
              .flatMap((f) => f.payments.map((p) => ({ ...p, title: f.title })))
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2 last:border-0">
                  <span>{p.title} · <span className="text-muted-foreground">{p.method}</span></span>
                  <span className="text-muted-foreground">{prettyDate(p.date)} · {p.reference}</span>
                  <span className="font-medium">{inr(p.amount)}</span>
                </li>
              ))
          )}
        </ul>
      </div>
    </div>
  );
}

function ExamsPage({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const child = state.students.find((st) => st.id === studentId)!;
  const exams = state.exams.filter((e) => e.classId === child.classId);
  return (
    <div className="space-y-5">
      <PageHeader title="Upcoming exams" description={`Class ${s.className(child.classId)} examination schedule`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {exams.map((e) => (
          <div key={e.id} className="surface-card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{s.subjectName(e.subjectId)}</p>
              <p className="text-xs text-muted-foreground">{e.title} · {e.room}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{prettyDate(e.date)}</p>
              <p className="text-xs text-muted-foreground"><CalendarDays className="mr-1 inline size-3" />{e.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesPage({ studentId }: { studentId: string }) {
  const { state, sendMessage, markMessagesRead, currentUser } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const child = state.students.find((st) => st.id === studentId)!;
  const cls = state.classes.find((c) => c.id === child.classId);
  const teacherIds = Array.from(
    new Set([cls?.classTeacherId, ...(cls?.subjectTeachers ?? []).map((t) => t.teacherId)].filter(Boolean) as string[]),
  );
  const [teacherId, setTeacherId] = useState(teacherIds[0] ?? "");
  const [body, setBody] = useState("");
  const threadKey = `${teacherId}::${currentUser?.linkedId}::${studentId}`;
  const thread = state.messages.filter((m) => m.threadKey === threadKey);

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Talk directly to your child's teachers." />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="surface-card divide-y divide-border">
          {teacherIds.map((id) => {
            const unread = state.messages.filter(
              (m) => m.teacherId === id && m.studentId === studentId && m.fromRole === "teacher" && !m.read,
            ).length;
            return (
              <button
                key={id}
                onClick={() => {
                  setTeacherId(id);
                  markMessagesRead(`${id}::${currentUser?.linkedId}::${studentId}`, "parent");
                }}
                className={`flex w-full items-center justify-between gap-2 p-3 text-left ${teacherId === id ? "bg-muted" : "hover:bg-muted/60"}`}
              >
                <span>
                  <span className="block text-sm font-medium">{s.teacherName(id)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {id === cls?.classTeacherId ? "Class teacher" : "Subject teacher"}
                  </span>
                </span>
                {unread ? <StatusBadge tone="destructive">{unread}</StatusBadge> : null}
              </button>
            );
          })}
        </div>
        <div className="surface-card flex min-h-[420px] flex-col p-4">
          <p className="text-sm font-semibold">{s.teacherName(teacherId)} · about {child.name}</p>
          <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
            {thread.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              thread.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-xl p-3 text-sm ${
                    m.fromRole === "parent" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p>{m.body}</p>
                  <p className="mt-1 text-[11px] opacity-70">{prettyDateTime(m.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Reply to the teacher…" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button
              onClick={async () => {
                if (!body.trim() || !currentUser?.linkedId) return;
                try {
                  await sendMessage(
                    { teacherId, parentId: currentUser.linkedId, studentId, fromRole: "parent", body },
                    actor,
                  );
                  setBody("");
                  toast.success("Reply sent");
                } catch (e: any) {
                  toast.error(e.message || "Failed to send message");
                }
              }}
            >
              <MessageSquare className="size-4" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsPage({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const child = state.students.find((st) => st.id === studentId)!;
  const list = s.announcementsFor("parent", child.classId);
  return (
    <div className="space-y-5">
      <PageHeader title="Announcements" description="Notices from the school office and class teachers." />
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
