# School ERP Master Audit Plan (Phase 0: Inventory & Cross-Module Mapping)

> **Scope**: Comprehensive multi-tenant SaaS architecture audit across all frontend components, API routes, database collections, and utility engines.  
> **Rule**: Planning & Inventory only. No fixes applied during Phase 0.

---

## 1. Complete Module Inventory

### 1. Multi-Tenant School Administration & Agency Management
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-agency.tsx`, `src/app/agency/page.tsx`
  - API Routes: `/api/schools`, `/api/school/settings`, `/api/agency/approve-demo`, `/api/agency/purge-school`
  - DB Models: `School`, `DemoRequest`, `AgencySettings` in `src/lib/types.ts`, `memoryStore.schools` in `src/lib/db.ts`
  - Utilities: `src/lib/auth-guard.ts` (`resolveTenantSchoolId`)
- **One-Line Purpose**: Manages multi-school tenant lifecycle, master school onboarding, demo approvals, tenant configuration, and administrative isolation.
- **Dependencies & Data Flow**: Feeds `school_id` and `academic_session` context into **all other 20 modules**.

---

### 2. Authentication, Authorization & RBAC Permissions
- **Key Files**:
  - Frontend: `src/app/login/page.tsx`, `src/components/blocks/dashboard-permissions.tsx`
  - API Routes: `/api/auth/login`, `/api/auth/session`, `/api/auth/profile`, `/api/auth/logout`, `/api/auth/forgot-passcode`, `/api/school/permissions`
  - DB Models: `User`, `RolePermissionMatrix`, `ManagedRole` in `src/lib/types.ts`
  - Utilities: `src/lib/auth-guard.ts` (`verifySessionToken`, `requireRole`, `resolveTeacherRole`), `bcryptjs` in `src/lib/db.ts`
- **One-Line Purpose**: Handles user authentication across 10 roles (Superadmin, Principal, Teacher, Accountant, Driver, Librarian, Guard, Student, Parent) and enforces granular permissions.
- **Dependencies & Data Flow**: Depends on `School` and `Teacher`/`Student` records; guards access to every API route and UI view.

---

### 3. Student Information System (SIS) & Admissions
- **Key Files**:
  - Frontend: `src/app/app/page.tsx` (Student Master Table & Admission Forms), `src/components/student-summary-modal.tsx`
  - API Routes: `/api/students`, `/api/students/promote`
  - DB Models: `Student` (CBSE OASIS/SARAS compliant, APAAR/PEN ID, demographic & family details) in `src/lib/types.ts`
  - Utilities: `src/lib/student-helper.ts`, `src/lib/validation-schemas.ts`
- **One-Line Purpose**: Governs scholar registration, CBSE demographic profiles, class enrollments, family trees, student promotions, and status lifecycle.
- **Dependencies & Data Flow**: Depends on **Classes**; feeds data into **Fees**, **Attendance**, **Exams**, **Transport**, **Hostel**, **Library**, **Certificates**, **Siblings**, and **Reports**.

---

### 4. Sibling & Family Grouping Engine
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-siblings.tsx`
  - DB Models: `SiblingGroup` in `src/lib/student-helper.ts`
  - Utilities: `src/lib/student-helper.ts` (`getStudentSiblings`, `getAllSiblingGroups`)
- **One-Line Purpose**: Auto-detects real family clusters across classes using parent names, phone numbers, and addresses for joint sibling discounts and family billing.
- **Dependencies & Data Flow**: Reads `Student` and `FeeInvoice` records; feeds sibling concession eligibility into **Fees Engine**.

---

