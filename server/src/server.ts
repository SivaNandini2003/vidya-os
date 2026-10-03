import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env['PORT'] || 3001;
const prisma = new PrismaClient();
const JWT_SECRET = process.env['JWT_SECRET'] || "demo_secret_key_fallback";

app.use(cors());
app.use(express.json());

const wrap = (fn: any) => (req: any, res: any, next: any) => fn(req, res, next).catch(next);

const formatDate = (d: Date | null | undefined) => d ? d.toISOString().slice(0, 10) : "";
const formatIso = (d: Date | null | undefined) => d ? d.toISOString() : "";
const toStr = (s: any) => s ?? "";

// --- AUTH ---
app.post('/api/auth/login', wrap(async (req: any, res: any) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { teacher: true, student: true, parent: true }
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  
  const linkedId = user.teacher?.id || user.student?.id || user.parent?.id;
  const { password: _, teacher, student, parent, ...userWithoutPassword } = user;
  
  res.json({ token, user: { ...userWithoutPassword, linkedId, avatarColor: toStr(user.avatarColor) } });
}));

const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/auth/me', auth, wrap(async (req: any, res: any) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id },
    include: { teacher: true, student: true, parent: true }
  });
  if (!user) return res.status(401).json({ error: 'User not found' });
  const linkedId = user.teacher?.id || user.student?.id || user.parent?.id;
  const { password, teacher, student, parent, ...userWithoutPassword } = user;
  res.json({ ...userWithoutPassword, linkedId, avatarColor: toStr(user.avatarColor) });
}));

