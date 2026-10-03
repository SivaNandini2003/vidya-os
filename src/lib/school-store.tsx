import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActivityLog, Announcement, AppNotification, Assignment, AttendanceStatus,
  FeeRecord, Role, SchoolState, Student, Teacher, User
} from "@/types";
import { today } from "@/lib/dates";
import { toast } from "sonner";

const SESSION_KEY = "vidyalaya.session.v1";
const TOKEN_KEY = "vidyalaya.token.v1";
const API_URL = import.meta.env["VITE_API_URL"] ?? (import.meta.env.PROD ? "/api" : "http://localhost:3001/api");

interface Actor { name: string; role: Role; }

interface StoreValue {
  state: SchoolState;
  ready: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: User }>;
  logout: () => void;
  resetDemoData: () => Promise<void>;
  addStudent: (input: any, actor: Actor) => Promise<Student>;
  updateStudent: (id: string, patch: Partial<Student>, actor: Actor) => Promise<void>;
  removeStudent: (id: string, actor: Actor) => Promise<void>;
  addTeacher: (input: any, actor: Actor) => Promise<Teacher>;
  removeTeacher: (id: string, actor: Actor) => Promise<void>;
  addClass: (input: any, actor: Actor) => Promise<void>;
  updateTeacher: (id: string, patch: Partial<Teacher>, actor: Actor) => Promise<void>;
  removeClass: (id: string, actor: Actor) => Promise<void>;
  updateClass: (id: string, patch: any, actor: Actor) => Promise<void>;
  saveAttendance: (classId: string, date: string, entries: Record<string, AttendanceStatus>, teacherId: string, actor: Actor) => Promise<void>;
  saveMarks: (classId: string, subjectId: string, examName: string, scores: Record<string, number>, teacherId: string, actor: Actor) => Promise<void>;
  createAssignment: (input: Omit<Assignment, "id" | "completedBy">, actor: Actor) => Promise<void>;
  toggleAssignmentDone: (assignmentId: string, studentId: string, done: boolean) => Promise<void>;
  addFee: (input: any, actor: Actor) => Promise<void>;
  payFee: (feeId: string, amount: number, method: string, actor: Actor) => Promise<void>;
  publishAnnouncement: (input: Omit<Announcement, "id" | "createdAt">, actor: Actor) => Promise<void>;
  removeAnnouncement: (id: string, actor: Actor) => Promise<void>;
  sendMessage: (input: any, actor: Actor) => Promise<void>;
  markNotificationRead: (id: string, userId: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  markMessagesRead: (threadKey: string, forRole: "teacher" | "parent") => Promise<void>;
}

const SchoolContext = createContext<StoreValue | null>(null);

