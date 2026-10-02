# VIDYA OS

Build a modern, professional School Management Platform web application for a real-world school management startup demo.

The goal is NOT to create a simple school website with many unrelated pages. The application should feel like a connected school operating system, where every action updates the relevant users automatically.

MAIN USP

“The operating system for modern schools. One Student → One Digital Profile → Every School Activity Connected.”

The entire application should revolve around a student's digital profile.

When an admin creates a student and assigns their class and teacher, that same student record must be connected to:

Parent

Class and section

Teachers

Attendance

Marks/results

Assignments

Fees

Announcements

Notifications

Academic performance

Future AI insights

The UI should clearly demonstrate these connected workflows.

1. USER ROLES

Create four separate role-based experiences:

Admin

Admin can:

Manage students

Manage teachers

Create classes and sections

Assign teachers

View attendance analytics

View academic performance

Manage fees

Create announcements

View reports

Monitor overall school activity

View audit/activity logs

Teacher

Teacher can:

View assigned classes

View students

Mark attendance

Enter marks

Create assignments

View student performance

Send messages/announcements to parents

View academic-risk insights

Student

Student can:

View personal profile

View today's attendance

View attendance percentage/trend

View marks/results

View assignments

View upcoming exams

View fee information

View announcements

Receive notifications

Parent

Parent can:

View child profile

View today's attendance

View attendance trend

View recent marks

View pending assignments

View fee status

View upcoming exams

Receive school announcements

Communicate with teachers

View notifications

IMPORTANT:
Each role must have a different dashboard and permissions.

Do NOT show Admin features inside Teacher, Student, or Parent accounts.

2. CORE DEMO WORKFLOWS

The most important part of the application is that these workflows must actually be connected.

WORKFLOW 1 — Student Setup

Admin:

Admin Dashboard
→ Add Student
→ Enter student details
→ Select Parent
→ Assign Class
→ Assign Section
→ Assign Class Teacher
→ Save

After saving:

The student should automatically appear in:

Admin student list

Teacher's assigned class

Student profile

Parent's child profile

Do not use separate dummy records for each dashboard.

Use the SAME student data everywhere.

WORKFLOW 2 — Attendance

Teacher:

Teacher Dashboard
→ Select Class
→ Select Date
→ View students
→ Mark Present/Absent
→ Save Attendance

After saving:

The attendance must automatically update:

Teacher Dashboard
→ Student Attendance
→ Parent Dashboard
→ Admin Attendance Analytics

Example:

If Student A is marked absent today:

Student A's dashboard should show:
“Absent Today”

Parent dashboard should show:
“Absent Today”

Admin analytics should update the attendance statistics.

Show:

Today's attendance

Attendance percentage

Present/absent count

Attendance trend

WORKFLOW 3 — Marks / Results

Teacher:

Teacher Dashboard
→ Select Class
→ Select Subject
→ Enter marks
→ Save

After saving:

The same marks should appear in:

Student Dashboard
→ Results

Parent Dashboard
→ Child Performance

Admin Dashboard
→ Academic Analytics

Show:

Subject-wise marks

Total marks

Percentage

Grade

Recent performance

Performance trend

WORKFLOW 4 — Fees

Admin:

Admin Dashboard
→ Select Student
→ Add Fee
→ Enter amount
→ Set due date
→ Set payment status

Parent:

Parent Dashboard
→ Fee Status

Show:

Total fee

Paid amount

Pending amount

Due date

Payment status

Payment history

For the demo, a simulated payment flow is enough.

Design the system so a real payment gateway can be integrated later.

3. ADMIN DASHBOARD

Create a professional admin dashboard.

Display:

Total Students

Total Teachers

Total Classes

Today's Attendance

Pending Fees

Average Academic Performance

Recent Activities

Include useful charts:

Attendance Analytics

Present vs absent

Attendance trend

Academic Analytics

Average marks

Class performance

Subject performance

Fee Analytics

Paid fees

Pending fees

Collection trend

Recent Activity

Examples:

Student added

Attendance marked

Marks updated