### 5. Fees & Financial Management Engine
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-fees.tsx`, `src/components/blocks/dashboard-overview.tsx`
  - API Routes: `/api/fees`
  - DB Models: `FeeInvoice`, `FeePaymentRecord` in `src/lib/types.ts`
  - Utilities: `src/lib/monthly-fee-helper.ts`, `src/lib/fee-calculator.ts`
- **One-Line Purpose**: Handles 12-month CBSE fee schedules, fee structures, offline/online payment receipts, concessions/waivers, partial payments, and overdue tracking.
- **Dependencies & Data Flow**: Depends on **Students**, **Classes**, **Transport**, **Hostel**, and **Siblings**; feeds financial KPIs into **Overview**, **Approvals**, and **Reports**.

---

### 6. Student & Parent Unified Self-Service Portal
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-student-portal.tsx`, `src/app/app/page.tsx`
  - DB Models: `Student`, `FeeInvoice`, `AttendanceRecord`, `ScheduledExamItem`
  - Utilities: `src/lib/monthly-fee-helper.ts`, `src/lib/student-helper.ts`
- **One-Line Purpose**: Provides students and parents a secure dashboard to view monthly fee ledgers, download receipts, check attendance percentages, exam report cards, and digital diary entries.
- **Dependencies & Data Flow**: Reads data from **Students**, **Fees**, **Attendance**, **Exams**, **Homework**, and **Notices**.

---

### 7. Attendance Engine & Holiday Management
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-attendance.tsx`, `src/components/student-attendance-history.tsx`
  - API Routes: `/api/attendance`, `/api/attendance/scan`, `/api/holidays`
  - DB Models: `AttendanceRecord`, `Holiday` in `src/lib/types.ts`
  - Utilities: `src/lib/utils.ts` (`getTodayDateStr`), `src/lib/whatsapp.ts` (`buildMorningAbsentText`)
- **One-Line Purpose**: Manages daily classroom roll-call, QR code campus gate scanning, teacher attendance, official holiday circulars, and instant absentee WhatsApp alerts.
- **Dependencies & Data Flow**: Depends on **Students**, **Classes**, and **Teachers**; feeds daily turnout and shortage defaulter lists (<75%) into **Overview**, **Reports**, and **Exams**.

---

### 8. Academic Classes, Sections & Curriculum Subjects
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-subjects.tsx`, `src/app/app/page.tsx` (Classes tab)
  - API Routes: `/api/classes`, `/api/classes/subjects`
  - DB Models: `ClassRoom`, `SubjectItem` in `src/lib/types.ts`
  - Utilities: `src/lib/cbse-subjects.ts` (`getDefaultCbseSubjectsForClass`, `sortClassesChronologically`, `getClassWeight`)
- **One-Line Purpose**: Maintains class rosters, section capacities, class teacher allocations, and CBSE subject syllabi from Pre-Primary to Class XII.
- **Dependencies & Data Flow**: Depends on **Teachers** (for Class Teacher assignment); feeds fundamental hierarchy into **Students**, **Attendance**, **Fees**, **Exams**, and **Homework**.

---

### 9. Examinations, Marks Broadsheet & CBSE Grading Engine
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-exams.tsx`, `src/components/blocks/dashboard-cbse-report-card.tsx`
  - API Routes: `/api/exams`
  - DB Models: `ScheduledExamItem` in `src/lib/types.ts`
  - Utilities: `src/lib/cbse-subjects.ts`
- **One-Line Purpose**: Schedules periodic tests, half-yearly and annual board exams, manages teacher marks entry, calculates CBSE 8-point/9-point grades, rank broadsheets, and generates printable CBSE Report Cards.
- **Dependencies & Data Flow**: Depends on **Classes**, **Subjects**, **Students**, and **Attendance**; feeds academic results into **Student Portal**, **Reports**, and **Certificates**.

---

### 10. Staff Directory, Faculty Governance & HR
- **Key Files**:
  - Frontend: `src/app/app/page.tsx` (Teachers / Staff Master Table & Forms)
  - API Routes: `/api/teachers`
  - DB Models: `Teacher` (OASIS compliant, CTET qualification, statutory EPF/UAN details) in `src/lib/types.ts`
  - Utilities: `src/lib/types.ts` (`resolveTeacherRole`, `STAFF_ROLES`)
- **One-Line Purpose**: Manages teacher and non-teaching staff credentials, designations, subject specializations, role resolution, and payroll profile data.
- **Dependencies & Data Flow**: Feeds into **Auth**, **Classes** (Class Teachers), **Attendance** (Faculty roll-call), **Timetable/Substitution**, and **Approvals**.

---

### 11. Digital Diary & Daily Homework Management
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-homework.tsx`
  - DB Models: `HomeworkItem`
  - Utilities: `src/lib/api-client.ts`
