export type Role = "admin" | "teacher" | "student" | "parent";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  /** teacherId / studentId / parentId depending on role */
  linkedId?: string;
  avatarColor: string;
}

export interface SchoolClass {
  id: string; // e.g. c10a
  grade: string; // "10"
  section: string; // "A"
  name: string; // "10-A"
  classTeacherId: string;
  room: string;
  subjectTeachers: { subjectId: string; teacherId: string }[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjectIds: string[];
  classIds: string[];
  qualification: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  relation: string;
  occupation: string;
}

export interface Student {
  id: string; // STU-2026-001 — used everywhere
  name: string;
  rollNo: number;
  dob: string;
  gender: "Male" | "Female";
  email: string;
  phone: string;
  address: string;
  classId: string;
  parentId: string;
  admissionDate: string;
  avatarColor: string;
  status: "active" | "inactive";
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // yyyy-mm-dd
  status: AttendanceStatus;
  markedByTeacherId: string;
  period: string;
}

export interface MarkRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  examName: string;
  score: number;
  maxScore: number;
  enteredByTeacherId: string;
  date: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  assignedDate: string;
  dueDate: string;
  /** studentIds who submitted */
  completedBy: string[];
}

export type FeeStatus = "paid" | "pending" | "overdue";

export interface FeeRecord {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: FeeStatus;
  payments: { id: string; amount: number; date: string; method: string; reference: string }[];
}

export interface Exam {
  id: string;
  classId: string;
  subjectId: string;
  title: string;
  date: string;
  time: string;
  room: string;
}

export type Audience = "all" | "teachers" | "students" | "parents" | "class";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  classId?: string;
  authorName: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadKey: string; // teacherId::parentId::studentId
  teacherId: string;
  parentId: string;
  studentId: string;
  fromRole: "teacher" | "parent";
  body: string;
  createdAt: string;
  read: boolean;
}

export type NotificationType =
  | "attendance"
  | "marks"
  | "fees"
  | "assignment"
  | "announcement"
  | "message";

export interface AppNotification {
  id: string;
  userIds: string[]; // recipients (user ids)
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  readBy: string[];
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: Role;
  action: string;
  detail: string;
  entity: string;
  createdAt: string;
}

export interface SchoolState {
  users: User[];
  teachers: Teacher[];
  parents: Parent[];
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  marks: MarkRecord[];
  assignments: Assignment[];
  fees: FeeRecord[];
  exams: Exam[];
  announcements: Announcement[];
  messages: Message[];
  notifications: AppNotification[];
  logs: ActivityLog[];
}
