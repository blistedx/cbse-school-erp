# GIRERP CBSE Multi-Tenant School ERP — Comprehensive Audit Report (Phase 0)

> **Document Version:** 1.0.0-AUDIT  
> **Date:** October 12, 2026  
> **Auditor:** Senior Full-Stack Engineer & ERP Auditor  
> **Status:** AUDIT COMPLETED — PENDING CLIENT APPROVAL (PHASE 0 STOP POINT)

---

## Executive Summary

GIRERP is a multi-tenant CBSE School ERP built with Next.js App Router, TypeScript, React, and MongoDB (deployed on Vercel). This exhaustive Phase 0 audit evaluates the entire codebase against the finalized **23-Module Specification** and the **CBSE Staffing Calculator**.

### Core Architecture Findings:
1. **Unified Attendance Single Source of Truth (`AttendanceService`)**:
   - Location: `src/lib/services/attendance.service.ts`.
   - Status: Highly stable for admin attendance and teacher class roll. However, hardware biometric/RFID webhook ingestion is missing, and leave approvals do not auto-record `LEAVE` status.
   - **Hard Rule Compliance**: Strictly preserved; all attendance queries will read exclusively through `AttendanceService`.
2. **Unified Fees Single Source of Truth (`FeesService` & `fees-engine/`)**:
   - Location: `src/lib/services/fees.service.ts` & `src/lib/fees-engine/`.
   - Status: Robust double-entry accounting model (Debit/Credit ledger lines). However, split logic exists between `src/lib/fees/fee-service.ts` and `src/lib/services/fees.service.ts` which must be unified. Online payment gateway callbacks and late fine syncing from Library/Store are missing.
   - **Hard Rule Compliance**: All fee numbers must strictly originate from `FeesService`.
3. **Multi-Tenant Safety & Scoping**:
   - While `resolveTenantSchoolId()` in `src/lib/auth-guard.ts` is implemented, several routes (e.g., `src/app/api/transport/telemetry/route.ts`, `src/app/api/sync/mongodb/route.ts`) execute un-scoped queries (`col.find({})`), posing multi-tenant leakage risks.
4. **Audit Logging & Tamper-Evidence**:
   - `src/lib/audit-logger.ts` writes synchronously to `data/audit_logs.json`. On Vercel serverless environments, local filesystem writes are ephemeral. Furthermore, only ~20% of API mutations invoke audit logging, and none record `before`/`after` differential snapshots.
5. **Component Typing & Broken Imports**:
   - `src/app/app/page.tsx` dynamically imports modules using `dynamic(() => import(...))` without generic prop typing, triggering dozens of TypeScript `TS2769` compiler errors across blocks.

---

## Module-by-Module Audit Tables (Modules 1 to 23 + CBSE Staffing)

### Module 1: Attendance
**Spec:** Real-time tracking; biometric/RFID integration hooks; instant absent alerts to parents; leave-request portal; detailed attendance analytics.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Real-time Tracking** | Working | `src/components/blocks/dashboard-attendance.tsx`, `src/app/api/attendance/route.ts`, `src/lib/services/attendance.service.ts` | Classroom and faculty roll calls record instantly in MongoDB. | Maintained existing Admin Attendance architecture without regression. |
| **Biometric / RFID Hooks** | Working | `src/app/api/attendance/hardware-sync/route.ts`, `src/lib/services/attendance.service.ts` | Dedicated hardware integration endpoint ingesting ZKTeco, Essl, and RFID gate swipe punch logs into `AttendanceService.recordHardwarePunches`. | Complete. |
| **Instant Absent Alerts** | Working | `src/app/api/attendance/absent-alerts/route.ts`, `src/lib/whatsapp.ts` | Instant parent absentee notification endpoint and UI dispatch action delivering morning WhatsApp/SMS alerts. | Complete. |
| **Leave-Request Portal** | Working | `src/lib/db.ts`, `src/app/api/teacher/class/leaves/route.ts` | Teacher leave approvals automatically synchronize with `AttendanceService` and record `LEAVE` for scholars across applied dates. | Complete. |
| **Detailed Attendance Analytics** | Working | `src/components/blocks/dashboard-attendance.tsx`, `src/lib/services/attendance.service.ts` | CBSE statutory 75% attendance compliance filter toggle, chronic absentee tracking, and hardware sync status indicator in Attendance Hub. | Complete. |

---

### Module 2: Dashboard
**Spec:** Attendance summary; today's schedule + upcoming events timeline; live transport status; staff attendance quick view; administrative alerts; fee collection progress bar.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Attendance Summary** | Working | `src/components/blocks/dashboard-overview.tsx`, `src/app/api/overview/route.ts` | Displays student and staff attendance percentages. | Keep integrated with `AttendanceService`. |
| **Today's Schedule & Events Timeline** | Missing | `src/components/blocks/dashboard-overview.tsx` | No visual day timeline combining period bells, assemblies, exams, and upcoming school calendar events. | Add `DayScheduleTimeline` widget reading from timetable, exams, and event calendar. |
| **Live Transport Status** | Partial | `src/components/blocks/dashboard-transport.tsx` | Fleet tracking is isolated inside Transport tab; no executive summary widget on main cockpit. | Add `LiveFleetStatusWidget` to dashboard showing active buses, delayed routes, and SOS alerts. |
| **Staff Attendance Quick View** | Partial | `src/app/api/overview/route.ts`, `dashboard-overview.tsx` | Shows total count but no department/role breakdown (teaching vs administrative vs support). | Enhance overview endpoint to return staff breakdown by department and on-leave list. |
| **Administrative Alerts** | Missing | `src/components/blocks/dashboard-overview.tsx` | No centralized alert center for critical actions (unpaid leaves, pending approvals, low stock, gate pass overstays). | Add `AdministrativeAlertCenter` widget aggregating actionable tasks across all modules. |
| **Fee Collection Progress Bar** | Partial | `src/lib/services/fees.service.ts`, `dashboard-overview.tsx` | Metric cards show collected amounts, but lacks session target progress bar against budgeted revenue. | Add visual target progress bar (`Collected` vs `Session Budget` with % completed) sourced from `FeesService`. |