- **One-Line Purpose**: Allows subject teachers to assign daily homework, attach worksheets/documents, track student submissions, and send push notifications to parents.
- **Dependencies & Data Flow**: Depends on **Classes**, **Subjects**, **Teachers**, and **Students**; feeds diary feed into **Student Portal**.

---

### 12. Transport Fleet & Telemetry Operations
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-transport.tsx`
  - API Routes: `/api/transport/telemetry`
  - DB Models: `TransportRoute`, `VehicleLog`, `TransportStop`
  - Utilities: `src/lib/monthly-fee-helper.ts` (`getStandardTransportRate`)
- **One-Line Purpose**: Manages school bus fleet, driver allocations, passenger student manifests, route waypoints, live GPS telemetry simulation, and distance-based fee slabs.
- **Dependencies & Data Flow**: Reads student transport opt-in from **Students**; feeds monthly transport charges into **Fees Engine**.

---

### 13. Hostel & Boarding Accommodation
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-hostel.tsx`
  - DB Models: `HostelRoom`, `HostelFeeHead` in `src/lib/types.ts`
  - Utilities: `src/lib/fee-calculator.ts` (`DEFAULT_HOSTEL_FEES`)
- **One-Line Purpose**: Manages hostel wings (Boys/Girls, AC/Non-AC), room inventory, bed allocations, mess facilities, and boarding security deposits.
- **Dependencies & Data Flow**: Reads student hostel opt-in from **Students**; feeds monthly/annual hostel fees and refundable deposits into **Fees Engine**.

---

### 14. Library & Media Asset Catalog
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-library.tsx`
  - DB Models: `BookItem`, `BookCirculationRecord` in `src/lib/types.ts`
- **One-Line Purpose**: Manages library catalog (ISBN, racks, copies), barcode/search book checkout, student book issue/return tracking, and overdue fine calculations.
- **Dependencies & Data Flow**: Depends on **Students** and **Teachers**; feeds book dues and fine records into **Certificates** (No-Dues Clearance).

---

### 15. Campus Gate Security & Visitor Management
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-visitor-gate.tsx`
  - DB Models: `VisitorEntry`, `StudentGatePass` in `src/lib/types.ts`
- **One-Line Purpose**: Logs visitor check-in/out with badge numbers and photos, and issues authorized student early-departure gate passes.
- **Dependencies & Data Flow**: Depends on **Students** and **Staff**; feeds movement logs into **Audit Logs**.

---

### 16. Institutional Circulars, Notices & Broadcasts
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-broadcast.tsx`, `src/components/broadcast-inbox-modal.tsx`
  - API Routes: `/api/notices`, `/api/notifications/send`, `/api/notifications/broadcasts`, `/api/notifications/subscribe`, `/api/notifications/vapid-key`
  - DB Models: `Notice`, `PushSubscription` in `src/lib/types.ts`
  - Utilities: `src/lib/web-push.ts`, `src/lib/push-notifications.ts`, `src/lib/email.ts`, `src/lib/whatsapp.ts`
- **One-Line Purpose**: Dispatches official circulars with immutable reference codes, Web Push notifications, emergency broadcasts, and WhatsApp/Email digests.
- **Dependencies & Data Flow**: Depends on **Holidays** (auto-circulars), **Students**, and **Teachers**; feeds feeds into **Overview** and **Student Portal**.

---

### 17. Approvals Workflow & Leave Governance
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-approvals.tsx`
  - DB Models: `LeaveRequest`, `ConcessionRequest`, `StudentLeaveApplication`