app.get('/api/state', auth, wrap(async (req: any, res: any) => {
  const [dbUsers, dbTeachers, dbParents, dbStudents, dbClasses, dbSubjects, dbAttendance, dbMarks, dbFees, dbExams, dbAssignments, dbAnnouncements, dbMessages, dbNotifications, dbLogs] = await Promise.all([
    prisma.user.findMany({ include: { teacher: true, student: true, parent: true } }),
    prisma.teacher.findMany({ include: { user: true, classes: true, subjects: true } }),
    prisma.parent.findMany({ include: { user: true } }),
    prisma.student.findMany({ include: { user: true } }),
    prisma.schoolClass.findMany({ include: { subjects: true } }),
    prisma.subject.findMany(),
    prisma.attendance.findMany(),
    prisma.mark.findMany({ include: { exam: true } }),
    prisma.fee.findMany({ include: { payments: true } }),
    prisma.exam.findMany(),
    prisma.assignment.findMany({ include: { submissions: true } }),
    prisma.announcement.findMany(),
    prisma.message.findMany(),
    prisma.notification.findMany({ include: { recipients: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } })
  ]);
  
  const users = dbUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarColor: toStr(u.avatarColor),
    linkedId: u.teacher?.id || u.student?.id || u.parent?.id
  }));

  const teachers = dbTeachers.map(t => ({
    id: t.id,
    name: t.user.name,
    email: t.user.email,
    phone: toStr(t.phone),
    qualification: toStr(t.qualification),
    subjectIds: t.subjects.map(s => s.subjectId),
    classIds: [...new Set([...t.classes.map(c => c.id), ...dbClasses.filter(c => c.classTeacherId === t.id).map(c => c.id)])]
  }));

  const parents = dbParents.map(p => ({
    id: p.id,
    name: p.user.name,
    email: p.user.email,
    phone: toStr(p.phone),
    relation: toStr(p.relation),
    occupation: toStr(p.occupation)
  }));

  const students = dbStudents.map(s => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    rollNo: s.rollNo ?? 0,
    dob: formatDate(s.dob),
    gender: toStr(s.gender) as "Male" | "Female",
    phone: toStr(s.phone),
    address: toStr(s.address),
    classId: s.classId,
    parentId: s.parentId,
    admissionDate: formatDate(s.admissionDate),
    avatarColor: toStr(s.user.avatarColor),
    status: s.status as "active" | "inactive"
  }));

  const classes = dbClasses.map(c => ({
    id: c.id,
    grade: c.grade,
    section: c.section,
    name: c.name,
    classTeacherId: c.classTeacherId,
    room: toStr(c.room),
    subjectTeachers: c.subjects.map(cs => ({ subjectId: cs.subjectId, teacherId: cs.teacherId }))
  }));

  const subjects = dbSubjects.map(s => ({
    id: s.id,
    name: s.name,
    code: s.code
  }));

  const attendance = dbAttendance.map(a => ({
    id: a.id,
    studentId: a.studentId,
    classId: a.classId,
    date: formatDate(a.date),
    status: a.status as any,
    markedByTeacherId: a.markedByTeacherId,
    period: a.period
  }));

  const marks = dbMarks.map(m => ({
    id: m.id,
    studentId: m.studentId,
    classId: m.classId,
    subjectId: m.subjectId,
    examName: m.exam.title,
    score: m.score,
    maxScore: m.maxScore,
    enteredByTeacherId: m.enteredByTeacherId,
    date: formatDate(m.date)
  }));

  const assignments = dbAssignments.map(a => ({
    id: a.id,
    title: a.title,
    description: toStr(a.description),
    classId: a.classId,
    subjectId: a.subjectId,
    teacherId: a.teacherId,
    assignedDate: formatDate(a.assignedDate),
    dueDate: formatDate(a.dueDate),
    completedBy: a.submissions.map(s => s.studentId)
  }));

  const fees = dbFees.map(f => ({
    id: f.id,
    studentId: f.studentId,
    title: f.title,
    amount: f.amount,
    paidAmount: f.paidAmount,
    dueDate: formatDate(f.dueDate),
    status: f.status as any,
    payments: f.payments.map(p => ({
      id: p.id,
      amount: p.amount,
      date: formatDate(p.date),
      method: p.method,
      reference: toStr(p.reference)
    }))
  }));

  const exams = dbExams.map(e => ({
    id: e.id,
    classId: e.classId,
    subjectId: e.subjectId,
    title: e.title,
    date: formatDate(e.date),
    time: toStr(e.time),
    room: toStr(e.room)
  }));

  const announcements = dbAnnouncements.map(a => ({
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience as any,
    classId: a.classId,
    authorName: a.authorName,
    createdAt: formatIso(a.createdAt)
  }));

  const messages = dbMessages.map(m => ({
    id: m.id,
    threadKey: m.threadKey,
    teacherId: m.teacherId,
    parentId: m.parentId,
    studentId: m.studentId,
    fromRole: m.fromRole as any,
    body: m.body,
    createdAt: formatIso(m.createdAt),
    read: m.read
  }));

  const notifications = dbNotifications.map(n => ({
    id: n.id,
    userIds: n.recipients.map(r => r.userId),
    type: n.type as any,
    title: n.title,
    body: n.body,
    createdAt: formatIso(n.createdAt),
    readBy: n.recipients.filter(r => r.read).map(r => r.userId)
  }));

  const logs = dbLogs.map(l => ({
    id: l.id,
    actorName: l.actorName,
    actorRole: l.actorRole as any,
    action: l.action,
    detail: l.detail,
    entity: l.entity,
    createdAt: formatIso(l.createdAt)
  }));

  res.json({
    users, teachers, parents, students, classes, subjects,
    attendance, marks, assignments, fees, exams,
    announcements, messages, notifications, logs
  });
}));

app.post('/api/students', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, email, parentId, classId, rollNo, gender, phone, address, dob, admissionDate } = req.body;
  
  let actualEmail = email;
  if (!actualEmail && name) {
    let base = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
    actualEmail = `${base}@student.vidya.edu`;
    let count = 1;
    while (await prisma.user.findUnique({ where: { email: actualEmail } })) {
      actualEmail = `${base}${count}@student.vidya.edu`;
      count++;
    }
  } else if (!actualEmail) {
    return res.status(400).json({ error: 'Name or Email is required' });
  } else {
    const existing = await prisma.user.findUnique({ where: { email: actualEmail } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
  }
  
  if (!parentId) return res.status(400).json({ error: 'Parent ID is required' });
  
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.create({
    data: {
      email: actualEmail,
      password: passwordHash,
      name,
      role: 'student',
      student: {
        create: {
          parentId: parentId,
          classId,
          rollNo: rollNo ? Number(rollNo) : null,
          gender: gender || "",
          phone: phone || "",
          address: address || "",
          dob: dob ? new Date(dob) : null,
          admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        }
      }
    },
    include: { student: true }
  });
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role,
      actorRole: req.user.role,
      action: 'Student Added',
      detail: `Added student ${name}`,
      entity: 'Student',
      entityId: user.student?.id || null
    }
  });
  
  res.json(user);
}));