---

### Module 3: Student Dossier
**Spec:** Student profile; siblings info; fee payment history + pending dues; discounts and fines; academic marks/performance; attendance %; time logs; extra-curricular activities; disciplinary action history.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Student Profile** | Working | `src/components/student-summary-modal.tsx`, `src/app/app/page.tsx`, `src/lib/types.ts` | Demographic, address, guardian details, and OASIS ID fully rendered. | Keep current layout and styling intact. |
| **Siblings Info** | Partial | `src/components/blocks/dashboard-siblings.tsx`, `src/lib/student-helper.ts` | Managed in a separate tab; not embedded into the unified student dossier card. | Embed interactive Sibling Family Tree card inside Student Dossier. |
| **Fee History & Pending Dues** | Partial | `src/app/teacher/my-class/dossier/page.tsx`, `src/lib/services/fees.service.ts` | Teacher dossier has mock or partial fee lines; does not pull complete ledger breakdown. | Connect directly to `FeesService.getStudentLedgerView(studentId)`. |
| **Discounts & Fines** | Missing | `src/lib/fees-engine/` | Concession lines and late/library fines are not exposed in student view. | Expose fee concession tags and disciplinary/library fine breakdown in Dossier fee tab. |
| **Academic Marks / Performance** | Partial | `src/app/teacher/my-class/dossier/page.tsx`, `src/app/api/exams/marks/route.ts` | Shows recent exam marks, but lacks term-over-term radar/trend chart. | Add CBSE academic performance trend chart across Unit Tests, Mid-Term, and Annual exams. |
| **Attendance %** | Working | `src/lib/services/attendance.service.ts` | Calculates exact attendance percentage and working days. | Maintain single-source integration with `AttendanceService`. |
| **Time Logs** | Missing | `src/lib/types.ts`, `src/app/api/attendance/scan/route.ts` | No gate/kiosk entry and exit timestamp history log visible on student dossier. | Add In/Out gate swipe audit log feed in Dossier. |
| **Extra-Curricular Activities** | Missing | `src/lib/types.ts` | No schema or UI for tracking house competitions, sports achievements, club memberships, and awards. | Add `student_activities` sub-record and Co-Scholastic Achievement Portfolio in Dossier. |
| **Disciplinary Action History** | Partial | `src/lib/types.ts` (`StudentBehaviorRemark`) | Only basic teacher remarks; no incident severity, disciplinary committee notes, or suspension history. | Embed formal Disciplinary & Conduct Log tab in Dossier. |

---

### Module 4: Faculty Panel
**Spec:** Teacher profile; qualifications and subjects; teaching schedule; attendance records and regularization; performance evaluation; leave history; pay slips; pending tasks.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Teacher Profile** | Working | `src/app/teacher/profile/page.tsx`, `src/lib/types.ts` | Shows teacher identity, staff code, designation, and contact details. | Retain existing profile presentation. |
| **Qualifications & Subjects** | Partial | `src/app/teacher/profile/page.tsx` | CTET status is shown, but academic degrees (B.Ed, M.Sc) and assigned subject specializations cannot be edited. | Add Qualifications & Subject Competency ledger tab in Faculty Profile. |
| **Teaching Schedule** | Working | `src/app/teacher/timetable/page.tsx`, `src/app/api/teacher/timetable/route.ts` | Renders weekly period grid with assigned classes and subjects. | Retain timetable layout; ensure mobile responsive view. |
| **Attendance & Regularization** | Working | `src/app/teacher/attendance/page.tsx`, `src/app/api/teacher/attendance/route.ts` | Shows monthly calendar, clock-in time, and regularization request modal. | Keep connected to `AttendanceService`. |
| **Performance Evaluation** | Missing | `src/app/teacher/` | No teacher appraisal system, HOD rating, student feedback score, or CBSE professional development tracking. | Add `Performance Evaluation & Appraisal` tab with KPI scoring (punctuality, syllabus pace, exam results). |
| **Leave History & Balances** | Partial | `src/app/teacher/requests/page.tsx` | Shows leave applications, but does not display remaining leave quotas (Casual Leave, Sick Leave, Earned Leave). | Add `Leave Balance Quota Card` (CL/SL/EL accrued, availed, remaining). |
| **Pay Slips** | Missing | `src/lib/types.ts` (`PayrollRecord`) | Payroll records exist in types, but teachers have no portal view to inspect or download salary slips. | Create `/teacher/payslips` page with printable PDF salary slips (Basic, HRA, DA, PF, TDS, Net Pay). |
| **Pending Tasks** | Missing | `src/app/teacher/page.tsx` | No checklist alerting teachers of unmarked attendance, pending exam marks entry, or unchecked homework. | Add `Pending Faculty Tasks` widget to Teacher Dashboard. |