Fee status changed

Announcement published

The dashboard should feel like a real school management control center.

4. TEACHER DASHBOARD

Create a clean teacher dashboard.

Show:

Assigned classes

Total students

Today's attendance

Pending assignments

Recent marks entry

Student performance alerts

Quick actions:

Mark Attendance

Enter Marks

Create Assignment

Send Announcement

Teacher should only see students/classes assigned to them.

5. STUDENT DASHBOARD

Create a student-focused dashboard.

Show:

Student Profile

Name

Student ID

Class

Section

Class teacher

Profile photo/avatar

Attendance

Today's status

Overall percentage

Attendance trend

Academic Performance

Recent marks

Average percentage

Subject performance

Assignments

Pending

Completed

Due dates

Upcoming

Exams

Events

Notifications

School announcements

Teacher messages

Keep the student dashboard simple and easy to understand.

6. PARENT DASHBOARD

The Parent Dashboard is very important.

Design it as a child overview dashboard.

At the top show:

“Good Morning, Parent”

Then show the child's:

Name

Class

Section

Profile

Today's attendance

Main cards:

Attendance

Today's status

Overall percentage

Attendance trend

Academic Performance

Recent marks

Average percentage

Performance trend

Assignments

Pending assignments

Due dates

Fees

Total fee

Paid

Pending

Due date

Upcoming Exams

Subject

Date

Time

Communication

Recent teacher messages

School announcements

Notifications

Show important updates clearly.

The parent should be able to understand the child's overall school status from one screen.

7. COMMUNICATION

Add a simple communication system.

Teacher can:

Teacher
→ Select Student/Parent
→ Send Message

Parent can:

Parent
→ View Message
→ Reply

Also allow:

Admin
→ Create Class Announcement
→ Students and Parents receive notification

Create a notification center with:

Read/unread status

Date/time

Notification type

Keep this simple for the demo but make the UI functional.

8. STUDENT DIGITAL PROFILE

Create one central Student Profile.

This is the core concept of the entire application.

Student Profile should contain:

Basic Information

Student name

Student ID

Date of birth

Gender

Contact information

Academic Information

Class

Section

Class teacher

Subjects

Attendance

Attendance percentage

Attendance history

Results

Subject marks

Grades

Performance trend

Assignments

Pending

Completed

Fees

Paid

Pending

Due dates

Communication

Messages

Announcements

Every module should reference this same student profile.

9. AI ACADEMIC RISK INSIGHT

Add a clearly labelled future-ready AI feature.

Feature name:

Academic Risk Insight

The system should identify students whose:

Attendance is declining
AND/OR

Academic performance is declining.

Generate a simple insight such as:

“Attendance has decreased over the last few weeks and mathematics performance has also declined. Teacher attention may be required.”

Do NOT make exaggerated AI claims.

For the demo, this can be a rule-based simulated AI insight, but design the UI so an actual ML model can be integrated later.

Show this inside the Teacher/Admin dashboard.

10. SECURITY

Include security as part of the architecture.

The UI should demonstrate:

Role-based access control

Authentication

Protected dashboards

Password security

Session management

API authorization

Audit/activity logs

Admin activity tracking

Protection against unauthorized student-data access

Users should never be able to access another role's dashboard simply by changing a URL.

11. DATABASE STRUCTURE

Design the application around relational data.

Main relationships:

Student
→ Parent

Student
→ Class
→ Section
→ Teacher

Student
→ Attendance
→ Date
→ Period
→ Teacher

Student
→ Marks
→ Subject
→ Teacher

Student
→ Assignments

Student
→ Fees

Student
→ Notifications

Student
→ Messages

Use a consistent student ID throughout the entire system.

Do not create disconnected duplicate student data for different dashboards.

12. MAIN NAVIGATION

Admin Sidebar

Dashboard
Students
Teachers
Classes & Sections
Attendance
Academics
Fees
Announcements
Reports & Analytics
Activity Logs
Settings

Teacher Sidebar

Dashboard
My Classes
Students
Attendance
Marks
Assignments
Messages
Announcements
Academic Insights