app.post('/api/teachers', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, email, phone, qualification, subjectName } = req.body;
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  if (subjectName && subjectName.trim()) {
    const sName = subjectName.trim();
    const existingSub = await prisma.subject.findFirst({ where: { name: { equals: sName } } });
    if (!existingSub) {
      await prisma.subject.create({
        data: { name: sName, code: sName.substring(0, 4).toUpperCase() }
      });
    }
  }

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      role: 'teacher',
      teacher: {
        create: { phone: phone || "", qualification: qualification || "" }
      }
    },
    include: { teacher: true }
  });
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role,
      actorRole: req.user.role,
      action: 'Teacher Added',
      detail: `Added teacher ${name}`,
      entity: 'Teacher',
      ...(user.teacher?.id ? { entityId: user.teacher.id } : {})
    }
  });
  
  res.json(user);
}));

app.delete('/api/teachers/:id', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const teacherId = req.params.id;
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  
  await prisma.teacher.delete({ where: { id: teacherId } });
  await prisma.user.delete({ where: { id: teacher.userId } });
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role,
      actorRole: req.user.role,
      action: 'Teacher Deleted',
      detail: `Deleted teacher ${teacherId}`,
      entity: 'Teacher',
      entityId: teacherId
    }
  });
  res.json({ success: true });
}));

app.delete('/api/classes/:id', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const classId = req.params.id;
  await prisma.schoolClass.delete({ where: { id: classId } });
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role,
      actorRole: req.user.role,
      action: 'Class Deleted',
      detail: `Deleted class ${classId}`,
      entity: 'Class',
      entityId: classId
    }
  });
  res.json({ success: true });
}));

app.put('/api/teachers/:id', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const teacherId = req.params.id;
  const { name, phone, qualification } = req.body;
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  
  await prisma.user.update({
    where: { id: teacher.userId },
    data: { name }
  });
  
  await prisma.teacher.update({
    where: { id: teacherId },
    data: { phone, qualification }
  });
  
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Teacher Updated', detail: `Updated teacher ${name}`, entity: 'Teacher', entityId: teacherId }
  });
  res.json({ success: true });
}));

app.put('/api/classes/:id', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const classId = req.params.id;
  const { grade, section, room } = req.body;
  
  await prisma.schoolClass.update({
    where: { id: classId },
    data: { grade, section, room, name: `${grade}-${section}` }
  });
  
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Class Updated', detail: `Updated class ${grade}-${section}`, entity: 'Class', entityId: classId }
  });
  res.json({ success: true });
}));

app.post('/api/marks', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { classId, subjectId, examName, scores, teacherId } = req.body;
  let exam = await prisma.exam.findFirst({ where: { title: examName, classId, subjectId } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: { title: examName, classId, subjectId, date: new Date() }
    });
  }

  const created = [];
  for (const [studentId, score] of Object.entries(scores)) {
    const rec = await prisma.mark.upsert({
      where: { studentId_examId_subjectId: { studentId, examId: exam.id, subjectId } },
      update: { score: Number(score) },
      create: {
        studentId, classId, subjectId, examId: exam.id, score: Number(score), maxScore: 100, enteredByTeacherId: teacherId, date: new Date()
      }
    });
    created.push(rec);
  }
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role,
      actorRole: req.user.role,
      action: 'Marks Updated',
      detail: `Updated marks for ${examName} in class ${classId}`,
      entity: 'Mark',
      entityId: exam.id
    }
  });

  // Notify students and parents
  const notif = await prisma.notification.create({
    data: { type: 'academic', title: 'New Marks Published', body: `Marks for ${examName} have been published.` }
  });
  for (const studentId of Object.keys(scores)) {
    const st = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true, parent: { include: { user: true } } } });
    if (st) {
      if (st.user) await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: st.user.id } });
      if (st.parent?.user) await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: st.parent.user.id } });
    }
  }

  res.json(created);
}));