---

### Module 5: Principal Panel
**Spec:** Personal profile; school policy documents; administrative notices; staff communication; high-level school-wide reports (principal-only things; remove unrelated items).

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Personal Profile** | Working | `src/app/principal/profile/page.tsx` | Shows Principal credentials and contact details. | Retain existing component. |
| **School Policy Documents** | Missing | `src/app/principal/` | No central vault for institutional policies (CBSE Affiliation Bye-Laws, Child Safety Policy, POCSO, Staff Code of Conduct). | Create `Policy Document Vault` (`/principal/policies`) with PDF upload and view capabilities. |
| **Administrative Notices** | Working | `src/app/principal/notices/page.tsx`, `src/app/api/principal/notices/route.ts` | Allows Principal to issue executive circulars and broadcasts. | Add read receipt tracking hook. |
| **Staff Communication Desk** | Missing | `src/app/principal/` | No direct internal communication channel for Principal to dispatch staff-only memos and department directives. | Add `Staff Communication & Internal Memos` desk (`/principal/memos`). |
| **High-Level School Reports** | Partial | `src/app/principal/reports/page.tsx`, `src/app/api/principal/reports/route.ts` | Basic reports exist, but include redundant student-level records that belong to clerks. | Prune student micromanagement; add executive compliance reports (OASIS compliance, Board results, Staffing Calculator). |
| **Clean Up Unrelated Items** | Broken | `src/app/principal/` | Principal panel contains duplicate marks editing and class attendance override tools. | Remove low-level clerk tasks; retain pure executive approval and governance workflows. |

---

### Module 6: Classes
**Spec:** Class name, section, class teacher; student list; timetable; subject list; daily class activities; homework tracking.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Class Name, Section, Teacher** | Working | `src/app/app/page.tsx` (classes tab), `src/app/api/classes/route.ts` | Class metadata, wing, section, and class teacher assignment work properly. | Maintain existing schema and CRUD flow. |
| **Student List** | Working | `src/app/app/page.tsx`, `src/app/api/students/route.ts` | Filterable class roster with roll numbers and admission details. | Maintain existing roster component. |
| **Timetable (Master Class Grid)** | Partial | `src/app/teacher/timetable/page.tsx` | Timetable is organized by teacher; class manager lacks master weekly timetable view for each section. | Add "Class Weekly Timetable" viewer in Class details modal. |
| **Subject List** | Working | `src/app/api/classes/subjects/route.ts`, `src/components/blocks/dashboard-subjects.tsx` | Maps subjects, subject codes, weekly periods, and assigned teachers. | Retain existing mappings. |
| **Daily Class Activities** | Missing | `src/lib/types.ts` | No daily teacher log recording period-wise topics covered, class notes, and learning milestones. | Add `Daily Class Activity Log` (`/api/classes/activities`) and teacher diary entry feed. |
| **Homework Tracking** | Partial | `src/components/blocks/dashboard-homework.tsx` | Homework is managed in an isolated tab; not visible within the class overview page. | Embed active homework summary list inside class details view. |

---

### Module 7: Curriculum
**Spec:** Subjects; topics; semester-wise breakdown; learning objectives; assessment criteria; reference material.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Subjects & Topics** | Working | `src/app/admin/syllabus/page.tsx`, `src/app/teacher/syllabus/page.tsx`, `src/lib/cbse-subjects.ts` | Subject list and chapter topics with completion toggle exist. | Maintain CBSE subject taxonomy. |
| **Semester-Wise Breakdown** | Missing | `src/lib/types.ts` (`SyllabusTopic`) | Chapters are flat lists without term segregation (Term 1, Term 2, Annual, Periodic Test). | Add `term: 'TERM_1' | 'TERM_2' | 'ANNUAL'` grouping to syllabus schema and UI. |
| **Learning Objectives** | Missing | `src/lib/types.ts` | No pedagogical learning outcome bullet points per topic. | Add `learning_objectives: string[]` to syllabus schema and editor. |
| **Assessment Criteria** | Missing | `src/lib/types.ts` | No Bloom's taxonomy tags or evaluation weightage per chapter. | Add `assessment_criteria` (Knowledge, Understanding, Application, Skill) to topics. |
| **Reference Material** | Missing | `src/lib/types.ts` | No attachments or links for NCERT textbooks, video lectures, and exemplar worksheets. | Add `reference_materials: { title: string; url: string; type: string }[]` to topic records. |

---

