import type {
  SchoolState,
  Student,
  AttendanceRecord,
  MarkRecord,
  FeeRecord,
  AppNotification,
  ActivityLog,
} from "@/types";
import { addDays, lastWeekdays, today, toISODate } from "@/lib/dates";

/** deterministic pseudo random so the demo is stable */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const subjects = [
  { id: "sub-math", name: "Mathematics", code: "MATH" },
  { id: "sub-sci", name: "Science", code: "SCI" },
  { id: "sub-eng", name: "English", code: "ENG" },
  { id: "sub-cs", name: "Computer Science", code: "CS" },
];

const teachers = [
  {
    id: "TCH-01",
    name: "Priya Sharma",
    email: "priya.sharma@vidya.edu",
    phone: "+91 98200 11223",
    subjectIds: ["sub-math"],
    classIds: ["c10a", "c10b"],
    qualification: "M.Sc Mathematics, B.Ed",
  },
  {
    id: "TCH-02",
    name: "Rahul Verma",
    email: "rahul.verma@vidya.edu",
    phone: "+91 98200 44556",
    subjectIds: ["sub-sci"],
    classIds: ["c10a", "c9a"],
    qualification: "M.Sc Physics, B.Ed",
  },
  {
    id: "TCH-03",
    name: "Anita Desai",
    email: "anita.desai@vidya.edu",
    phone: "+91 98200 77889",
    subjectIds: ["sub-eng"],
    classIds: ["c10a", "c10b", "c9a"],
    qualification: "M.A English",
  },
  {
    id: "TCH-04",
    name: "Vikram Rao",
    email: "vikram.rao@vidya.edu",
    phone: "+91 98200 33221",
    subjectIds: ["sub-cs"],
    classIds: ["c10a", "c9a"],
    qualification: "M.Tech Computer Science",
  },
];

const classes = [
  {
    id: "c10a",
    grade: "10",
    section: "A",
    name: "10-A",
    classTeacherId: "TCH-01",
    room: "Block A · 204",
    subjectTeachers: [
      { subjectId: "sub-math", teacherId: "TCH-01" },
      { subjectId: "sub-sci", teacherId: "TCH-02" },
      { subjectId: "sub-eng", teacherId: "TCH-03" },
      { subjectId: "sub-cs", teacherId: "TCH-04" },
    ],
  },
  {
    id: "c10b",
    grade: "10",
    section: "B",
    name: "10-B",
    classTeacherId: "TCH-03",
    room: "Block A · 205",
    subjectTeachers: [
      { subjectId: "sub-math", teacherId: "TCH-01" },
      { subjectId: "sub-eng", teacherId: "TCH-03" },
    ],
  },
  {
    id: "c9a",
    grade: "9",
    section: "A",
    name: "9-A",
    classTeacherId: "TCH-02",
    room: "Block B · 101",
    subjectTeachers: [
      { subjectId: "sub-sci", teacherId: "TCH-02" },
      { subjectId: "sub-eng", teacherId: "TCH-03" },
      { subjectId: "sub-cs", teacherId: "TCH-04" },
    ],
  },
];

const palette = ["#1f4d8f", "#0f766e", "#b45309", "#7c2d5f", "#3f5d2c", "#334155", "#9a3412"];

const parentSeed: [string, string, string, string, string, string][] = [
  ["PAR-01", "Meena Kumar", "meena.kumar@gmail.com", "+91 90000 10001", "Mother", "Bank Manager"],
  ["PAR-02", "Sanjay Iyer", "sanjay.iyer@gmail.com", "+91 90000 10002", "Father", "Architect"],
  ["PAR-03", "Farah Sheikh", "farah.sheikh@gmail.com", "+91 90000 10003", "Mother", "Doctor"],
  ["PAR-04", "Deepak Nair", "deepak.nair@gmail.com", "+91 90000 10004", "Father", "Entrepreneur"],
  ["PAR-05", "Latha Reddy", "latha.reddy@gmail.com", "+91 90000 10005", "Mother", "Professor"],
  ["PAR-06", "Imran Qureshi", "imran.q@gmail.com", "+91 90000 10006", "Father", "Civil Engineer"],
  ["PAR-07", "Neha Bansal", "neha.bansal@gmail.com", "+91 90000 10007", "Mother", "Designer"],
  ["PAR-08", "Ravi Menon", "ravi.menon@gmail.com", "+91 90000 10008", "Father", "Accountant"],
];

