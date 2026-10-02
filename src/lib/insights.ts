import type { AttendanceRecord, MarkRecord, Student, Subject } from "@/types";

export interface RiskInsight {
  studentId: string;
  studentName: string;
  level: "high" | "medium" | "low";
  score: number;
  attendanceOverall: number;
  attendanceRecent: number;
  attendanceEarlier: number;
  averagePct: number | null;
  weakSubject?: string;
  perSubject: { name: string; latestPct: number; trend: "up" | "down" | "stable" }[];
  summary: string;
  signals: string[];
  recommendedAction: string;
}

/**
 * Rule-based ("simulated") academic-risk scoring.
 * Deliberately transparent: every signal is explainable, and the shape of the
 * output matches what a trained model would return later.
 */
export function computeRisk(
  student: Student,
  attendance: AttendanceRecord[],
  marks: MarkRecord[],
  subjects: Subject[],
): RiskInsight {
  const records = attendance
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const rate = (rs: AttendanceRecord[]) =>
    rs.length ? Math.round((rs.filter((r) => r.status !== "absent").length / rs.length) * 100) : 100;

  const overall = rate(records);
  const recentRecords = records.slice(-5);
  const earlierRecords = records.slice(0, -5);

  const recent = rate(recentRecords);
  const earlier = rate(earlierRecords);

  let absentStreak = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i]!.status === "absent") absentStreak++;
    else break;
  }

  const signals: string[] = [];
  let score = 0;

  if (absentStreak >= 3) {
    score += 50;
    signals.push(`Currently on a ${absentStreak}-day absent streak`);
  } else if (recent < earlier - 10) {
    score += 40;
    signals.push(`Attendance fell from ${earlier}% to ${recent}% recently`);
  } else if (overall < 80) {
    score += 25;
    signals.push(`Overall attendance is ${overall}%, below the 80% expectation`);
  }

  let weakSubject: string | undefined;
  let biggestDrop = 0;
  const perSubject: RiskInsight["perSubject"] = [];
  
  subjects.forEach((sub) => {
    const subMarks = marks
      .filter((m) => m.studentId === student.id && m.subjectId === sub.id)
      .sort((a, b) => a.date.localeCompare(b.date));
      
    if (subMarks.length === 0) return;
    
    const lastRec = subMarks[subMarks.length - 1]!;
    const latestPct = Math.round((lastRec.score / (lastRec.maxScore || 100)) * 100);
    let trend: "up" | "down" | "stable" = "stable";
    
    if (subMarks.length >= 2) {
      const first = (subMarks[subMarks.length - 2]!.score / (subMarks[subMarks.length - 2]!.maxScore || 100)) * 100;
      const last = (lastRec.score / (lastRec.maxScore || 100)) * 100;
      const drop = first - last;
      if (drop > biggestDrop) {
        biggestDrop = drop;
        weakSubject = sub.name;
      }
      if (drop >= 8) trend = "down";
      else if (last - first >= 8) trend = "up";
    }
    
    if (latestPct < 40) {
      score += 30;
      signals.push(`${sub.name} score is critically low (${latestPct}%)`);
      weakSubject = weakSubject || sub.name;
    } else if (latestPct < 60) {
      score += 15;
      signals.push(`${sub.name} score is low (${latestPct}%)`);
    }
    
    perSubject.push({ name: sub.name, latestPct, trend });
  });

  if (biggestDrop >= 15) {
    score += 40;
    signals.push(`${weakSubject} score dropped by ${Math.round(biggestDrop)} points in latest exam`);
  } else if (biggestDrop >= 8) {
    score += 20;
    signals.push(`${weakSubject} performance is trending down`);
  }

  const studentMarks = marks.filter((m) => m.studentId === student.id);
  const avg = studentMarks.length
    ? studentMarks.reduce((t, m) => t + (m.score / (m.maxScore || 100)) * 100, 0) / studentMarks.length
    : null;

  if (avg !== null && avg < 55) {
    score += 20;
    signals.push(`Overall average is ${Math.round(avg)}%`);
  }

  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  const summary =
    level === "low"
      ? `${student.name} is on track. Attendance is ${overall}% and results are stable.`
      : `${student.name}: ${signals.join(". ")}. Teacher attention may be required.`;
      
  const recommendedAction = level === "low" 
    ? "No immediate action required." 
    : level === "medium" 
      ? `Monitor ${student.name}'s progress closely${weakSubject ? `, especially in ${weakSubject}` : ""}.`
      : `Schedule a parent meeting to discuss ${student.name}'s performance${weakSubject ? ` and provide extra ${weakSubject} practice` : ""}.`;

  return {
    studentId: student.id,
    studentName: student.name,
    level,
    score: Math.min(score, 100),
    attendanceOverall: overall,
    attendanceRecent: recent,
    attendanceEarlier: earlier,
    averagePct: avg !== null ? Math.round(avg) : null,
    ...(weakSubject ? { weakSubject } : {}),
    perSubject,
    summary,
    signals,
    recommendedAction
  };
}