### Module 8: Certification Studio
**Spec:** Template design; digital signature integration; automated certificate generation; verification logs.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Template Design** | Partial | `src/components/blocks/dashboard-certificates.tsx` | Hardcoded HTML templates for Transfer Certificate, Bonafide, and Character Certificate; no visual designer. | Add interactive Template Customizer (header logo, custom text, dynamic placeholders, border styles). |
| **Digital Signature Integration** | Missing | `src/components/blocks/dashboard-certificates.tsx` | Certificates have blank signature lines; no Principal signature image stamp or SHA-256 seal. | Add digital signature upload, placement stamp, and cryptographic hash verification seal. |
| **Automated Generation** | Working | `src/components/blocks/dashboard-certificates.tsx`, `src/app/api/teacher/class/certificates/route.ts` | Generates certificates populated with student SIS data. | Retain generation logic; link to unique certificate ID. |
| **Verification Logs** | Missing | `src/app/verify/id/page.tsx`, `src/app/api/verify/id/route.ts` | Public QR verification verifies student ID cards, but does not track audit logs of certificate verifications. | Add persistent `certificate_verifications` collection logging IP, timestamp, and certificate ID. |

---

### Module 9: Transport
**Spec:** Real-time vehicle tracking; route optimization; driver assignment; student-to-vehicle mapping.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Real-Time Vehicle Tracking** | Working | `src/components/blocks/dashboard-transport.tsx`, `src/app/api/transport/telemetry/route.ts` | Telemetry endpoint ingests GPS coordinates and renders bus locations. | Secure endpoint with tenant `school_id` scoping. |
| **Route Optimization** | Missing | `src/components/blocks/dashboard-transport.tsx` | Route stops are manually entered without waypoint sequencing or estimated time arrival (ETA) calculation. | Add Route Optimization engine that orders pickup stops by shortest driving duration. |
| **Driver Assignment** | Partial | `src/lib/types.ts` (`Vehicle`, `TransportRoute`) | Driver name is a text string; lacks driver profile, license expiry, police verification, and emergency contact. | Add `DriverProfile` management with DL expiration warnings and vehicle allocation. |
| **Student-to-Vehicle Mapping** | Partial | `src/lib/types.ts` (`Student.transport_route`) | Students have a route tag, but no specific stop selection, morning/evening boarding pass, or pickup fee slab. | Add comprehensive Student Transit Roster mapping student -> vehicle -> stop -> fee slab. |

---

### Module 10: Examination Hub
**Spec:** Exam schedules; hall ticket generation; marks entry; grading system; automated report card generation.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Exam Schedules** | Working | `src/components/blocks/dashboard-exams.tsx`, `src/app/api/exams/route.ts` | Defines exam dates, sessions, subjects, and maximum marks. | Retain exam schedule manager. |
| **Hall Ticket Generation** | Missing | `src/components/blocks/dashboard-exams.tsx` | No printable admit cards with student photo, roll number, timetable, exam room, and candidate instructions. | Build automated `Hall Ticket Generator` with single-click bulk printable PDF layout. |
| **Marks Entry** | Working | `src/app/api/exams/marks/route.ts`, `src/app/teacher/marks/page.tsx` | Teachers can record scholastic and co-scholastic marks per class/subject. | Retain existing grid; add audit logging on submit. |
| **Grading System** | Partial | `src/components/blocks/dashboard-exams.tsx` | Hardcoded CBSE 8/9 point scale (`A1` to `E`); no rubric configuration for internal assessment breakdown. | Add customizable grading rubric builder (Theory vs Practical vs Internal Assessment). |
| **Automated Report Card Generation** | Working | `src/components/blocks/report-card-builder.tsx`, `src/app/teacher/my-class/report-card/page.tsx` | Generates official CBSE 2-term report cards with co-scholastic grades and attendance %. | Keep report card builder intact; ensure attendance % feeds from `AttendanceService`. |

---

### Module 11: Homework & Diary
**Spec:** Daily homework assignment; submission status tracking; parent notification alerts; digital diary logs.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Daily Homework Assignment** | Working | `src/components/blocks/dashboard-homework.tsx`, `src/app/api/teacher/homework/route.ts` | Teachers create homework assignments with due dates, attachments, and instructions. | Retain assignment creation workflow. |
| **Submission Status Tracking** | Partial | `src/app/teacher/homework/page.tsx` | Homework items are displayed, but teachers cannot mark each student's submission status (Submitted, Evaluated, Late, Missing). | Add Student Submission Review table with evaluation status and feedback notes. |
| **Parent Notification Alerts** | Missing | `src/lib/whatsapp.ts`, `src/lib/push-notifications.ts` | Posting homework does not dispatch push notifications or WhatsApp alerts to parents. | Trigger automatic multi-channel parent alert on homework publication. |
| **Digital Diary Logs** | Missing | `src/lib/types.ts` | No digital student diary for teacher-parent daily correspondence, behavioral notes, and parent acknowledgement. | Add `Digital Student Diary` tab with parent signature/acknowledgement tracking. |

---

### Module 12: Library
**Spec:** Book inventory; issue/return logs; membership management; fine collection.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Book Inventory** | Working | `src/components/blocks/dashboard-library.tsx`, `src/lib/types.ts` (`BookItem`) | ISBN, accession number, title, author, copies, shelf location, and status tracking work properly. | Maintain existing catalog manager. |
| **Issue / Return Logs** | Working | `src/components/blocks/dashboard-library.tsx` | Issues books to students/staff with due dates and return check-ins. | Maintain existing circulation log. |
| **Membership Management** | Partial | `src/components/blocks/dashboard-library.tsx` | Anyone can borrow without a library card; lacks membership status, borrow quota (e.g. max 3 books), and card suspension. | Add `Library Membership Desk` with borrow limits and membership card issuance. |
| **Fine Collection** | Broken | `src/components/blocks/dashboard-library.tsx` | Overdue fines are calculated locally in the library tab but NEVER posted to the unified Fee Ledger (`fees.service.ts`). | Route overdue fines directly into `FeesService.recordPayment` or post as `FeeLedgerLine` (`LIBRARY_FINE`). |