const emptyState: SchoolState = {
  users: [], teachers: [], parents: [], students: [], classes: [], subjects: [],
  attendance: [], marks: [], assignments: [], fees: [], exams: [],
  announcements: [], messages: [], notifications: [], logs: []
};

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SchoolState>(emptyState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('vidyalaya.user.v1');
    window.location.href = "/";
  }, []);

  const api = useCallback(async (path: string, options?: RequestInit) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = { ...((options?.headers as any) || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (options?.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }
    
    let data;
    try { data = await res.json(); } catch { data = null; }
    
    if (!res.ok) {
      throw new Error(data?.error || `API Error: ${res.status}`);
    }
    return data;
  }, [logout]);

  const fetchState = useCallback(async () => {
    try {
      const data = await api("/state");
      setState(data);
    } catch (e: any) {
      console.error("Failed to fetch state", e);
    }
  }, [api]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const sessUser = localStorage.getItem('vidyalaya.user.v1');
    if (token && sessUser) {
      setCurrentUser(JSON.parse(sessUser));
      fetchState().finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [fetchState]);

  const login: StoreValue["login"] = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(SESSION_KEY, data.user.id);
        localStorage.setItem('vidyalaya.user.v1', JSON.stringify(data.user));
        setCurrentUser(data.user);
        await fetchState();
        return { ok: true, user: data.user };
      }
      return { ok: false, error: data.error || "Invalid credentials" };
    } catch (e) {
      return { ok: false, error: "Unable to connect to VIDYA OS services." };
    }
  };

  const resetDemoData = async () => {
    try {
      await api("/admin/reset", { method: "POST" });
      await fetchState();
      toast.success("Demo data reset");
    } catch (e: any) { toast.error(e.message); }
  };

  const withToast = async <T,>(promise: Promise<T>, successMsg: string) => {
    try {
      const res = await promise;
      await fetchState();
      toast.success(successMsg);
      return res;
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
      throw e;
    }
  };

  const addStudent: StoreValue["addStudent"] = (input, actor) =>
    withToast(api("/students", { method: "POST", body: JSON.stringify(input) }), "Student added").then(r => r.student);
    
  const updateStudent: StoreValue["updateStudent"] = (id, patch, actor) =>
    withToast(api(`/students/${id}`, { method: "POST", body: JSON.stringify(patch) }), "Student updated");
    
  const removeStudent: StoreValue["removeStudent"] = (id, actor) =>
    withToast(api(`/students/${id}`, { method: "POST", body: JSON.stringify({ status: "inactive" }) }), "Student removed");
    
  const addTeacher: StoreValue["addTeacher"] = (input, actor) =>
    withToast(api("/teachers", { method: "POST", body: JSON.stringify(input) }), "Teacher added").then(r => r.teacher);
    
  const removeTeacher: StoreValue["removeTeacher"] = (id, actor) =>
    withToast(api(`/teachers/${id}`, { method: "DELETE" }), "Teacher removed");

  const updateTeacher: StoreValue["updateTeacher"] = (id, patch, actor) =>
    withToast(api(`/teachers/${id}`, { method: "PUT", body: JSON.stringify(patch) }), "Teacher updated");

  const addClass: StoreValue["addClass"] = (input, actor) =>
    withToast(api("/classes", { method: "POST", body: JSON.stringify(input) }), "Class added");

  const removeClass: StoreValue["removeClass"] = (id, actor) =>
    withToast(api(`/classes/${id}`, { method: "DELETE" }), "Class removed");
    
  const updateClass: StoreValue["updateClass"] = (id, patch, actor) =>
    withToast(api(`/classes/${id}`, { method: "PUT", body: JSON.stringify(patch) }), "Class updated");
    
  const saveAttendance: StoreValue["saveAttendance"] = (classId, date, entries, teacherId, actor) =>
    withToast(api("/attendance", { method: "POST", body: JSON.stringify({ classId, date, entries, teacherId }) }), "Attendance saved");
    
  const saveMarks: StoreValue["saveMarks"] = (classId, subjectId, examName, scores, teacherId, actor) =>
    withToast(api("/marks", { method: "POST", body: JSON.stringify({ classId, subjectId, examName, scores, teacherId }) }), "Marks saved");
    
  const createAssignment: StoreValue["createAssignment"] = (input, actor) =>
    withToast(api("/assignments", { method: "POST", body: JSON.stringify(input) }), "Assignment created");
    
  const toggleAssignmentDone: StoreValue["toggleAssignmentDone"] = (assignmentId, studentId, done) =>
    withToast(api(`/assignments/${assignmentId}/toggle`, { method: "POST", body: JSON.stringify({ studentId, done }) }), done ? "Assignment submitted" : "Submission removed");
    
  const addFee: StoreValue["addFee"] = (input, actor) =>
    withToast(api("/fees", { method: "POST", body: JSON.stringify(input) }), "Fee record added");
    
  const payFee: StoreValue["payFee"] = (feeId, amount, method, actor) =>
    withToast(api(`/fees/${feeId}/pay`, { method: "POST", body: JSON.stringify({ amount, method }) }), "Payment processed");
    
  const publishAnnouncement: StoreValue["publishAnnouncement"] = (input, actor) =>
    withToast(api("/announcements", { method: "POST", body: JSON.stringify(input) }), "Announcement published");
    
  const removeAnnouncement: StoreValue["removeAnnouncement"] = (id, actor) =>
    withToast(api(`/announcements/${id}`, { method: "DELETE" }), "Announcement removed");
    
  const sendMessage: StoreValue["sendMessage"] = async (input, actor) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error("Failed to send message");
    await fetchState();
  };
    
  const markNotificationRead: StoreValue["markNotificationRead"] = (id, userId) =>
    withToast(api(`/notifications/${id}/read`, { method: "POST" }), "Notification read");
    
  const markAllNotificationsRead: StoreValue["markAllNotificationsRead"] = (userId) =>
    withToast(api(`/notifications/read-all`, { method: "POST" }), "All notifications read");
    
  const markMessagesRead: StoreValue["markMessagesRead"] = async (threadKey, forRole) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_URL}/messages/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ threadKey, forRole })
    });
    if (!res.ok) throw new Error("Failed to mark messages read");
    await fetchState();
  };

  const value = useMemo<StoreValue>(
    () => ({
      state, ready, currentUser, login, logout, resetDemoData,
      addStudent, updateStudent, removeStudent, addTeacher, updateTeacher, removeTeacher, addClass, updateClass, removeClass,
      saveAttendance, saveMarks, createAssignment, toggleAssignmentDone,
      addFee, payFee, publishAnnouncement, removeAnnouncement, sendMessage,
      markNotificationRead, markAllNotificationsRead, markMessagesRead,
    }),
    [state, ready, currentUser, login, logout]
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}