- **One-Line Purpose**: Manages multi-tier approval workflows for teacher leaves, student medical leaves, and fee waiver/concession authorizations by the Principal.
- **Dependencies & Data Flow**: Depends on **Teachers**, **Students**, and **Fees**; feeds approved leaves into **Attendance** and approved waivers into **Fees Engine**.

---

### 18. Official Certificates & Document Generation
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-certificates.tsx`
  - API Routes: `/api/verify/id`
  - DB Models: `CertificateRecord`
  - Utilities: `src/lib/utils.ts` (`printHtmlElement`), `src/lib/student-helper.ts`
- **One-Line Purpose**: Issues tamper-evident Transfer Certificates (TC), Bonafide Certificates, Character Certificates, and Fee Clearance receipts with verification QR codes.
- **Dependencies & Data Flow**: Reads data from **Students**, **Fees** (verifies pending dues = 0), **Attendance**, and **Library** (verifies no unreturned books).

---

### 19. Institutional Reports & CBSE Compliance Registers
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-reports.tsx`, `src/components/institutional-report-modal.tsx`
  - DB Models: Reads all collections
  - Utilities: `src/lib/monthly-fee-helper.ts`, `src/lib/cbse-subjects.ts`, `src/lib/utils.ts`
- **One-Line Purpose**: Generates audit-ready institutional reports: OASIS student register, fee collection DCB (Demand-Collection-Balance), 75% attendance defaulter lists, and staff salary statements.
- **Dependencies & Data Flow**: Aggregates data from **Students**, **Fees**, **Attendance**, **Teachers**, **Transport**, and **Exams**.

---

### 20. Data Hub (Bulk Integration, Import & Export)
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-data-hub.tsx`
  - API Routes: `/api/students`, `/api/teachers`, `/api/fees`, `/api/attendance`
  - Utilities: `src/lib/validation-schemas.ts`
- **One-Line Purpose**: Provides bulk CSV/Excel data onboarding, student roster imports, fee opening balance migration, and full-database export backups.
- **Dependencies & Data Flow**: Directly creates/updates records across **Students**, **Teachers**, **Fees**, **Attendance**, and **Classes**.

---

### 21. Security & Administrative Audit Logs
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-audit-logs.tsx`
  - API Routes: `/api/audit-logs`
  - DB Models: `AuditLogEntry` in `src/lib/types.ts`
  - Utilities: `src/lib/audit-logger.ts`, `src/lib/client-audit.ts`
- **One-Line Purpose**: Immutable tamper-evident logging of administrative actions (fee collection, grade changes, admissions, deletions, logins) with actor IP and timestamps.
- **Dependencies & Data Flow**: Hooked into mutations across **all modules**.

---

### 22. Executive Dashboard Overview & Real-Time Operational KPIs
- **Key Files**:
  - Frontend: `src/components/blocks/dashboard-overview.tsx`
  - API Routes: `/api/overview`
  - DB Models: `SchoolOverview` in `src/lib/types.ts`
  - Utilities: `src/lib/db.ts` (`getSchoolOverview`), `src/lib/utils.ts` (`getTodayDateStr`)
- **One-Line Purpose**: Top-level executive command center displaying live attendance rates, daily collection totals, pending dues, session enrollment, circulars, and AI insights.
- **Dependencies & Data Flow**: Consolidates state from **Students**, **Teachers**, **Attendance**, **Fees**, and **Notices**.

---

## 2. Cross-Module Shared Entities & Data-Flow Map

- **Tenant / School** (`School`): Read by every module; written by Agency & School Settings.
- **Academic Session** (`academic_session`): Filter key for Students, Invoices, Attendance, Exams, Classes, Notices.
- **Classes & Sections** (`ClassRoom`): Referenced by Students, Attendance, Exams, Subjects, Timetable, Fees, Homework.
- **Student Profile (SIS)** (`Student`): Read by Fees, Attendance, Exams, Transport, Hostel, Library, Siblings, Certificates, Reports.
- **Staff / Teachers** (`Teacher`): Read by Classes (Class Teachers), Attendance (Faculty roll call), Timetable, Approvals.