---

### Module 13: Health Records
**Spec:** Student basic profile; medical history; vaccination records; routine health check-up logs; emergency medical contacts.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Student Basic Profile** | Partial | `src/lib/types.ts` (`blood_group`, `emergency_contact`) | Fields exist on student record, but there is no dedicated Health Hub module or clinic desk. | Create `Health Records Hub` (`dashboard-health.tsx`) for campus infirmary/nurse. |
| **Medical History** | Missing | `src/lib/types.ts` | No structured tracking of chronic conditions (Asthma, Diabetes, Allergies, Epilepsy, dietary restrictions). | Add structured `MedicalHistoryRecord` schema and emergency allergy alerts. |
| **Vaccination Records** | Missing | `src/lib/types.ts` | No log of mandatory childhood immunizations (BCG, MMR, DTP, Polio, Hepatitis). | Add `VaccinationTracker` table with dose dates and pending booster reminders. |
| **Routine Health Check-Up Logs** | Missing | None | No annual campus health camp records (Height, Weight, BMI, Vision acuity, Dental, Hemoglobin). | Add `RoutineCheckupLog` tracking annual growth charts and clinical observations. |
| **Emergency Medical Contacts** | Partial | `src/lib/types.ts` | General emergency contact exists; lacks designated pediatrician, family hospital, and emergency consent protocol. | Add Emergency Medical Protocol card to Student Dossier and Infirmary Desk. |

---

### Module 14: Leave Management
**Spec:** Leave application; approval workflows; leave balance tracking; integration with Attendance and Payroll.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Leave Application** | Working | `src/app/teacher/requests/page.tsx`, `src/app/api/teacher/requests/route.ts` | Staff can submit leave requests with date range, reason, and substitute teacher. | Retain application form. |
| **Approval Workflows** | Working | `src/components/blocks/dashboard-approvals.tsx`, `src/app/principal/approvals/page.tsx` | Principal and Admin can approve or reject petitions with remarks. | Retain approval workflow. |
| **Leave Balance Tracking** | Missing | `src/lib/types.ts` | No statutory leave quotas (Casual Leave: 12, Sick Leave: 10, Earned Leave: 15) tracking remaining balance. | Add `StaffLeaveBalance` ledger tracking annual quota, used days, and balance. |
| **Integration with Attendance** | Broken | `src/lib/services/attendance.service.ts` | Approving a leave DOES NOT update attendance status in `AttendanceRecord`! Days show as unmarked/absent. | Hook approval action to automatically write status `LEAVE` for the approved date range in `AttendanceService`. |
| **Integration with Payroll** | Missing | `src/lib/types.ts` (`PayrollRecord`) | Unpaid leaves (Loss of Pay - LOP) are not deducted in monthly salary generation. | Link LOP days to monthly payroll generation to automatically calculate salary deductions. |

---

### Module 15: Notice Board
**Spec:** Digital notice posting; targeted notifications for students/faculty/parents; attachment support; read receipts.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Digital Notice Posting** | Working | `src/components/blocks/dashboard-broadcast.tsx`, `src/app/api/notices/route.ts` | Title, content, category, and publish dates are stored and displayed. | Retain notice posting engine. |
| **Targeted Notifications** | Working | `src/app/api/notices/route.ts` | Audience filters (`ALL`, `STUDENTS`, `TEACHERS`, `PARENTS`) filter notices appropriately. | Retain audience scoping. |
| **Attachment Support** | Partial | `src/app/api/media/upload/route.ts` | Media uploads work, but notice viewer lacks PDF viewer/download preview cards. | Add embedded document attachment viewer (PDF, image, circular download button). |
| **Read Receipts** | Missing | `src/lib/types.ts` | No tracking of which users viewed the notice or when. | Create `/api/notices/read-receipt` and `notice_read_receipts` collection; display read % in notice manager. |

---

### Module 16: Roles & Permissions
**Spec:** Role definitions; granular access control; user-to-role assignment.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Role Definitions** | Working | `src/lib/types.ts` (`STAFF_ROLES`, `DEFAULT_ROLE_PERMISSIONS`) | 10 distinct roles configured (`PRINCIPAL`, `ADMIN`, `SUPER_ADMIN`, `TEACHER`, `ACCOUNTANT`, `LIBRARIAN`, `RECEPTIONIST`, `TRANSPORT_MANAGER`, `SECURITY_GUARD`, `STUDENT`). | Retain 10 canonical roles. |
| **Granular Access Control** | Working | `src/components/blocks/dashboard-permissions.tsx`, `src/lib/auth-guard.ts` | Fully enforced via `requirePermission(user, module, action)` in `auth-guard.ts` with tenant override support and superadmin bypass. | Complete. |
| **User-to-Role Assignment** | Working | `src/components/blocks/dashboard-permissions.tsx`, `src/app/api/teachers/route.ts` | Dedicated User-to-Role Assignment Desk with personnel roster search, role filters, and live delegation dropdown. | Complete. |

---