Student Sidebar

Dashboard
My Profile
Attendance
Results
Assignments
Exams
Fees
Announcements
Notifications

Parent Sidebar

Dashboard
My Child
Attendance
Academic Performance
Assignments
Fees
Exams
Messages
Announcements
Notifications

13. UI / UX DESIGN

Create a modern SaaS-style interface.

The design should look like a real product that could be presented to a startup/client.

Use:

Clean professional layout

Modern cards

Responsive sidebar

Top navigation

Data tables

Charts

Status badges

Modal forms

Search

Filters

Notifications

Empty states

Loading states

Confirmation dialogs

Toast notifications

Avoid making it look like a basic college project.

Use a sophisticated school-management SaaS visual style.

Use a consistent design system throughout the application.

Make it responsive for:

Desktop

Laptop

Tablet

Mobile

14. IMPORTANT DEMO EXPERIENCE

The application should be easy to demonstrate in front of a client.

Create realistic demo data.

Example:

Student:
“Arjun Kumar”

Class:
“10-A”

Teacher:
“Priya Sharma”

Parent:
“Meena Kumar”

Subjects:
Mathematics
Science
English
Computer Science

Use realistic attendance, marks, assignments and fee data.

The demo should allow this story:

ADMIN
→ Creates Arjun Kumar
→ Assigns Class 10-A
→ Assigns Teacher Priya Sharma

↓

TEACHER
→ Sees Arjun in Class 10-A
→ Marks Arjun absent

↓

STUDENT
→ Logs in
→ Sees “Absent Today”

↓

PARENT
→ Logs in
→ Sees “Arjun was absent today”

↓

ADMIN
→ Attendance analytics updates

Then demonstrate:

TEACHER
→ Enters Mathematics marks

↓

STUDENT
→ Result updates

↓

PARENT
→ Child performance updates

↓

ADMIN
→ Academic analytics updates

Then demonstrate:

ADMIN
→ Adds fee

↓

PARENT
→ Sees pending fee

This connected workflow is the main selling point of the demo.

15. PROJECT STRUCTURE

Keep the application modular and scalable.

Suggested structure:

components/
pages/
layouts/
services/
hooks/
data/
types/
utils/

Separate components for:

Dashboard

Sidebar

Navbar

Student Profile

Attendance

Marks

Fees

Assignments

Notifications

Messages

Charts

Tables

Modals

Avoid putting the entire application inside one large component.

16. DATA AND FUNCTIONALITY

For the demo:

Use a proper centralized data/state structure.

CRUD functionality should work for:

Students

Teachers

Classes

Attendance

Marks

Assignments

Fees

Announcements

When data is changed in one role, the relevant dashboards should reflect the change.

Do NOT make buttons that only display “Coming Soon” for the main demo workflows.

The four core workflows must actually work.

17. FUTURE SCALABILITY

Keep these as future roadmap features rather than making the current demo unnecessarily large:

Phase 1:
Functional Demo

Phase 2:
Full School Management Platform

Phase 3:
Advanced/Smart Features

Future possibilities:

Online payment gateway

SMS notifications

WhatsApp integration

Email notifications

Mobile application

Document management

Biometric attendance

Advanced AI analytics

Predictive academic insights

Transport management

Library management

Payroll

Parent-teacher meeting scheduling

Do NOT overload the current demo with all these modules.

18. FINAL PRIORITY

If there is a conflict between adding more pages and making the core workflows functional, ALWAYS prioritize the workflows.

The application should NOT feel like:

“Many pages with fake data.”

It should feel like:

“One connected school system where every student activity is linked.”

The strongest demo flow should be:

Admin creates student
→ Assigns class and teacher
→ Teacher marks attendance
→ Student sees attendance
→ Parent sees attendance
→ Admin analytics updates

Then repeat the same connected concept with:

Marks
→ Student result
→ Parent performance
→ Admin analytics

And:

Fees
→ Parent fee status

Make this the central experience of the entire application.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/229570ff-3533-436c-bc98-872605112ca9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
