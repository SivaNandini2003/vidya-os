import { useMemo } from "react";
import { CalendarCheck, GraduationCap, Mail, MapPin, Phone, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, attendanceTone, feeTone } from "@/components/common/StatusBadge";
import { TrendChart, BarsChart } from "@/components/charts/Charts";
import { gradeFor, inr, useSchool, useSelectors } from "@/lib/school-store";
import { prettyDate, shortDate } from "@/lib/dates";
import { computeRisk } from "@/lib/insights";

export function StudentAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const cls = size === "lg" ? "size-16 text-lg" : size === "sm" ? "size-8 text-xs" : "size-11 text-sm";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-primary-foreground ${cls}`}
      style={{ backgroundColor: color }}
    >
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}

export function attendanceSeries(records: { date: string; status: string }[], buckets = 6) {
  const validRecords = records.filter(c => c.status && c.status.trim() !== "");
  if (!validRecords.length) return [];
  const size = Math.max(1, Math.ceil(validRecords.length / buckets));
  const out: { name: string; value: number }[] = [];
  for (let i = 0; i < validRecords.length; i += size) {
    const chunk = validRecords.slice(i, i + size);
    const pct = Math.round((chunk.filter((c) => c.status !== "absent").length / chunk.length) * 100);
    out.push({ name: shortDate(chunk[chunk.length - 1]?.date ?? ""), value: pct });
  }
  return out;
}

export function StudentDigitalProfile({ studentId }: { studentId: string }) {
  const { state } = useSchool();
  const s = useSelectors();
  const student = state.students.find((x) => x.id === studentId);
  const risk = useMemo(
    () => (student ? computeRisk(student, state.attendance, state.marks, state.subjects) : null),
    [student, state.attendance, state.marks, state.subjects],
  );

  if (!student) return <p className="text-sm text-muted-foreground">Student not found.</p>;

  const cls = state.classes.find((c) => c.id === student.classId);
  const parent = state.parents.find((p) => p.id === student.parentId);
  const attendance = s.studentAttendance(student.id);
  const marks = s.studentMarks(student.id);
  const fees = s.feeSummary(student.id);
  const assignments = s.studentAssignments(student.id);
  const pct = s.attendancePct(student.id);
  const avg = s.averagePct(student.id);
  const todayStatus = s.todayStatus(student.id);

  const subjectPerf = state.subjects.map((sub) => {
    const ms = marks.filter((m) => m.subjectId === sub.id);
    if (!ms.length) return null;
    return {
      name: sub.code,
      value: Math.round(ms.reduce((t, m) => t + (m.score / m.maxScore) * 100, 0) / ms.length),
    };
  }).filter((x) => x !== null) as { name: string; value: number }[];

  const threads = state.messages.filter((m) => m.studentId === student.id);
  const announcements = s.announcementsFor("student", student.classId);

  return (
    <div className="space-y-5">
      <div className="surface-card overflow-hidden">
        <div className="hero-mesh flex flex-col gap-4 p-5 text-sidebar-foreground sm:flex-row sm:items-center">
          <StudentAvatar name={student.name} color={student.avatarColor} size="lg" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-sidebar-accent-foreground">{student.name}</h2>
            <p className="text-sm text-sidebar-foreground/80">
              {student.id} · Class {cls?.name} · Roll {student.rollNo} · Class teacher {s.teacherName(cls?.classTeacherId ?? "")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={attendanceTone(todayStatus)}>
              Today: {todayStatus ? todayStatus : "not marked"}
            </StatusBadge>
            <StatusBadge tone={pct >= 85 ? "success" : pct >= 75 ? "warning" : "destructive"}>
              Attendance {pct}%
            </StatusBadge>
            <StatusBadge tone="info">
              Average {avg !== null ? `${avg}% · ${gradeFor(avg)}` : "No data"}
            </StatusBadge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-semibold">Basic information</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Student ID" value={student.id} />
              <Row label="Date of birth" value={prettyDate(student.dob)} />
              <Row label="Gender" value={student.gender} />
              <Row label="Admitted" value={prettyDate(student.admissionDate)} />
              <Row label="Email" value={student.email} icon={<Mail className="size-3.5" />} />
              <Row label="Phone" value={student.phone} icon={<Phone className="size-3.5" />} />
              <Row label="Address" value={student.address} icon={<MapPin className="size-3.5" />} />
            </dl>
          </div>
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-semibold">Academic & family links</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Class / Section" value={`${cls?.grade} / ${cls?.section}`} icon={<GraduationCap className="size-3.5" />} />
              <Row label="Class teacher" value={s.teacherName(cls?.classTeacherId ?? "")} />
              <Row label="Classroom" value={cls?.room ?? "—"} />
              <Row
                label="Subjects"
                value={(cls?.subjectTeachers ?? []).map((st) => s.subjectName(st.subjectId)).join(", ") || "—"}
              />
              <Row label="Parent / Guardian" value={`${parent?.name} (${parent?.relation})`} />
              <Row label="Parent contact" value={`${parent?.phone} · ${parent?.email}`} />
            </dl>
            {risk ? (
              <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Academic Risk Insight (rule-based)
                </p>
                <p className="mt-1 text-sm">{risk.summary}</p>
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="surface-card p-5">
              <h3 className="font-display text-sm font-semibold">Attendance trend</h3>
              <div className="mt-3">
                <TrendChart data={attendanceSeries(attendance)} />
              </div>
            </div>
            <div className="surface-card p-5">
              <h3 className="font-display text-sm font-semibold">Summary</h3>
              <p className="mt-3 font-display text-3xl font-semibold">{pct}%</p>
              <Progress value={pct} className="mt-2" />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <Mini label="Present" value={attendance.filter((a) => a.status === "present").length} />
                <Mini label="Late" value={attendance.filter((a) => a.status === "late").length} />
                <Mini label="Absent" value={attendance.filter((a) => a.status === "absent").length} />
              </div>
            </div>
          </div>
          <div className="surface-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marked by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...attendance].reverse().slice(0, 15).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{prettyDate(a.date)}</TableCell>
                    <TableCell className="text-muted-foreground">{a.period}</TableCell>
                    <TableCell>
                      <StatusBadge tone={attendanceTone(a.status)}>{a.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.teacherName(a.markedByTeacherId)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="surface-card p-5">
              <h3 className="font-display text-sm font-semibold">Subject performance</h3>
              <div className="mt-3">
                <BarsChart data={subjectPerf} unit="%" />
              </div>
            </div>
            <div className="surface-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Entered by</TableHead>
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
                    return subMarks.map((m) => {
                      const p = Math.round((m.score / m.maxScore) * 100);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{s.subjectName(m.subjectId)}</TableCell>
                          <TableCell className="text-muted-foreground">{m.examName}</TableCell>
                          <TableCell>
                            {m.score}/{m.maxScore}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={p >= 75 ? "success" : p >= 50 ? "warning" : "destructive"}>
                              {gradeFor(p)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.teacherName(m.enteredByTeacherId)}</TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-3">
          {assignments.length === 0 ? (
            <p className="surface-card p-8 text-center text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            assignments.map((a) => {
              const done = a.completedBy.includes(student.id);
              return (
                <div key={a.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.subjectName(a.subjectId)} · {s.teacherName(a.teacherId)} · due {prettyDate(a.dueDate)}
                    </p>
                  </div>
                  <StatusBadge tone={done ? "success" : "warning"}>{done ? "Completed" : "Pending"}</StatusBadge>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="fees" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniCard label="Total fee" value={inr(fees.total)} icon={<Wallet className="size-4" />} />
            <MiniCard label="Paid" value={inr(fees.paid)} icon={<CalendarCheck className="size-4" />} />
            <MiniCard label="Pending" value={inr(fees.pending)} icon={<Wallet className="size-4" />} />
          </div>
          <div className="surface-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due date</TableHead>
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
                    <TableCell>
                      <StatusBadge tone={feeTone(f.status)}>{f.status}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-semibold">Teacher ↔ parent messages</h3>
            <div className="mt-3 space-y-3">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                threads.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {m.fromRole === "teacher" ? s.teacherName(m.teacherId) : "Parent"} · {prettyDate(m.createdAt.slice(0, 10))}
                    </p>
                    <p className="mt-1 text-sm">{m.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="surface-card p-5">
            <h3 className="font-display text-sm font-semibold">Announcements</h3>
            <div className="mt-3 space-y-3">
              {announcements.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-2 last:border-0">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="surface-card p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1.5 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