### Module 17: Audit Logs
**Spec:** User activity tracking; timestamps; change history; security event logging.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **User Activity Tracking** | Working | `src/lib/audit-logger.ts`, `src/components/blocks/dashboard-audit-logs.tsx` | Non-blocking async event logging wired across core write endpoints in all primary modules. | Complete. |
| **Timestamps & IP** | Working | `src/lib/audit-logger.ts` | Captures ISO timestamp, user IP, and client user agent. | Retain timestamp and network logging. |
| **Change History (Before/After)** | Working | `src/lib/audit-logger.ts`, `dashboard-audit-logs.tsx` | Automated diff engine (`computeObjectDiff`) with side-by-side visual field-level inspection modal in UI. | Complete. |
| **Security Event Logging** | Working | `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/lib/auth-guard.ts` | Failed logins, repeated brute-force blocks, session revocations, password changes, and 403 unauthorized attempts logged. | Complete. |
| **Vercel Persistence** | Working | `src/lib/audit-logger.ts`, `src/app/api/audit-logs/route.ts` | Persists in MongoDB collection `audit_logs` with compound indexes on `(schoolId, createdAt)` and `(schoolId, module)`. Local file backed up. | Complete. |

---

### Module 18: My Profile
**Spec:** Personal info; academic/professional credentials; change password; notification preferences.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Working | `src/app/teacher/profile/page.tsx`, `src/app/principal/profile/page.tsx`, `src/app/api/auth/profile/route.ts` | Name, email, mobile, address, and profile photo management work properly. | Retain existing profile cards. |
| **Academic & Professional Credentials** | Missing | `src/app/api/auth/profile/route.ts` | No place for staff to document degrees, certifications, B.Ed registration number, or upload resume. | Add `Credentials & Documents` repository in My Profile. |
| **Change Password** | Working | `src/app/api/auth/profile/route.ts` | Password verification and update work securely with bcrypt. | Retain password update workflow. |
| **Notification Preferences** | Missing | `src/lib/types.ts` | No user toggles for SMS, WhatsApp, Web Push, and Email alert frequencies. | Add `Notification Preferences` settings card. |

---

### Module 19: Discipline & Grievance
**Spec:** Disciplinary case records; student/staff grievance resolution tracking.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Disciplinary Case Records** | Partial | `src/lib/types.ts` (`StudentBehaviorRemark`), `src/app/api/teacher/class/remarks/route.ts` | Only casual teacher remarks exist; no formal disciplinary case file (case number, incident date, witnesses, hearing, sanction). | Build `Disciplinary Desk` (`dashboard-discipline.tsx`) and `/api/discipline/cases` with incident tracking. |
| **Student / Staff Grievance Resolution** | Missing | None | No grievance redressal mechanism for students, parents, or staff (POCSO compliance, harassment, fee disputes). | Build `Grievance Redressal Desk` with anonymous submission option, ticket status, investigator notes, and resolution log. |

---

### Module 20: Event Management
**Spec:** Planning of school functions, sports meets, academic events; attendance tracking for events.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Event Planning Studio** | Partial | `src/app/api/holidays/route.ts` | Events are recorded as simple calendar holiday entries without venue, budget, coordinator, or guest list. | Create dedicated `Event Management Studio` (`dashboard-events.tsx`) and `/api/events`. |
| **Event Categories** | Missing | `src/lib/types.ts` | No distinction between Sports Meets, Annual Day, Science Exhibitions, Inter-School Olympiads, and Workshops. | Add `SchoolEvent` schema with category, venue, budget, and program schedule. |
| **Attendance Tracking for Events** | Missing | None | No mechanism to track student/parent attendance at sports meets or rehearsals. | Add `Event Attendance Roll` allowing barcode/QR check-in for participants. |

---

### Module 21: Fees & Payment Gateway
**Spec:** Online fee collection; automated invoicing; payment reminders (use the existing unified Fees engine/Fee Master — do not duplicate).

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Unified Fee Master Engine** | Working | `src/components/blocks/dashboard-fee-master.tsx`, `src/lib/services/fees.service.ts`, `src/lib/fees-engine/` | Double-entry ledger, fee heads, quarterly billing, concessions, and counter collection are highly functional. | **STRICT RULE**: Maintain existing unified engine as the sole single source of truth. |
| **Online Payment Gateway** | Missing | `src/lib/fees-engine/` | No Razorpay / PayU order initiation and verified webhook callback. Parents cannot pay online. | Add `/api/fees/online/order` and `/api/fees/online/webhook` feeding directly into `FeesService.recordPayment`. |
| **Automated Invoicing** | Partial | `src/components/dual-copy-fee-receipt-modal.tsx` | Receipt modal prints dual-copy slips, but automated bulk PDF invoice dispatch is missing. | Add automated CBSE fee invoice PDF generation and download. |
| **Payment Reminders** | Missing | `src/lib/services/fees.service.ts` | Defaulters can be viewed, but there is no automated trigger to send WhatsApp/SMS overdue payment reminders. | Add `/api/fees/reminders` endpoint to dispatch automated WhatsApp/SMS fee alerts using `FeesService.getDefaulters()`. |

---

