import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, FileText, GraduationCap, Megaphone, MessageSquare, Save, School, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, EmptyState } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, attendanceTone } from "@/components/common/StatusBadge";
import { StudentAvatar, StudentDigitalProfile } from "@/components/student/StudentDigitalProfile";
import { gradeFor, useActor, useSchool, useSelectors } from "@/lib/school-store";
import { addDays, prettyDate, prettyDateTime, today } from "@/lib/dates";
import { computeRisk } from "@/lib/insights";
import type { AttendanceStatus } from "@/types";

function useTeacherScope() {
  const { state, currentUser } = useSchool();
  const teacher = state.teachers.find((t) => t.id === currentUser?.linkedId);
  const classes = state.classes.filter(
    (c) => teacher && (teacher.classIds.includes(c.id) || c.classTeacherId === teacher.id),
  );
  const students = state.students.filter((st) => classes.some((c) => c.id === st.classId));
  return { teacher, classes, students };
}

export function TeacherSection({ section }: { section: string }) {
  switch (section) {
    case "classes":
      return <MyClasses />;
    case "students":
      return <StudentsPage />;
    case "attendance":
      return <AttendancePage />;
    case "marks":
      return <MarksPage />;
    case "assignments":
      return <AssignmentsPage />;
    case "messages":
      return <MessagesPage />;
    case "announcements":
      return <AnnouncementsPage />;
    case "insights":
      return <InsightsPage />;
    default:
      return <TeacherDashboard />;
  }
}