---

## 3. High-Risk Hotspots: Independent Calculation Redundancies (Primary Bug Sources)

| Entity / Metric | Primary Source of Truth | Redundant / Independent Calculation Places | Bug Symptom / Risk |
|---|---|---|---|
| **Student Fee Dues & Paid Amounts** | `monthly-fee-helper.ts` (`getStudentFeeSummary`) | 1. `fee-calculator.ts` (`DEFAULT_TUITION_FEES` - e.g. ₹1,000 vs ₹1,200)<br>2. `db.ts` (`getSchoolOverview`)<br>3. `dashboard-overview.tsx`<br>4. `dashboard-reports.tsx` (DCB calculations)<br>5. `page.tsx` (studentForm fee status sync) | Student shows 'PAID' in one screen but 'PENDING' or 'OVERDUE' in reports or student summary modal. |
| **Daily Attendance Rate & Marked Status** | `getTodayDateStr()` & `db.ts` | 1. `dashboard-attendance.tsx`<br>2. `dashboard-overview.tsx`<br>3. `dashboard-reports.tsx`<br>4. `page.tsx` | Midnight rollover lag or timezone mismatches causing previous day's attendance to show on new morning. |
| **Student Attendance Percentage** | Attendance logs tally (`present / totalRecorded`) | 1. `student.attendance_percent` field in Student DB document<br>2. Real-time compute in `dashboard-reports.tsx`<br>3. Summary modal in `student-summary-modal.tsx` | Stale percentage shown on student profile cards vs official report cards or 75% shortage register. |
| **Total Enrolled Students Count** | `students.length` (excluding INACTIVE/ALUMNI) | 1. `classes.reduce(capacity)` fallback<br>2. `overview.kpis.totalStudents`<br>3. Unique class student array filters | Inconsistent denominator in percentage attendance computations (e.g. 35 capacity vs 28 actual scholars). |
| **Academic Session Filtering** | `selectedSession` (e.g. '2026-27') | 1. Query parameter in API<br>2. Document field `academic_session`<br>3. In-memory fallback defaulting to '2026-27' | Multi-year session data leaking into current session reports or invoices when switching sessions. |
| **Multi-Tenancy Isolation (`school_id`)** | JWT `tenant` via `auth-guard.ts` | 1. `school_id` body payload<br>2. `school_code` vs `school.id` resolution<br>3. Superadmin god-mode switching | Potential cross-tenant data leakage if query parameter overrides authenticated tenant ID without role check. |

---

## 4. Module Risk Ranking

### 🔴 Tier 1: Critical Risk (Money, Financial Integrity, Multi-Tenancy & State Sync)
1. **Fees & Financial Management**: High complexity, multi-installment splitting, partial payments, waivers, offline counter receipts, multiple pricing helper files.
2. **Student SIS & Promotion Lifecycle**: Academic session transitions, status mutations (ACTIVE, INACTIVE, ALUMNI), roll numbers, class transfers.
3. **Multi-Tenant Isolation & Auth Guard**: Cross-school data security, JWT tenant resolution, role permissions, superadmin impersonation.
4. **Attendance Engine & Daily Reset**: Midnight IST date boundaries, QR scans, holiday overrides, student percentage recalculations.

### 🟠 Tier 2: High Risk (CBSE Compliance, Academic Calculations & Data Migrations)
5. **Examinations & CBSE Report Cards**: 8/9-point grading formulas, co-scholastic marks, rank ordering, broadsheet generation.
6. **Official Certificates (TC & Clearance)**: Cross-module validation checks (zero fee dues, no library books outstanding, TC counter incrementing).
7. **Institutional Reports (DCB & OASIS)**: Aggregation of cross-module data with independent calculation formulas.
8. **Data Hub (Bulk CSV Imports & Data Migration)**: Potential schema corruptions, missing foreign keys, duplicate student creation.
9. **Sibling & Family Billing**: Heuristic matching accuracy, joint fee concession cascading.