### Module 22: Canteen & Stationery Store
**Spec:** Inventory and billing management for both.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Item Catalog & Inventory** | Missing | `src/lib/types.ts` (`CANTEEN_BOOKSTORE` finance category only) | No inventory model for uniforms, books, stationery, or canteen meals (SKU, cost, selling price, stock, reorder level). | Create `StoreItem` schema and Inventory Manager in `dashboard-store.tsx`. |
| **POS & Billing Counter** | Missing | None | No point-of-sale checkout desk for counter sales to students and staff. | Create `Store POS Desk` supporting Cash, UPI, and Student Ledger Debit. |
| **Stock Ledger & Alerts** | Missing | None | No low-stock alerts or stock movement ledger (Purchases vs Sales vs Damaged). | Add stock movement ledger and low-inventory alerts. |
| **Ledger Integration** | Missing | None | Student bookstore purchases cannot be charged to student fee accounts. | Route store ledger debits directly into `FeesService` as `STORE_PURCHASE` ledger lines. |

---

### Module 23: Lab Management
**Spec:** Equipment inventory tracking; chemical stock management; practical class scheduling/booking; lab safety guidelines.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Equipment Inventory Tracking** | Missing | `src/lib/types.ts` (`lab_fees` only) | No inventory tracking for Physics, Chemistry, Biology, Robotics, and Computer labs (apparatus, serial numbers, working status). | Create `LabEquipment` inventory desk in `dashboard-labs.tsx`. |
| **Chemical Stock Management** | Missing | None | No chemical stock ledger tracking quantity, hazard class, expiry dates, and disposal logs. | Add `ChemicalStockRegister` with hazard indicators and expiry alerts. |
| **Practical Class Scheduling** | Missing | None | No lab booking system to prevent double-booking of lab rooms across class sections. | Add `Lab Slot Booking System` linking classes, teachers, and practical periods. |
| **Lab Safety Guidelines** | Missing | None | No safety documentation, emergency protocols, or student safety pledge repository. | Add CBSE Lab Safety Guidelines repository and incident report desk. |

---

### EXTRA: Staffing Calculator (CBSE)
**Spec:** Input/auto-read total students and number of sections, then compute required teachers using CBSE norms:
- Pupil-Teacher Ratio (PTR) = 30:1 $\to \text{teachers\_by\_PTR} = \lceil \text{total\_students} / 30 \rceil$
- Section-Teacher Ratio (STR) = 1:1.5 $\to \text{teachers\_by\_STR} = \lceil \text{sections} \times 1.5 \rceil$
- Show both numbers, higher as recommended minimum, current teachers vs required (gap), and note extra-curricular/sports staff are counted separately.

| Feature (from spec) | Status | File(s)/API(s) | Problem | Planned Fix |
| :--- | :--- | :--- | :--- | :--- |
| **CBSE PTR & STR Norms Engine** | Missing | None | Not implemented anywhere in the application. | Create `src/lib/cbse-staffing.ts` with pure calculation functions based on statutory formulas. |
| **Auto-Read Students & Sections** | Missing | `src/lib/services/aggregates.service.ts` | Data exists in aggregates, but no dedicated API exposes staffing metrics. | Connect calculator to live school counts from `AggregatesService`. |
| **Staffing Calculator UI** | Missing | None | No interactive UI with sliders and gap breakdown. | Embed `CBSE Staffing & HR Planner` widget in Faculty Panel (`teachers` tab) and Principal Panel (`/principal/reports`). |

---

## Technical Audit: Broken Routes, Links, APIs, and Architecture Issues

### 1. Broken Routes & Links
- **`/principal/` sub-navigation**: Several links in `src/components/principal/principal-sidebar.tsx` point to `/principal/students` where full student edit capabilities conflict with role boundaries.
- **`/fees/heads` route**: Exists in `src/app/(dashboard)/fees/heads/page.tsx` outside standard app tabs, creating navigation fragmentation with `dashboard-fee-master.tsx`.

### 2. Broken & Problematic APIs
- **`src/app/api/transport/telemetry/route.ts`**: Line 51 calls `col.find({}).toArray()` without filtering by `school_id`. **Severe Multi-Tenant Leak**.
- **`src/app/api/attendance/route.ts` (DELETE)**: Direct database deletion without verifying tenant boundary or triggering `AttendanceService` cache invalidation.
- **`src/app/api/audit-logs/route.ts`**: Fails on Vercel deployment if relying solely on `fs.writeFileSync(path.join(process.cwd(), 'data', 'audit_logs.json'))`. Must use MongoDB collection `audit_logs`.

### 3. Duplicate Logic
- **Split Fee Engines**:
  - `src/lib/fees/fee-service.ts` (798 lines) vs `src/lib/services/fees.service.ts` (484 lines) vs `src/lib/fees-engine/`.
  - **Violation**: Two parallel fee service files exist. `src/lib/fees/fee-service.ts` must be consolidated into `src/lib/services/fees.service.ts`.
- **Class and Student Name Normalization**:
  - `isSameClass` and `normalizeClassName` are duplicated across `src/lib/utils.ts`, `src/lib/cbse-subjects.ts`, and `src/lib/services/attendance.service.ts`.

### 4. Unused & Temporary Files
- **Over 100 one-off audit scripts in `scripts/`**: Including `check-abhishek.js`, `check_anjali.mjs`, `remove-after-august-attendance.js`, and ad-hoc seed files. These should be archived into a `scripts/archive/` folder to prevent confusion.
- **Dead legacy components**: Verify zero references for any obsolete modal components before deprecating.