app.post('/api/attendance', auth, wrap(async (req: any, res: any) => {
  const { classId, date, entries, teacherId } = req.body;
  const created = [];
  for (const [studentId, status] of Object.entries(entries)) {
    const rec = await prisma.attendance.upsert({
      where: { studentId_date_period: { studentId, date: new Date(date), period: 'Morning Roll Call' } },
      update: { status: status as string },
      create: {
        studentId, classId, date: new Date(date), status: status as string, period: 'Morning Roll Call', markedByTeacherId: teacherId
      }
    });
    created.push(rec);
  }
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role,
      actorRole: req.user.role,
      action: 'Attendance marked',
      detail: `Attendance saved for class ${classId} on ${date}`,
      entity: 'Class',
      entityId: classId
    }
  });

  // Notify students and parents for absent or late
  for (const [studentId, status] of Object.entries(entries)) {
    if (status === 'absent' || status === 'late') {
      const st = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true, parent: { include: { user: true } } } });
      if (st) {
        const notif = await prisma.notification.create({
          data: { type: 'attendance', title: 'Attendance Alert', body: `Student was marked ${status} on ${date}.` }
        });
        if (st.user) await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: st.user.id } });
        if (st.parent?.user) await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: st.parent.user.id } });
      }
    }
  }

  res.json(created);
}));

// ADDING MISSING ENDPOINTS

app.post('/api/students/:id', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id } = req.params;
  const { status, ...other } = req.body;
  const data: any = {};
  if (status) data.status = status;
  // Could update more fields here
  
  const student = await prisma.student.update({ where: { id }, data });
  
  await prisma.auditLog.create({
    data: {
      actorName: req.user.role, actorRole: req.user.role,
      action: 'Student Updated', detail: `Updated student ${student.id}`,
      entity: 'Student', entityId: student.id
    }
  });
  res.json(student);
}));

app.post('/api/classes', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { grade, section, name, classTeacherId, room } = req.body;
  const newClass = await prisma.schoolClass.create({
    data: { grade, section, name, classTeacherId, room: room || "" }
  });
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Class Added', detail: `Added class ${name}`, entity: 'Class', entityId: newClass.id }
  });
  res.json(newClass);
}));

app.post('/api/assignments', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { title, description, classId, subjectId, teacherId, dueDate } = req.body;
  const assignment = await prisma.assignment.create({
    data: { title, description: description || "", classId, subjectId, teacherId, dueDate: new Date(dueDate), assignedDate: new Date() }
  });
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Assignment Created', detail: `Created assignment ${title}`, entity: 'Assignment', entityId: assignment.id }
  });
  res.json(assignment);
}));

app.post('/api/assignments/:id/toggle', auth, wrap(async (req: any, res: any) => {
  const { id } = req.params;
  const { studentId, done } = req.body;
  if (done) {
    await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: id, studentId } },
      update: {}, create: { assignmentId: id, studentId }
    });
  } else {
    try {
      await prisma.assignmentSubmission.delete({
        where: { assignmentId_studentId: { assignmentId: id, studentId } }
      });
    } catch (e) {}
  }
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Assignment Toggled', detail: `Toggled assignment ${id}`, entity: 'Assignment', entityId: id }
  });
  res.json({ success: true });
}));

app.post('/api/fees', auth, wrap(async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { studentId, title, amount, dueDate } = req.body;
  const fee = await prisma.fee.create({
    data: { studentId, title, amount: Number(amount), dueDate: new Date(dueDate), status: 'pending', paidAmount: 0 }
  });
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Fee Added', detail: `Added fee ${title}`, entity: 'Fee', entityId: fee.id }
  });

  const st = await prisma.student.findUnique({ where: { id: studentId }, include: { parent: { include: { user: true } } } });
  if (st?.parent?.user) {
    const notif = await prisma.notification.create({
      data: { type: 'fee', title: 'New Fee Added', body: `A new fee (${title}) of ₹${amount} is due by ${dueDate}.` }
    });
    await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: st.parent.user.id } });
  }
  res.json(fee);
}));