### 🟡 Tier 3: Moderate Risk (Operational Workflows & Logistics)
10. **Approvals Workflow**: State machine transitions for leaves and fee waiver authorizations.
11. **Transport & Live Telemetry**: Stop fee slab resolution, passenger roster sync.
12. **Hostel Accommodation**: Bed capacity limits, room allocations, mess charges.
13. **Library Management**: Book stock tracking, circulation states, overdue fine calculations.
14. **Curriculum Classes & CBSE Subjects**: Class teacher mapping, subject assignments.
15. **Staff Directory & HR Governance**: Designation and role resolution (`resolveTeacherRole`).
16. **Campus Gate Security & Visitor Gate**: Early student gate pass authorization.

### 🟢 Tier 4: Low Risk (Presentation, Static Views & Notifications)
17. **Digital Homework Diary**: Basic CRUD with attachment viewing.
18. **Broadcasts & Notice Circulars**: Broadcast dispatch and push notification delivery.
19. **Student / Parent Portal**: Read-heavy view over underlying engine APIs.
20. **Audit Logs Trail**: Append-only security logging.
21. **Executive Dashboard Overview**: Aggregate KPI presentation layer.
22. **Landing Page & Demo Requests**: Public marketing and intake forms.

---

## 5. Master Module-by-Module Audit Checklist

- [ ] **Module 01: Multi-Tenancy, Tenant Management & Superadmin (`/api/schools`, `agency`)**
  - [ ] Verify tenant data isolation on every DB query
  - [ ] Validate demo approval school provisioning workflow
  - [ ] Check school purging cascading deletes (students, teachers, invoices, attendance)

- [ ] **Module 02: Authentication, Passcodes & RBAC Guard (`/api/auth/*`, `permissions`)**
  - [ ] Audit password/passcode hashing with bcrypt
  - [ ] Validate session token expiry and role checks in `auth-guard.ts`
  - [ ] Verify permission matrix enforcement on all API routes

- [ ] **Module 03: Student Information System (SIS) (`/api/students`, `app/page.tsx`)**
  - [ ] Validate CBSE mandatory fields (APAAR, Aadhaar, DOB, Blood Group, Category)
  - [ ] Audit student admission number uniqueness per school
  - [ ] Test student academic promotion (`/api/students/promote`) across sessions

- [ ] **Module 04: Sibling & Family Grouping Engine (`dashboard-siblings.tsx`)**
  - [ ] Test 3-rule heuristic matching (Father+Mother, Phone+Parent, Phone+Address)
  - [ ] Verify sibling fee concession deduction in fee schedules

- [x] **Module 05: Fees & Financial Engine (`/api/fees`, `monthly-fee-helper.ts`)**
  - [x] Audit single-source-of-truth for fee rate tables across all helpers (Standardized Pre-primary ₹1,200/mo in `monthly-fee-helper.ts`, `fee-calculator.ts`, and `dashboard-fees.tsx`)
  - [x] Test partial payments, multiple installment receipts, and waiver reversals (Fixed Zod `updateFeeInvoiceSchema` and `createFeeInvoiceSchema` to preserve `additional_payment`, `payment_history`, `waived_by`, `receipt_no`)
  - [x] Verify student `fee_status` auto-update on payment/waiver transactions (Fixed `syncStudentFeeStatus` using `getStudentFeeSummary`, fixed student profile PATCH in `page.tsx` from overwriting status, resolved ₹15k vs ₹3k overview mismatch using `paid_amount`)

- [x] **Module 06: Student & Parent Self-Service Portal (`dashboard-student-portal.tsx`)**
  - [x] Verify student passcode authentication guard (Fixed role routing in `page.tsx` so PARENT role accesses student portal on attendance, certificates, and exams instead of admin tools)
  - [x] Validate fee ledger display against accountant view (Verified `getStudentMonthlyFeeSchedule` and `getStudentFeeSummary` synchronization)
  - [x] Verify report card & attendance history privacy (Added dynamic `allChildren` resolution, child switcher for multi-sibling parents, dynamic real attendance KPIs, and class-matched datesheets)