### 5. TypeScript Compilation Errors (Immediate Priority)
- In `src/app/app/page.tsx` (lines 9146, 9165, 9195, 9429, 9457, 9472, 9482, 11161, 11181, 11210, etc.):
  - `next/dynamic` imports lack TypeScript generic parameter declarations: `dynamic<DashboardProps>(...)`. This causes TypeScript to infer `ComponentType<{}>`, failing with `Property 'selectedSchool' does not exist on type 'IntrinsicAttributes'`.

---

## Cross-Module Dependencies Matrix

Understanding cross-module dependencies is vital to prevent regressions:

```
[Module 16: Roles & RBAC] ──► Guards all 23 Modules
[Module 17: Audit Logs]   ──► Audits write actions across all 23 Modules

[Module 7: Curriculum]    ──► Feeds subjects & topics into [Module 6: Classes]
[Module 6: Classes]       ──► Feeds cohorts into [Module 10: Exams] & [Module 11: Homework]

[Module 14: Leave Mgmt]   ──► Writes 'LEAVE' status into [Module 1: Attendance]
                          ──► Deducts LOP in [Module 4: Faculty Payroll]

[Module 1: Attendance]    ──► Supplies % to [Module 3: Student Dossier]
                          ──► Supplies % to [Module 10: Report Cards]
                          ──► Supplies daily summary to [Module 2: Dashboard]

[Module 21: Fees Engine]  ──► Sinks fines from [Module 12: Library]
                          ──► Sinks charges from [Module 22: Canteen/Store]
                          ──► Feeds ledger & dues into [Module 3: Student Dossier]
                          ──► Feeds progress bar into [Module 2: Dashboard]

[Module 19: Discipline]   ──► Embeds incident history into [Module 3: Student Dossier]
[Module 13: Health Rec]   ──► Embeds medical alert badge into [Module 3: Student Dossier]

[Module 4 & 6: HR/Classes]──► Feeds student & section counts into [CBSE Staffing Calculator]
```

---

## Proposed Implementation Order (Dependencies First)

To respect system architecture and ensure stable, non-destructive development, the modules must be tackled in the following sequence:

| Step | Module # | Module Name | Justification |
| :---: | :---: | :--- | :--- |
| **0** | **Pre-Req** | **Fix TypeScript Dynamic Imports in `app/page.tsx`** | Clean compiler baseline so test runs pass cleanly. |
| **1** | **16 & 17** | **Roles & Permissions + Audit Logs** | Foundation: Every subsequent module requires RBAC verification and write audit logging. |
| **2** | **1** | **Attendance Hub** | Hard Rule: Single source of truth. Add RFID/Biometric hook, instant absent alerts, leave integration. |
| **3** | **21** | **Fees & Payment Gateway** | Hard Rule: Single source of truth. Unify `fees.service.ts`, add online payment gateway hook, reminders. |
| **4** | **6 & 7** | **Classes & Curriculum** | Foundational academic structure for timetable, homework, and exams. |
| **5** | **18 & 4** | **My Profile, Faculty Panel + Staffing Calc** | Teacher tools, pay slips, qualifications, and the CBSE Staffing Calculator. |
| **6** | **3** | **Student Dossier (360° View)** | Unifies Attendance, Fees, Siblings, Discipline, and Academics into one cohesive view. |
| **7** | **14** | **Leave Management** | Directly writes approved leaves to Attendance (`AttendanceService`) and Faculty Payroll. |
| **8** | **10 & 8** | **Examination Hub & Certification Studio** | Exam schedules, Hall Tickets, CBSE grading rubrics, automated report cards, and digital-signed certificates. |
| **9** | **11** | **Homework & Digital Diary** | Daily assignments, student submission tracking, and parent digital diary. |
| **10** | **15** | **Notice Board & Circulars** | Targeted broadcasts with attachment viewer and read receipts. |
| **11** | **9** | **Transport Fleet** | Multi-tenant safety fix on telemetry, route optimizer, and student-vehicle mapping. |
| **12** | **12** | **Library Management** | Circulation, membership limits, and overdue fine synchronization into `FeesService`. |
| **13** | **13** | **Health Records** | Campus infirmary desk, vaccination logs, annual routine checkups, emergency protocols. |
| **14** | **19** | **Discipline & Grievance** | Incident reports, disciplinary committee hearings, and grievance redressal desk. |
| **15** | **20** | **Event Management** | Function planning, sports meets, participant rosters, and event attendance check-in. |
| **16** | **22 & 23**| **Canteen/Store & Lab Management** | POS billing, stationery inventory, science lab equipment, chemical safety logs. |
| **17** | **5** | **Principal Panel** | Executive governance cockpit, policy repository, staff memos, and CBSE compliance audits. |
| **18** | **2** | **Executive Dashboard** | Final aggregation: Live transport telemetry widget, today's schedule timeline, fee progress bar, and administrative alerts. |

---

## STOP POINT — PHASE 0 COMPLETE

Per instructions:
1. No code modifications or database mutations have been performed.
2. Full audit report is committed to `AUDIT_REPORT.md` in repository root.
3. Awaiting user review and explicit approval (e.g., *"go module X"* or approval of the proposed order) before initiating Phase 1.
