import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) throw new Error("No admin user");
  
  const cls = await prisma.schoolClass.findFirst();
  const parent = await prisma.parent.findFirst();
  const subject = await prisma.subject.findFirst();
  const teacher = await prisma.teacher.findFirst();
  
  const resLogin = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: 'demo1234' })
  });
  const dataLogin = await resLogin.json();
  const token = dataLogin.token;

  console.log("LOGIN PASS");

  const resStudent = await fetch('http://localhost:3001/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test Student', email: 'teststudent@example.com', parentId: parent?.id, classId: cls?.id, rollNo: 99, gender: 'Male', phone: '1234', address: '123 St' })
  });
  console.log("STUDENT CREATION STATUS:", resStudent.status);
  
  const resTeacher = await fetch('http://localhost:3001/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test Teacher', email: 'testteacher@example.com', phone: '1234', qualification: 'M.Sc' })
  });
  console.log("TEACHER CREATION STATUS:", resTeacher.status);

  // We need the created student's ID for marks
  const createdStudent = await resStudent.json();
  
  const resMarks = await fetch('http://localhost:3001/api/marks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ classId: cls?.id, subjectId: subject?.id, examName: 'Mid Term Test', scores: { [createdStudent.student?.id]: 95 }, teacherId: teacher?.id })
  });
  console.log("MARKS UPDATE STATUS:", resMarks.status);
}

main().catch(console.error);
