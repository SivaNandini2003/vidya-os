import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding minimal development data...');

  const passwordHash = await bcrypt.hash('demo1234', 10);

  // 1. Create Admin User
  await prisma.user.upsert({
    where: { email: 'admin@vidya.edu' },
    update: {},
    create: {
      email: 'admin@vidya.edu',
      password: passwordHash,
      name: 'Rohit Malhotra',
      role: 'admin',
      avatarColor: '#1f4d8f',
    },
  });

  // 2. Create Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'priya.sharma@vidya.edu' },
    update: {},
    create: {
      email: 'priya.sharma@vidya.edu',
      password: passwordHash,
      name: 'Priya Sharma',
      role: 'teacher',
      avatarColor: '#0f766e',
      teacher: {
        create: {
          phone: '+91 98200 11223',
          qualification: 'M.Sc Mathematics, B.Ed',
        }
      }
    },
    include: { teacher: true }
  });

  // 3. Create Parent
  const parentUser = await prisma.user.upsert({
    where: { email: 'meena.kumar@gmail.com' },
    update: {},
    create: {
      email: 'meena.kumar@gmail.com',
      password: passwordHash,
      name: 'Meena Kumar',
      role: 'parent',
      avatarColor: '#7c2d5f',
      parent: {
        create: {
          phone: '+91 90000 10001',
          relation: 'Mother',
          occupation: 'Bank Manager'
        }
      }
    },
    include: { parent: true }
  });

  // 4. Create Class & Subject
  const schoolClass = await prisma.schoolClass.upsert({
    where: { grade_section: { grade: '10', section: 'A' } },
    update: {},
    create: {
      grade: '10',
      section: 'A',
      name: '10-A',
      room: 'Block A · 204',
      classTeacherId: teacherUser.teacher!.id,
    }
  });

  const subjectsData = [
    { id: 'sub-math', name: 'Mathematics', code: 'MATH' },
    { id: 'sub-sci', name: 'Science', code: 'SCI' },
    { id: 'sub-eng', name: 'English', code: 'ENG' },
    { id: 'sub-cs', name: 'Computer Science', code: 'CS' }
  ];

  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { id: s.id, name: s.name, code: s.code }
    });

    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: schoolClass.id, subjectId: subject.id } },
      update: {},
      create: {
        classId: schoolClass.id,
        subjectId: subject.id,
        teacherId: teacherUser.teacher!.id
      }
    });
  }

  // 5. Create Students
  await prisma.user.upsert({
    where: { email: 'arjun.kumar@student.vidya.edu' },
    update: {},
    create: {
      email: 'arjun.kumar@student.vidya.edu',
      password: passwordHash,
      name: 'Arjun Kumar',
      role: 'student',
      avatarColor: '#1f4d8f',
      student: {
        create: {
          rollNo: 1,
          dob: new Date('2010-01-10'),
          gender: 'Male',
          classId: schoolClass.id,
          parentId: parentUser.parent!.id
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { email: 'kavya.iyer@student.vidya.edu' },
    update: {},
    create: {
      email: 'kavya.iyer@student.vidya.edu',
      password: passwordHash,
      name: 'Kavya Iyer',
      role: 'student',
      avatarColor: '#0f766e',
      student: {
        create: {
          rollNo: 2,
          dob: new Date('2011-02-11'),
          gender: 'Female',
          classId: schoolClass.id,
          parentId: parentUser.parent!.id
        }
      }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