export function useActor(): Actor {
  const { currentUser } = useSchool();
  return { name: currentUser?.name ?? "System", role: currentUser?.role ?? "admin" };
}

export function useSelectors() {
  const { state } = useSchool();
  return useMemo(() => makeSelectors(state), [state]);
}

export function makeSelectors(s: SchoolState) {
  const className = (id: string) => s.classes.find((c) => c.id === id)?.name ?? "—";
  const subjectName = (id: string) => s.subjects.find((x) => x.id === id)?.name ?? "—";
  const teacherName = (id: string) => s.teachers.find((t) => t.id === id)?.name ?? "—";
  const studentAttendance = (studentId: string) => s.attendance.filter((a) => a.studentId === studentId).sort((a, b) => new Date(a.date).toISOString().localeCompare(new Date(b.date).toISOString()));
  const attendancePct = (studentId: string) => {
    const recs = studentAttendance(studentId);
    if (!recs.length) return 0;
    return Math.round((recs.filter((r) => r.status !== "absent").length / recs.length) * 100);
  };
  const todayStatus = (studentId: string) => s.attendance.find((a) => a.studentId === studentId && (typeof a.date === 'string' ? a.date : new Date(a.date).toISOString()).startsWith(today()))?.status ?? null;
  const studentMarks = (studentId: string) => s.marks.filter((m) => m.studentId === studentId).sort((a, b) => new Date(a.date).toISOString().localeCompare(new Date(b.date).toISOString()));
  const averagePct = (studentId: string): number | null => {
    const ms = studentMarks(studentId);
    if (!ms.length) return null;
    return Math.round(ms.reduce((t, m) => t + (m.score / m.maxScore) * 100, 0) / ms.length);
  };
  const studentFees = (studentId: string) => s.fees.filter((f) => f.studentId === studentId);
  const feeSummary = (studentId: string) => {
    const fs = studentFees(studentId);
    const total = fs.reduce((t, f) => t + f.amount, 0);
    const paid = fs.reduce((t, f) => t + f.paidAmount, 0);
    return { total, paid, pending: total - paid, records: fs };
  };
  const studentAssignments = (studentId: string) => {
    const st = s.students.find((x) => x.id === studentId);
    if (!st) return [];
    return s.assignments.filter((a) => a.classId === st.classId);
  };
  const notificationsFor = (userId: string) => s.notifications.filter((n) => n.userIds?.includes(userId)).sort((a, b) => new Date(b.createdAt).toISOString().localeCompare(new Date(a.createdAt).toISOString()));
  const announcementsFor = (role: Role, classId?: string) => s.announcements.filter((a) => {
    if (a.audience === "all") return true;
    if (a.audience === "class") return a.classId === classId;
    return a.audience.slice(0, -1) === role;
  }).sort((a, b) => new Date(b.createdAt).toISOString().localeCompare(new Date(a.createdAt).toISOString()));

  return { className, subjectName, teacherName, studentAttendance, attendancePct, todayStatus, studentMarks, averagePct, studentFees, feeSummary, studentAssignments, notificationsFor, announcementsFor };
}

export const gradeFor = (pct: number) => pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 45 ? "D" : "E";
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const useCallbackNoop = useCallback;
