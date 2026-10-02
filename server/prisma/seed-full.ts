import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildSeed } from '../../src/data/seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding full demo data...');
  const state = buildSeed();
  const passwordHash = await bcrypt.hash('demo1234', 10);

  // Users
  for (const u of state.users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        password: passwordHash,
        name: u.name,
        role: u.role,
        avatarColor: u.avatarColor,
      }
    });
  }

  // Teachers
  for (const t of state.teachers) {
    await prisma.teacher.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        userId: `usr-${t.id}`,
        phone: t.phone,
        qualification: t.qualification
      }
    });
  }

  // Parents
  for (const p of state.parents) {
    await prisma.parent.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        userId: `usr-${p.id}`,
        phone: p.phone,
        relation: p.relation,
        occupation: p.occupation
      }
    });
  }

  // Classes
  for (const c of state.classes) {
    await prisma.schoolClass.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        grade: c.grade,
        section: c.section,
        name: c.name,
        room: c.room,
        classTeacherId: c.classTeacherId
      }
    });
  }

  // Subjects
  for (const s of state.subjects) {
    await prisma.subject.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        code: s.code
      }
    });
  }

  // Class Subjects
  for (const c of state.classes) {
    for (const s of state.subjects) {
      const st = c.subjectTeachers.find((x: any) => x.subjectId === s.id);
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: c.id, subjectId: s.id } },
        update: {},
        create: {
          classId: c.id,
          subjectId: s.id,
          teacherId: st ? st.teacherId : c.classTeacherId
        }
      });
    }
  }

  // Students
  for (const s of state.students) {
    await prisma.student.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        userId: `usr-${s.id}`,
        rollNo: s.rollNo,
        dob: new Date(s.dob),
        gender: s.gender,
        phone: s.phone,
        address: s.address,
        admissionDate: new Date(s.admissionDate),
        status: s.status,
        classId: s.classId,
        parentId: s.parentId
      }
    });
  }

  // Attendance
  for (const a of state.attendance) {
    await prisma.attendance.upsert({
      where: { studentId_date_period: { studentId: a.studentId, date: new Date(a.date), period: a.period } },
      update: {},
      create: {
        id: a.id,
        studentId: a.studentId,
        classId: a.classId,
        date: new Date(a.date),
        status: a.status,
        period: a.period,
        markedByTeacherId: a.markedByTeacherId
      }
    });
  }

  // Marks & Exams
  for (const ex of state.exams) {
    await prisma.exam.upsert({
      where: { id: ex.id },
      update: {},
      create: {
        id: ex.id,
        title: ex.title,
        classId: ex.classId,
        subjectId: ex.subjectId,
        date: new Date(ex.date),
        time: ex.time,
        room: ex.room
      }
    });
  }

  for (const m of state.marks) {
    const exam = state.exams.find((e: any) => e.title === m.examName && e.classId === m.classId && e.subjectId === m.subjectId);
    if (exam) {
      await prisma.mark.upsert({
        where: { id: m.id },
        update: {},
        create: {
          id: m.id,
          studentId: m.studentId,
          classId: m.classId,
          subjectId: m.subjectId,
          examId: exam.id,
          score: m.score,
          maxScore: m.maxScore,
          enteredByTeacherId: m.enteredByTeacherId,
          date: new Date(m.date)
        }
      });
    }
  }

  // Assignments
  for (const a of state.assignments) {
    await prisma.assignment.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        description: a.description,
        classId: a.classId,
        subjectId: a.subjectId,
        teacherId: a.teacherId,
        assignedDate: new Date(a.assignedDate),
        dueDate: new Date(a.dueDate)
      }
    });

    for (const studentId of a.completedBy) {
      await prisma.assignmentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId: a.id, studentId } },
        update: {},
        create: {
          assignmentId: a.id,
          studentId
        }
      });
    }
  }

  // Fees & Payments
  for (const f of state.fees) {
    await prisma.fee.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        studentId: f.studentId,
        title: f.title,
        amount: f.amount,
        paidAmount: f.paidAmount,
        dueDate: new Date(f.dueDate),
        status: f.status
      }
    });
    for (const p of f.payments) {
      await prisma.payment.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          feeId: f.id,
          amount: p.amount,
          date: new Date(p.date),
          method: p.method,
          reference: p.reference
        }
      });
    }
  }

  // Announcements
  for (const a of state.announcements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        body: a.body,
        audience: a.audience,
        classId: a.classId,
        authorName: a.authorName,
        createdAt: new Date(a.createdAt)
      }
    });
  }

  // Messages
  for (const m of state.messages) {
    await prisma.message.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        threadKey: m.threadKey,
        teacherId: m.teacherId,
        parentId: m.parentId,
        studentId: m.studentId,
        fromRole: m.fromRole,
        body: m.body,
        read: m.read,
        createdAt: new Date(m.createdAt)
      }
    });
  }

  // Notifications
  for (const n of state.notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        createdAt: new Date(n.createdAt)
      }
    });
    for (const uid of n.userIds) {
      await prisma.notificationRecipient.upsert({
        where: { notificationId_userId: { notificationId: n.id, userId: uid } },
        update: { read: n.readBy.includes(uid) },
        create: {
          notificationId: n.id,
          userId: uid,
          read: n.readBy.includes(uid)
        }
      });
    }
  }

  // Audit Logs
  for (const l of state.logs) {
    await prisma.auditLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        actorName: l.actorName,
        actorRole: l.actorRole,
        action: l.action,
        detail: l.detail,
        entity: l.entity,
        createdAt: new Date(l.createdAt)
      }
    });
  }

  console.log('Full seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