const studentSeed: [string, string, string, Student["gender"], string, number][] = [
  ["STU-2026-001", "Arjun Kumar", "c10a", "Male", "PAR-01", 1],
  ["STU-2026-002", "Kavya Iyer", "c10a", "Female", "PAR-02", 2],
  ["STU-2026-003", "Zoya Sheikh", "c10a", "Female", "PAR-03", 3],
  ["STU-2026-004", "Aditya Nair", "c10a", "Male", "PAR-04", 4],
  ["STU-2026-005", "Sneha Reddy", "c10a", "Female", "PAR-05", 5],
  ["STU-2026-006", "Faizan Qureshi", "c10b", "Male", "PAR-06", 1],
  ["STU-2026-007", "Riya Bansal", "c10b", "Female", "PAR-07", 2],
  ["STU-2026-008", "Nikhil Menon", "c9a", "Male", "PAR-08", 1],
];

export function buildSeed(): SchoolState {
  const parents = parentSeed.map(([id, name, email, phone, relation, occupation]) => ({
    id,
    name,
    email,
    phone,
    relation,
    occupation,
  }));

  const students: Student[] = studentSeed.map(([id, name, classId, gender, parentId, rollNo], i) => ({
    id,
    name,
    rollNo,
    dob: `20${10 + (i % 2)}-0${(i % 9) + 1}-1${i % 9}`,
    gender,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@student.vidya.edu`,
    phone: `+91 98765 4${String(1000 + i).slice(-4)}`,
    address: `${12 + i} Rose Avenue, Bengaluru 5600${String(10 + i).slice(-2)}`,
    classId,
    parentId,
    admissionDate: "2024-06-12",
    avatarColor: palette[i % palette.length] || "#000",
    status: "active",
  }));

  // attendance: last 24 weekdays
  const days = lastWeekdays(24);
  const attendance: AttendanceRecord[] = [];
  students.forEach((s) => {
    const rand = rng(s.id);
    days.forEach((date, idx) => {
      // Arjun: declining attendance to power the AI insight
      const decline = s.id === "STU-2026-001" ? (idx > 15 ? 0.45 : 0.08) : 0.1;
      const r = rand();
      const status = r < decline ? "absent" : r < decline + 0.06 ? "late" : "present";
      attendance.push({
        id: `att-${s.id}-${date}`,
        studentId: s.id,
        classId: s.classId,
        date,
        status,
        markedByTeacherId: classes.find((c) => c.id === s.classId)!.classTeacherId,
        period: "Morning Roll Call",
      });
    });
  });

  const marks: MarkRecord[] = [];
  const exams = ["Unit Test 1", "Mid Term"];
  students.forEach((s) => {
    const cls = classes.find((c) => c.id === s.classId)!;
    const rand = rng(s.id + "marks");
    cls.subjectTeachers.forEach((st) => {
      exams.forEach((examName, ei) => {
        let base = 58 + Math.floor(rand() * 35);
        if (s.id === "STU-2026-001" && st.subjectId === "sub-math") base = ei === 0 ? 78 : 54;
        marks.push({
          id: `mark-${s.id}-${st.subjectId}-${ei}`,
          studentId: s.id,
          classId: s.classId,
          subjectId: st.subjectId,
          examName,
          score: Math.min(base, 100),
          maxScore: 100,
          enteredByTeacherId: st.teacherId,
          date: ei === 0 ? addDays(today(), -46) : addDays(today(), -16),
        });
      });
    });
  });

  const assignments = [
    {
      id: "asg-1",
      title: "Quadratic Equations — Worksheet 4",
      description: "Solve all 15 problems from the worksheet and show full working.",
      classId: "c10a",
      subjectId: "sub-math",
      teacherId: "TCH-01",
      assignedDate: addDays(today(), -5),
      dueDate: addDays(today(), 2),
      completedBy: ["STU-2026-002", "STU-2026-003"],
    },
    {
      id: "asg-2",
      title: "Light & Reflection — Lab Report",
      description: "Write the observation table and conclusion for the convex mirror experiment.",
      classId: "c10a",
      subjectId: "sub-sci",
      teacherId: "TCH-02",
      assignedDate: addDays(today(), -8),
      dueDate: addDays(today(), -1),
      completedBy: ["STU-2026-002", "STU-2026-004", "STU-2026-005"],
    },
    {
      id: "asg-3",
      title: "Essay: My Role in the Community",
      description: "500 words, submit as a handwritten copy.",
      classId: "c10a",
      subjectId: "sub-eng",
      teacherId: "TCH-03",
      assignedDate: addDays(today(), -3),
      dueDate: addDays(today(), 5),
      completedBy: ["STU-2026-001"],
    },
    {
      id: "asg-4",
      title: "Python Loops Practice Set",
      description: "Complete exercises 1-10 in the lab notebook.",
      classId: "c9a",
      subjectId: "sub-cs",
      teacherId: "TCH-04",
      assignedDate: addDays(today(), -4),
      dueDate: addDays(today(), 3),
      completedBy: [],
    },
  ];

  const fees: FeeRecord[] = students.flatMap((s, i) => {
    const term1: FeeRecord = {
      id: `fee-${s.id}-t1`,
      studentId: s.id,
      title: "Term 1 Tuition Fee",
      amount: 24000,
      paidAmount: 24000,
      dueDate: addDays(today(), -40),
      status: "paid",
      payments: [
        {
          id: `pay-${s.id}-1`,
          amount: 24000,
          date: addDays(today(), -44),
          method: "Net Banking",
          reference: `TXN${100200 + i}`,
        },
      ],
    };
    const pendingAmount = i % 3 === 0 ? 0 : 18000;
    const term2: FeeRecord = {
      id: `fee-${s.id}-t2`,
      studentId: s.id,
      title: "Term 2 Tuition Fee",
      amount: 24000,
      paidAmount: 24000 - pendingAmount,
      dueDate: addDays(today(), i % 3 === 1 ? -6 : 14),
      status: pendingAmount === 0 ? "paid" : i % 3 === 1 ? "overdue" : "pending",
      payments:
        pendingAmount === 0
          ? [
              {
                id: `pay-${s.id}-2`,
                amount: 24000,
                date: addDays(today(), -10),
                method: "UPI",
                reference: `TXN${200200 + i}`,
              },
            ]
          : [
              {
                id: `pay-${s.id}-2`,
                amount: 6000,
                date: addDays(today(), -12),
                method: "UPI",
                reference: `TXN${300200 + i}`,
              },
            ],
    };
    return [term1, term2];
  });

  const examSchedule = [
    { id: "ex-1", classId: "c10a", subjectId: "sub-math", title: "Term 2 Examination", date: addDays(today(), 7), time: "09:30 AM", room: "Hall 1" },
    { id: "ex-2", classId: "c10a", subjectId: "sub-sci", title: "Term 2 Examination", date: addDays(today(), 9), time: "09:30 AM", room: "Hall 1" },
    { id: "ex-3", classId: "c10a", subjectId: "sub-eng", title: "Term 2 Examination", date: addDays(today(), 11), time: "09:30 AM", room: "Hall 2" },
    { id: "ex-4", classId: "c10a", subjectId: "sub-cs", title: "Term 2 Examination", date: addDays(today(), 13), time: "11:30 AM", room: "Lab 3" },
    { id: "ex-5", classId: "c10b", subjectId: "sub-math", title: "Term 2 Examination", date: addDays(today(), 8), time: "09:30 AM", room: "Hall 2" },
    { id: "ex-6", classId: "c9a", subjectId: "sub-sci", title: "Term 2 Examination", date: addDays(today(), 10), time: "09:30 AM", room: "Hall 3" },
  ];

  const nowIso = new Date().toISOString();
  const announcements = [
    {
      id: "ann-1",
      title: "Parent–Teacher Meeting on Saturday",
      body: "The term 2 PTM is scheduled this Saturday from 9:00 AM to 1:00 PM. Please confirm your slot with the class teacher.",
      audience: "parents" as const,
      authorName: "Admin Office",
      createdAt: addDays(today(), -2) + "T09:15:00.000Z",
    },
    {
      id: "ann-2",
      title: "Term 2 Examination Timetable Published",
      body: "The examination timetable is now available in the Exams section. Syllabus coverage ends this Friday.",
      audience: "all" as const,
      authorName: "Admin Office",
      createdAt: addDays(today(), -4) + "T11:00:00.000Z",
    },
    {
      id: "ann-3",
      title: "Science Exhibition — Class 10-A",
      body: "Teams must submit their project abstract by Thursday to Mr. Rahul Verma.",
      audience: "class" as const,
      classId: "c10a",
      authorName: "Rahul Verma",
      createdAt: addDays(today(), -1) + "T14:30:00.000Z",
    },
  ];

  const messages = [
    {
      id: "msg-1",
      threadKey: "TCH-01::PAR-01::STU-2026-001",
      teacherId: "TCH-01",
      parentId: "PAR-01",
      studentId: "STU-2026-001",
      fromRole: "teacher" as const,
      body: "Good morning. Arjun has missed a few Mathematics classes recently and his last test score dropped. Could we discuss a short revision plan?",
      createdAt: addDays(today(), -1) + "T10:05:00.000Z",
      read: false,
    },
    {
      id: "msg-2",
      threadKey: "TCH-03::PAR-02::STU-2026-002",
      teacherId: "TCH-03",
      parentId: "PAR-02",
      studentId: "STU-2026-002",
      fromRole: "teacher" as const,
      body: "Kavya's essay was excellent this week. Well done to her.",
      createdAt: addDays(today(), -3) + "T16:20:00.000Z",
      read: true,
    },
  ];

  const users = [
    {
      id: "usr-admin",
      name: "Rohit Malhotra",
      email: "admin@vidya.edu",
      password: "demo1234",
      role: "admin" as const,
      avatarColor: "#1f4d8f",
    },
    ...teachers.map((t, i) => ({
      id: `usr-${t.id}`,
      name: t.name,
      email: t.email,
      password: "demo1234",
      role: "teacher" as const,
      linkedId: t.id,
      avatarColor: palette[(i + 1) % palette.length] || "#000",
    })),
    ...students.map((s) => ({
      id: `usr-${s.id}`,
      name: s.name,
      email: s.email,
      password: "demo1234",
      role: "student" as const,
      linkedId: s.id,
      avatarColor: s.avatarColor,
    })),
    ...parents.map((p, i) => ({
      id: `usr-${p.id}`,
      name: p.name,
      email: p.email,
      password: "demo1234",
      role: "parent" as const,
      linkedId: p.id,
      avatarColor: palette[(i + 3) % palette.length] || "#000",
    })),
  ];

  const notifications: AppNotification[] = [
    {
      id: "ntf-1",
      userIds: users.filter((u) => u.role === "parent" || u.role === "student").map((u) => u.id),
      type: "announcement",
      title: "Term 2 Examination Timetable Published",
      body: "Check the Exams section for the full schedule.",
      createdAt: addDays(today(), -4) + "T11:00:00.000Z",
      readBy: [],
    },
    {
      id: "ntf-2",
      userIds: ["usr-PAR-01"],
      type: "message",
      title: "New message from Priya Sharma",
      body: "Regarding Arjun's Mathematics performance.",
      createdAt: addDays(today(), -1) + "T10:05:00.000Z",
      readBy: [],
    },
  ];

  const logs: ActivityLog[] = [
    {
      id: "log-1",
      actorName: "Rohit Malhotra",
      actorRole: "admin",
      action: "Student admitted",
      detail: "Arjun Kumar (STU-2026-001) assigned to 10-A under Priya Sharma",
      entity: "STU-2026-001",
      createdAt: addDays(today(), -30) + "T09:00:00.000Z",
    },
    {
      id: "log-2",
      actorName: "Priya Sharma",
      actorRole: "teacher",
      action: "Marks entered",
      detail: "Mid Term Mathematics marks saved for class 10-A",
      entity: "c10a",
      createdAt: addDays(today(), -16) + "T12:40:00.000Z",
    },
    {
      id: "log-3",
      actorName: "Admin Office",
      actorRole: "admin",
      action: "Announcement published",
      detail: "Parent–Teacher Meeting on Saturday",
      entity: "ann-1",
      createdAt: addDays(today(), -2) + "T09:15:00.000Z",
    },
    {
      id: "log-4",
      actorName: "System",
      actorRole: "admin",
      action: "Session started",
      detail: `Demo data initialised on ${toISODate(new Date())}`,
      entity: "system",
      createdAt: nowIso,
    },
  ];

  return {
    users,
    teachers,
    parents,
    students,
    classes,
    subjects,
    attendance,
    marks,
    assignments,
    fees,
    exams: examSchedule,
    announcements,
    messages,
    notifications,
    logs,
  };
}