- [ ] **Module 07: Attendance Engine & Holiday System (`/api/attendance`, `holidays`)**
  - [ ] Verify IST midnight 12:00 AM automatic roster reset
  - [ ] Test QR code scan gate check-in and duplicate scan handling
  - [ ] Validate holiday applicability rules (All vs Specific classes vs Faculty)

- [ ] **Module 08: Classes, Sections & CBSE Subjects (`/api/classes`, `cbse-subjects.ts`)**
  - [ ] Verify class teacher assignment uniqueness
  - [ ] Test section capacity limits and chronological sorting

- [ ] **Module 09: Examinations, Broadsheets & CBSE Report Cards (`/api/exams`)**
  - [ ] Audit CBSE 8-point / 9-point grading scale conversions
  - [ ] Validate total marks, percentages, and class rank calculations
  - [ ] Test report card printing layout across all standards

- [ ] **Module 10: Staff Directory & Faculty Governance (`/api/teachers`)**
  - [ ] Audit teacher role resolution (`resolveTeacherRole`)
  - [ ] Validate statutory payroll compliance fields (EPF, UAN, Bank Account)

- [ ] **Module 11: Digital Diary & Daily Homework (`dashboard-homework.tsx`)**
  - [ ] Verify teacher class authorization for homework posting
  - [ ] Test parent push notification triggers

- [ ] **Module 12: Transport Fleet & Telemetry (`/api/transport/telemetry`)**
  - [ ] Validate distance slab to fee amount resolution
  - [ ] Verify passenger list sync with student transport opt-in

- [ ] **Module 13: Hostel & Boarding Management (`dashboard-hostel.tsx`)**
  - [ ] Verify room and bed allocation uniqueness
  - [ ] Test hostel fee and security deposit billing into student invoice

- [ ] **Module 14: Library Catalog & Circulation (`dashboard-library.tsx`)**
  - [ ] Test book issue/return availability counts
  - [ ] Verify overdue fine calculation formula

- [ ] **Module 15: Security Guard & Visitor Gate Pass (`dashboard-visitor-gate.tsx`)**
  - [ ] Test visitor check-in badge generation
  - [ ] Validate student early departure gate pass authorization guard

- [ ] **Module 16: Institutional Notices & Web Push Broadcast (`/api/notices`, `notifications`)**
  - [ ] Audit immutable reference number generator (`Ref No: DPS/YYYY/DD/MM/CAT/SEQ`)
  - [ ] Test Web Push VAPID subscription and dispatch

- [ ] **Module 17: Approvals & Leave Workflow (`dashboard-approvals.tsx`)**
  - [ ] Test leave status transitions (PENDING -> APPROVED / REJECTED)
  - [ ] Verify approved leave reflection in attendance logs

- [ ] **Module 18: Official Certificates & Document Verification (`dashboard-certificates.tsx`, `/api/verify/id`)**
  - [ ] Test Transfer Certificate (TC) auto-generation and no-dues verification
  - [ ] Verify public QR code verification endpoint

- [ ] **Module 19: Institutional Reports & Compliance Registers (`dashboard-reports.tsx`)**
  - [ ] Audit Demand-Collection-Balance (DCB) summary calculations
  - [ ] Test 75% attendance defaulter list accuracy

- [ ] **Module 20: Data Hub & Bulk Integration Center (`dashboard-data-hub.tsx`)**
  - [ ] Test CSV parsing, column mapping, and schema validation
  - [ ] Validate transactional rollback on bulk import errors

- [ ] **Module 21: Security Audit Logs (`/api/audit-logs`, `audit-logger.ts`)**
  - [ ] Verify audit log entry dispatch on every sensitive mutation
  - [ ] Validate immutable log querying and role restriction

- [ ] **Module 22: Executive Dashboard Overview (`dashboard-overview.tsx`, `/api/overview`)**
  - [ ] Audit server-side KPI caching and singleFlight coalescing
  - [ ] Verify midnight auto-refresh of daily turnout and revenue metrics