app.post('/api/fees/:id/pay', auth, wrap(async (req: any, res: any) => {
  const { id } = req.params;
  const { amount, method } = req.body;
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) return res.status(404).json({ error: 'Fee not found' });
  const paid = fee.paidAmount + Number(amount);
  const status = paid >= fee.amount ? 'paid' : 'pending';
  
  await prisma.fee.update({ where: { id }, data: { paidAmount: paid, status } });
  const payment = await prisma.payment.create({
    data: { feeId: id, amount: Number(amount), method, date: new Date(), reference: "REF-"+Date.now() }
  });
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Fee Paid', detail: `Paid ${amount} for fee ${id}`, entity: 'Fee', entityId: id }
  });
  res.json(payment);
}));

app.post('/api/announcements', auth, wrap(async (req: any, res: any) => {
  const { title, body, audience, classId, authorName } = req.body;
  const ann = await prisma.announcement.create({
    data: { title, body, audience, classId: classId || null, authorName }
  });
  
  // also create notification
  let usersToNotify = [];
  if (audience === 'all') usersToNotify = await prisma.user.findMany();
  else if (audience === 'teachers') usersToNotify = await prisma.user.findMany({ where: { role: 'teacher' }});
  else if (audience === 'parents') usersToNotify = await prisma.user.findMany({ where: { role: 'parent' }});
  else if (audience === 'students') usersToNotify = await prisma.user.findMany({ where: { role: 'student' }});
  else if (audience === 'class' && classId) {
    const students = await prisma.student.findMany({ where: { classId }, include: { user: true }});
    usersToNotify = students.map((s: any) => s.user);
  }
  
  if (usersToNotify.length > 0) {
    const notif = await prisma.notification.create({
      data: { type: 'announcement', title, body }
    });
    for (const u of usersToNotify) {
      if(u) {
          await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: u.id }});
      }
    }
  }

  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Announcement Published', detail: `Published ${title}`, entity: 'Announcement', ...(ann.id ? { entityId: ann.id } : {}) }
  });
  res.json(ann);
}));

app.post('/api/messages', auth, wrap(async (req: any, res: any) => {
  const { teacherId, parentId, studentId, fromRole, body } = req.body;
  if (!teacherId || !parentId || !studentId || !fromRole || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const threadKey = req.body.threadKey || `${teacherId}::${parentId}::${studentId}`;
  const msg = await prisma.message.create({
    data: { threadKey, teacherId, parentId, studentId, fromRole, body, read: false }
  });
  await prisma.auditLog.create({
    data: { actorName: req.user.role, actorRole: req.user.role, action: 'Message Sent', detail: `Message in ${threadKey}`, entity: 'Message', entityId: msg.id }
  });

  const notif = await prisma.notification.create({
    data: { type: 'message', title: 'New Message', body: `You received a new message.` }
  });
  if (fromRole === 'teacher') {
    const parent = await prisma.parent.findUnique({ where: { id: parentId }, include: { user: true } });
    if (parent?.user) await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: parent.user.id } });
  } else {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
    if (teacher?.user) await prisma.notificationRecipient.create({ data: { notificationId: notif.id, userId: teacher.user.id } });
  }
  res.json(msg);
}));

app.post('/api/notifications/:id/read', auth, wrap(async (req: any, res: any) => {
  const { id } = req.params;
  await prisma.notificationRecipient.updateMany({
    where: { notificationId: id, userId: req.user.id },
    data: { read: true }
  });
  res.json({ success: true });
}));

app.post('/api/notifications/read-all', auth, wrap(async (req: any, res: any) => {
  await prisma.notificationRecipient.updateMany({
    where: { userId: req.user.id },
    data: { read: true }
  });
  res.json({ success: true });
}));

app.patch('/api/messages/read', auth, wrap(async (req: any, res: any) => {
  const { threadKey, forRole } = req.body;
  // Mark messages sent BY the OTHER role as read
  const fromRole = forRole === 'teacher' ? 'parent' : 'teacher';
  await prisma.message.updateMany({
    where: { threadKey, fromRole, read: false },
    data: { read: true }
  });
  res.json({ success: true });
}));

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'VIDYA OS Backend is running' }));

if (process.env['NODE_ENV'] !== 'production' && !process.env['VERCEL']) {
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

export default app;
