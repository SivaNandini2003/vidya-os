import type { Role } from "@/types";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
}

export const NAV: Record<Role, NavItem[]> = {
  admin: [
    { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { key: "students", label: "Students", icon: "GraduationCap" },
    { key: "teachers", label: "Teachers", icon: "Users" },
    { key: "classes", label: "Classes & Sections", icon: "School" },
    { key: "attendance", label: "Attendance", icon: "CalendarCheck" },
    { key: "academics", label: "Academics", icon: "BookOpen" },
    { key: "fees", label: "Fees", icon: "Wallet" },
    { key: "announcements", label: "Announcements", icon: "Megaphone" },
    { key: "reports", label: "Reports & Analytics", icon: "BarChart3" },
    { key: "insights", label: "Academic Risk (AI)", icon: "Sparkles" },
    { key: "logs", label: "Activity Logs", icon: "ScrollText" },
    { key: "settings", label: "Settings", icon: "Settings" },
  ],
  teacher: [
    { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { key: "classes", label: "My Classes", icon: "School" },
    { key: "students", label: "Students", icon: "GraduationCap" },
    { key: "attendance", label: "Attendance", icon: "CalendarCheck" },
    { key: "marks", label: "Marks", icon: "ClipboardList" },
    { key: "assignments", label: "Assignments", icon: "FileText" },
    { key: "messages", label: "Messages", icon: "MessageSquare" },
    { key: "announcements", label: "Announcements", icon: "Megaphone" },
    { key: "insights", label: "Academic Insights", icon: "Sparkles" },
  ],
  student: [
    { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { key: "profile", label: "My Profile", icon: "UserRound" },
    { key: "attendance", label: "Attendance", icon: "CalendarCheck" },
    { key: "results", label: "Results", icon: "ClipboardList" },
    { key: "assignments", label: "Assignments", icon: "FileText" },
    { key: "exams", label: "Exams", icon: "CalendarDays" },
    { key: "fees", label: "Fees", icon: "Wallet" },
    { key: "announcements", label: "Announcements", icon: "Megaphone" },
    { key: "notifications", label: "Notifications", icon: "Bell" },
  ],
  parent: [
    { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { key: "child", label: "My Child", icon: "UserRound" },
    { key: "attendance", label: "Attendance", icon: "CalendarCheck" },
    { key: "performance", label: "Academic Performance", icon: "TrendingUp" },
    { key: "assignments", label: "Assignments", icon: "FileText" },
    { key: "fees", label: "Fees", icon: "Wallet" },
    { key: "exams", label: "Exams", icon: "CalendarDays" },
    { key: "messages", label: "Messages", icon: "MessageSquare" },
    { key: "announcements", label: "Announcements", icon: "Megaphone" },
    { key: "notifications", label: "Notifications", icon: "Bell" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};