function TeacherDashboard() {
  const { state } = useSchool();
  const s = useSelectors();
  const { teacher, classes, students } = useTeacherScope();
  const todayRecords = state.attendance.filter(
    (a) => a.date === today() && classes.some((c) => c.id === a.classId),
  );
  const present = todayRecords.filter((r) => r.status !== "absent").length;
  const pendingAssignments = state.assignments.filter(
    (a) => a.teacherId === teacher?.id && a.dueDate >= today(),
  );
  const alerts = students
    .map((st) => computeRisk(st, state.attendance, state.marks, state.subjects))
    .filter((r) => r.level !== "low");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${teacher?.name ?? "Teacher"}`}
        description="Only the classes and students assigned to you are visible here."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned classes" value={classes.length} icon={School} />
        <StatCard label="Students" value={students.length} icon={GraduationCap} tone="accent" />
        <StatCard
          label="Today's attendance"
          value={todayRecords.length ? `${Math.round((present / todayRecords.length) * 100)}%` : "Not marked"}
          hint={todayRecords.length ? `${present}/${todayRecords.length} present` : "Register pending"}
          icon={CalendarCheck}
          tone={todayRecords.length ? "success" : "warning"}
        />
        <StatCard label="Open assignments" value={pendingAssignments.length} icon={FileText} tone="warning" />
      </div>

      <div className="surface-card p-5">
        <h3 className="font-display text-sm font-semibold">Quick actions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickLink section="attendance" icon={<CalendarCheck className="size-4" />} label="Mark attendance" />
          <QuickLink section="marks" icon={<ClipboardList className="size-4" />} label="Enter marks" />
          <QuickLink section="assignments" icon={<FileText className="size-4" />} label="Create assignment" />
          <QuickLink section="announcements" icon={<Megaphone className="size-4" />} label="Send announcement" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Student performance alerts</h3>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No students need attention right now.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {alerts.map((a) => (
                <li key={a.studentId} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{a.studentName}</p>
                    <StatusBadge tone={a.level === "high" ? "destructive" : "warning"}>{a.level} risk</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">Recent marks entered</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {state.marks
              .filter((m) => m.enteredByTeacherId === teacher?.id)
              .slice(-6)
              .reverse()
              .map((m) => (
                <li key={m.id} className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0">
                  <span>
                    {state.students.find((st) => st.id === m.studentId)?.name} · {s.subjectName(m.subjectId)}
                  </span>
                  <span className="font-medium">{m.score}/100</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ section, label, icon }: { section: string; label: string; icon: React.ReactNode }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to="/app/$section" params={{ section }}>
        {icon} {label}
      </Link>
    </Button>
  );
}

function MyClasses() {
  const { state } = useSchool();
  const s = useSelectors();
  const { classes } = useTeacherScope();
  return (
    <div className="space-y-5">
      <PageHeader title="My classes" description="Classes where you are the class teacher or a subject teacher." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => {
          const studs = state.students.filter((st) => st.classId === c.id);
          return (
            <div key={c.id} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Class {c.name}</h3>
                <StatusBadge tone="info">{studs.length} students</StatusBadge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.room}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Class teacher: <span className="text-foreground">{s.teacherName(c.classTeacherId)}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.subjectTeachers.map((st) => (
                  <StatusBadge key={st.subjectId} tone="muted">{s.subjectName(st.subjectId)}</StatusBadge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudentsPage() {
  const s = useSelectors();
  const { students } = useTeacherScope();
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setSelected(null)}>← Back to students</Button>
        <StudentDigitalProfile studentId={selected} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="My students" description="You can only view students in your assigned classes." />
      {students.length === 0 ? (
        <EmptyState title="No students assigned yet" />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Today</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Average</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((st) => (
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
                  <TableCell>{s.className(st.classId)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={attendanceTone(s.todayStatus(st.id))}>{s.todayStatus(st.id) ?? "not marked"}</StatusBadge>
                  </TableCell>
                  <TableCell>{s.attendancePct(st.id)}%</TableCell>
                  <TableCell>
                    {s.averagePct(st.id) !== null 
                      ? `${s.averagePct(st.id)}% · ${gradeFor(s.averagePct(st.id)!)}` 
                      : "No data"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(st.id)}>Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AttendancePage() {
  const { state, saveAttendance } = useSchool();
  const actor = useActor();
  const { teacher, classes } = useTeacherScope();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const students = state.students.filter((st) => st.classId === classId);

  const existing = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    state.attendance
      .filter((a) => a.classId === classId && a.date === date)
      .forEach((a) => (map[a.studentId] = a.status));
    return map;
  }, [state.attendance, classId, date]);

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const key = `${classId}-${date}`;
  const [loadedKey, setLoadedKey] = useState(key);
  if (loadedKey !== key) {
    setLoadedKey(key);
    setDraft({});
  }

  const statusOf = (id: string): AttendanceStatus => draft[id] ?? existing[id] ?? "present";

  return (
    <div className="space-y-5">
      <PageHeader title="Mark attendance" description="Saving updates the student, the parent and admin analytics instantly." />
      <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-44" />
        </div>
        <Button
          onClick={() => {
            if (!students.length) return;
            const entries: Record<string, AttendanceStatus> = {};
            students.forEach((st) => (entries[st.id] = statusOf(st.id)));
            saveAttendance(classId, date, entries, teacher!.id, actor);
            const absent = Object.values(entries).filter((v) => v === "absent").length;
            toast.success("Attendance saved", {
              description: `${students.length - absent} present · ${absent} absent. Parents notified.`,
            });
          }}
        >
          <Save className="size-4" /> Save attendance
        </Button>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students in this class yet" description="Ask the admin to admit students to this class." />
      ) : (
        <div className="surface-card divide-y divide-border">
          {students.map((st) => {
            const status = statusOf(st.id);
            return (
              <div key={st.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <StudentAvatar name={st.name} color={st.avatarColor} size="sm" />
                  <div>
                    <p className="font-medium">{st.name}</p>
                    <p className="text-xs text-muted-foreground">{st.id} · Roll {st.rollNo}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(["present", "late", "absent"] as AttendanceStatus[]).map((opt) => (
                    <Button
                      key={opt}
                      size="sm"
                      variant={status === opt ? "default" : "outline"}
                      onClick={() => setDraft({ ...draft, [st.id]: opt })}
                      className="capitalize"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MarksPage() {
  const { state, saveMarks } = useSchool();
  const actor = useActor();
  const { teacher, classes } = useTeacherScope();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const cls = state.classes.find((c) => c.id === classId);
  const availableSubjects = state.subjects.map((s) => ({ subjectId: s.id, teacherId: teacher?.id ?? "" }));
  const [subjectId, setSubjectId] = useState(availableSubjects[0]?.subjectId ?? "");
  useEffect(() => {
    setSubjectId(availableSubjects[0]?.subjectId ?? "");
  }, [classId]);
  const [examName, setExamName] = useState("Unit Test 2");
  const students = state.students.filter((st) => st.classId === classId);
  const [scores, setScores] = useState<Record<string, number>>({});

  const existing = (studentId: string) =>
    state.marks.find((m) => m.studentId === studentId && m.subjectId === subjectId && m.examName === examName)?.score;

  return (
    <div className="space-y-5">
      <PageHeader title="Enter marks" description="Saved marks appear in student results, parent performance and admin analytics." />
      <div className="surface-card grid gap-3 p-4 sm:grid-cols-4 sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableSubjects.map((st) => (
                <SelectItem key={st.subjectId} value={st.subjectId}>
                  {state.subjects.find((x) => x.id === st.subjectId)?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Exam</Label>
          <Select value={examName} onValueChange={setExamName}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Unit Test 1">Unit Test 1</SelectItem>
              <SelectItem value="Mid Term">Mid Term</SelectItem>
              <SelectItem value="Unit Test 2">Unit Test 2</SelectItem>
              <SelectItem value="Final Term">Final Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={async () => {
            const payload: Record<string, number> = {};
            students.forEach((st) => {
              const v = scores[st.id] ?? existing(st.id);
              if (typeof v === "number" && !Number.isNaN(v)) payload[st.id] = v;
            });
            if (!Object.keys(payload).length) {
              toast.error("Enter at least one score");
              return;
            }
            try {
              await saveMarks(classId, subjectId, examName, payload, teacher!.id, actor);
              toast.success("Marks saved", { description: "Students and parents have been notified." });
            } catch (e) {
              toast.error("Failed to save marks");
            }
          }}
        >
          <Save className="size-4" /> Save marks
        </Button>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No students in this class" />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead className="w-40">Score / 100</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((st) => {
                const value = scores[st.id] ?? existing(st.id) ?? "";
                return (
                  <TableRow key={st.id}>
                    <TableCell className="font-medium">{st.name}</TableCell>
                    <TableCell>{st.rollNo}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => setScores({ ...scores, [st.id]: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>{typeof value === "number" ? gradeFor(value) : "—"}</TableCell>
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

function AssignmentsPage() {
  const { state, createAssignment } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const { teacher, classes } = useTeacherScope();
  const [form, setForm] = useState({
    title: "",
    description: "",
    classId: classes[0]?.id ?? "",
    subjectId: teacher?.subjectIds[0] ?? "sub-math",
    dueDate: addDays(today(), 5),
  });
  const mine = state.assignments.filter((a) => a.teacherId === teacher?.id);

  return (
    <div className="space-y-5">
      <PageHeader title="Assignments" description="Students and parents are notified as soon as you publish." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="surface-card p-5">
          <h3 className="font-display text-sm font-semibold">New assignment</h3>
          <div className="mt-4 grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Instructions</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Class</Label>
                <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {state.subjects.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <Button
              onClick={() => {
                if (!form.title.trim()) {
                  toast.error("Add a title");
                  return;
                }
                createAssignment(
                  {
                    title: form.title,
                    description: form.description,
                    classId: form.classId,
                    subjectId: form.subjectId,
                    teacherId: teacher!.id,
                    assignedDate: today(),
                    dueDate: form.dueDate,
                  },
                  actor,
                );
                setForm({ ...form, title: "", description: "" });
                toast.success("Assignment published");
              }}
            >
              <FileText className="size-4" /> Publish assignment
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {mine.length === 0 ? (
            <EmptyState title="No assignments yet" description="Publish your first assignment on the left." />
          ) : (
            mine.map((a) => {
              const total = state.students.filter((st) => st.classId === a.classId).length;
              return (
                <div key={a.id} className="surface-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{a.title}</p>
                    <StatusBadge tone={a.dueDate < today() ? "destructive" : "info"}>due {prettyDate(a.dueDate)}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.className(a.classId)} · {s.subjectName(a.subjectId)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
                  <p className="mt-2 text-xs font-medium">{a.completedBy.length}/{total} submitted</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MessagesPage() {
  const { state, sendMessage, markMessagesRead } = useSchool();
  const actor = useActor();
  const { teacher, students } = useTeacherScope();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [body, setBody] = useState("");
  const student = state.students.find((st) => st.id === studentId);
  const parent = state.parents.find((p) => p.id === student?.parentId);
  const threadKey = `${teacher?.id}::${parent?.id}::${studentId}`;
  const thread = state.messages.filter((m) => m.threadKey === threadKey);

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Direct conversations with the parent linked to each student." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="surface-card divide-y divide-border">
          {students.map((st) => {
            const p = state.parents.find((x) => x.id === st.parentId);
            const unread = state.messages.filter(
              (m) => m.studentId === st.id && m.fromRole === "parent" && !m.read,
            ).length;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setStudentId(st.id);
                  markMessagesRead(`${teacher?.id}::${st.parentId}::${st.id}`, "teacher");
                }}
                className={`flex w-full items-center justify-between gap-2 p-3 text-left ${studentId === st.id ? "bg-muted" : "hover:bg-muted/60"}`}
              >
                <span>
                  <span className="block text-sm font-medium">{p?.name}</span>
                  <span className="block text-xs text-muted-foreground">Parent of {st.name}</span>
                </span>
                {unread ? <StatusBadge tone="destructive">{unread}</StatusBadge> : null}
              </button>
            );
          })}
        </div>
        <div className="surface-card flex min-h-[420px] flex-col p-4">
          <p className="text-sm font-semibold">{parent?.name} · about {student?.name}</p>
          <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
            {thread.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>
            ) : (
              thread.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-xl p-3 text-sm ${
                    m.fromRole === "teacher" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p>{m.body}</p>
                  <p className="mt-1 text-[11px] opacity-70">{prettyDateTime(m.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Write a message…" value={body} onChange={(e) => setBody(e.target.value)} />
            <Button
              onClick={async () => {
                if (!body.trim() || !parent || !teacher) return;
                try {
                  await sendMessage({ teacherId: teacher.id, parentId: parent.id, studentId, fromRole: "teacher", body }, actor);
                  setBody("");
                  toast.success("Message sent to parent");
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

function AnnouncementsPage() {
  const { state, publishAnnouncement } = useSchool();
  const s = useSelectors();
  const actor = useActor();
  const { classes } = useTeacherScope();
  const [form, setForm] = useState({ title: "", body: "", classId: classes[0]?.id ?? "" });
  const visible = s.announcementsFor("teacher").concat(
    state.announcements.filter((a) => a.audience === "class" && classes.some((c) => c.id === a.classId)),
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Class announcements" description="Reaches every student and parent in the selected class." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface-card p-5">
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Class</Label>
              <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!form.title.trim() || !form.body.trim()) {
                  toast.error("Add a title and message");
                  return;
                }
                publishAnnouncement(
                  { title: form.title, body: form.body, audience: "class", classId: form.classId, authorName: actor.name },
                  actor,
                );
                setForm({ ...form, title: "", body: "" });
                toast.success("Announcement sent");
              }}
            >
              <Megaphone className="size-4" /> Publish
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {visible.map((a) => (
            <div key={a.id} className="surface-card p-4">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.authorName} · {prettyDateTime(a.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsPage() {
  const { state } = useSchool();
  const { students } = useTeacherScope();
  const insights = students
    .map((st) => computeRisk(st, state.attendance, state.marks, state.subjects))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Academic Risk Insight"
        description="Transparent, rule-based early warnings for the students you teach."
      />
      <div className="surface-card flex items-start gap-3 p-4">
        <Sparkles className="mt-0.5 size-4 text-accent" />
        <p className="text-sm text-muted-foreground">
          Built from attendance change, subject score change and overall average. A trained model can replace these
          rules without changing this screen.
        </p>
      </div>
      <Tabs defaultValue="attention">
        <TabsList>
          <TabsTrigger value="attention">Needs attention</TabsTrigger>
          <TabsTrigger value="all">All students</TabsTrigger>
        </TabsList>
        {(["attention", "all"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            {insights
              .filter((r) => (tab === "attention" ? r.level !== "low" : true))
              .map((r) => (
                <div key={r.studentId} className="surface-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{r.studentName}</p>
                    <StatusBadge tone={r.level === "high" ? "destructive" : r.level === "medium" ? "warning" : "success"}>
                      {r.level} risk · attendance {r.attendanceEarlier}% → {r.attendanceRecent}%
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
                </div>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
