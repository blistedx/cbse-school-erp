# EduSuite School ERP — Audit & Cleanup Changelog

> **Execution Date**: 2026-09-21  
> **Target Environment**: Next.js App Router (v16.3.3) + MongoDB Atlas Cloud (`edugit`) + Vercel  

---

## 1. Automated Backups Created

- **Directory**: `/backups/2026-09-21/`
- **Total Collections Exported**: 32 collections (`.json` format) + `manifest.json`.
- **Verified Record Count**:
  - `fee_ledger`: 11,921 documents
  - `fee_demands`: 7,954 documents
  - `fee_invoices`: 6,575 documents
  - `fee_receipts`: 1,830 documents
  - `fee_payments`: 1,830 documents
  - `push_subscriptions`: 624 documents
  - `timetable`: 630 documents
  - `students`: 505 documents
  - `attendance`: 229 documents
  - `teachers`: 31 documents
  - `classes`: 18 documents
  - `holidays`: 15 documents
  - `exams`: 11 documents
  - `notices`: 10 documents
  - `broadcast_notifications`: 25 documents
  - `demo_requests`: 35 documents
  - `audit_logs`: 6 documents
  - `media_metadata`: 5 documents
  - `school_stats`: 3 documents
  - `users`: 3 documents
  - `schools`: 1 document
  - `agency_settings`: 1 document
  - `fee_config`: 1 document
  - `class_fee_structures`: 34 documents
  - `fee_heads`: 11 documents
  - `fee_concessions`: 5 documents
  - `transport_telemetry`: 2 documents
  - 5 empty collections (0 documents each)

---

## 2. Deleted Dead Files & Directories

### Root Legacy Directories (Removed)
1. `models/` (14 files — duplicate of `src/models/`, outside Next.js compile root)
2. `lib/` (2 files — `db.js`, `schema.sql`: legacy CockroachDB / PostgreSQL migration remnants)
3. `legacy_html/` (4 files — raw HTML mockups from initial prototype)
4. `scratch/` (6 files — temporary scratch scripts from past audits)
5. `netlify.toml` & `.netlify/` (Removed Netlify deployment artifacts as project is deployed on Vercel)

### Dead `src/` Files (Removed)
1. `src/components/mobile/` (5 files: `mobile-shell.tsx`, `role-driver-view.tsx`, `role-parent-view.tsx`, `role-principal-view.tsx`, `role-teacher-view.tsx` — 0 active references, superseded by responsive workspace in `/app`)
2. `src/lib/fee-constants.ts` (Unused legacy fee constants file)
3. `src/lib/mongoose.ts` (Unused Mongoose connection layer; ERP data layer is 100% native MongoDB driver in `src/lib/mongodb.ts`)
4. `src/models/` (14 files: `src/models/fees/` & `src/models/finance/` — dead Mongoose schemas superseded by unified fee engine)
5. `src/scripts/` (2 files: `migrate-media-to-blob.ts`, `test-security-fixes.ts` — misplaced one-time scripts)

---

## 3. Database Collections Cleaned (MongoDB Atlas `edugit`)

- **Dropped Collections (0 docs each)**:
  - `feepayments`
  - `transactions`
  - `incomes`
  - `expenses`
  - `studentfees`

---

## 4. Environment & Package Dependencies Cleaned

- **`package.json`**: Removed `@netlify/plugin-nextjs`.
- **`.env`**: Removed unused credentials `MONGODB_USERNAME`, `MONGODB_PASSWORD`, and `AGENCY_ADMIN_PASS`.

---

## 5. Bug Fixes & API Route Hardening

- **`src/app/api/auth/login/route.ts`**: Supported both `password` and `passcode` request payload keys for seamless client compatibility.
- **`src/app/api/finance/reports/pl/route.ts`**: Refactored from defunct Mongoose models to native MongoDB driver (`getDatabase()`) querying `fee_receipts` and `fee_ledger`.

---

## 6. Build & Test Verification

- **`tsc --noEmit`**: **0 errors** (Clean compilation).
- **`next build`**: **0 errors** (Static generation of all 54 routes successful).
- **Runtime API Smoke Test (`scripts/api-smoke-test.ts`)**: **34/34 (100%) endpoints returned 2xx OK responses**.

---

## 7. Phase 2 — Security Audit & Remediation (2026-09-21)

### 7.1 Cryptographic & Authentication Hardening
- **Universal Bcrypt Migration (Cost Factor 12)**:
  - Migrated 100% of teachers (31) and students (505) from plaintext/legacy formats to `$2b$12$` bcrypt hashes.
  - Flagged accounts holding legacy default credentials with `must_change_password: true`.
  - Removed all hardcoded fallback passcodes (`admin@4317`, `123456`) across `src/lib/db.ts`.
  - Removed plaintext comparison fallback from `verifyPassword()`; strictly uses `bcrypt.compare()`.
- **Timing-Safe Cryptography**:
  - Implemented `crypto.timingSafeEqual` for all HMAC-SHA256 session signature validations and Superadmin master password checks.
- **Backdoor Remediation**:
  - Completely neutralized `/api/auth/session` arbitrary token minting backdoor. Endpoint now strictly verifies/refreshes existing active sessions.
  - Removed automatic mock session minting in `src/lib/api-client.ts`.
- **Login Rate Limiting & Account Lockout**:
  - Added IP-based sliding window rate limiter (10 attempts / min) and progressive account lockout on consecutive failures in `/api/auth/login`.
  - Enforced strict Zod validation schema `authLoginSchema` accepting canonical `password` field only.
- **Account Enumeration Prevention**:
  - Standardized uniform response in `/api/auth/forgot-passcode` preventing username enumeration. Temporary passcodes are bcrypt hashed (cost 12) with mandatory reset flag.

### 7.2 Multi-Tenant Isolation & Role-Based Access Control (RBAC)
- **Strict Tenant Boundaries**:
  - Hardened `resolveTenantSchoolId()` in `src/lib/auth-guard.ts` to reject cross-tenant requests with `403 Forbidden` for non-superadmin users.
  - Restricted school-wide fee data in `src/app/api/fee-master/route.ts` to administrative and accounting roles; students can only query their own ledger.
  - Restricted `src/app/api/teachers/route.ts` GET access to staff and administrative roles.
  - Restricted `src/app/api/admin/storage-health/route.ts` strictly to `AGENCY_SUPERADMIN` and `SUPERADMIN`.
- **Dangerous Route Protection**:
  - Hardened `src/app/api/agency/purge-school/route.ts`: Disallowed GET (405 Method Not Allowed), enforced `AGENCY_SUPERADMIN` role check, required explicit `confirm_school_code` body match, and emitted security audit logs.

### 7.3 Data Sanitization & Sensitive Field Masking
- **Sensitive Field Stripping**:
  - Unconditionally stripped `passcode`, `password`, `password_hash`, `salt`, and `salary` from all GET responses across `teachers`, `students`, and `app-init` routes.
  - Sanitized public student ID QR verification endpoint (`src/app/api/verify/id/route.ts`) to return public directory metadata only (stripped phone, address, DOB, and parents' names) and applied 10 req/min rate limit.
  - Sanitized public schools directory endpoint (`src/app/api/schools/route.ts`) to exclude `admin_pin` and credentials.
- **NoSQL Injection Defense**:
  - Added recursive `sanitizeNoSqlInput()` stripping `$` and `.` MongoDB operator keys from all JSON request payloads.
- **TLS Security**:
  - Removed `tlsAllowInvalidCertificates: true` for production MongoDB connections in `src/lib/mongodb.ts`.

### 7.4 Verification & Compliance
- **Automated Security Suite (`scripts/security-test.ts`)**: **31/31 (100%) tests passed** across all 12 attack and isolation vectors.
- **External Backup**: Pre-migration snapshot safely preserved at `D:\Private\erp_backup_phase2_pre_bcrypt`.

---

## 8. Phase 3 — Attendance & Fees Architecture Unification (2026-09-21)

### 8.1 Single Source of Truth Architecture
- **Unified Attendance Service (`src/lib/services/attendance.service.ts`)**:
  - Implemented canonical service for all attendance operations across the ERP: `markAttendance`, `getAllAttendanceRecords`, `getClassAttendance`, `getStudentAttendance`, `getAttendancePercent`, `getSchoolSummary`, `getAbsentList`, `getHolidayList`, `autoRecordHolidayAttendance`, and `ensureAttendanceIndexes`.
  - Scoped strictly by `school_id` multi-tenant boundaries.
  - Rewired `/api/attendance` and `/api/attendance/scan` to route exclusively through `AttendanceService`.
- **Unified Fees Service (`src/lib/services/fees.service.ts`)**:
  - Built comprehensive double-entry ledger service wrapping `src/lib/fees-engine`: `getStudentFeeStatus`, `collectFee`, `getPendingList`, `getAnnualFeePending`, `getSchoolFeeSummary`, `getCollection`, `getReceipts`, `getReceipt`, `cancelFeeReceipt`, `executeReport`, `getFeeConfig`, `saveFeeConfig`, and `ensureFeeIndexes`.
  - Strict preservation of all CBSE fee rules: quarterly tuition, annual composite charges, 5 distance-based transport slabs, sibling concessions, Fee Deposit Scheme 2026-27, and advance payment discounts.
  - Rewired `/api/fees` and `/api/fee-master` to use `FeesService`.
- **Data Layer Rewiring (`src/lib/db.ts`)**:
  - Replaced legacy fragmented calculations in `Database.getSchoolOverview` with calls to `AttendanceService.getSchoolSummary` and `FeesService.getSchoolFeeSummary`.
  - Standardized `Database.syncStudentFeeStatus` to compute from `getStudentLedger` lines.

### 8.2 Resolved Critical Issues & Bugs
- **Annual Fee Pending Bug Fixed**:
  - Previously showed only 1 student due to chronological FIFO allocation in legacy helpers wiping out April annual charges.
  - Now queries net ledger balance for `fee_head === 'ANNUAL'`, accurately reporting all 93 pending students (totaling ₹4,89,000 in dues).
- **Dashboard "Fees Collected" Stale State Fixed**:
  - Routed dashboard overview aggregates through double-entry ledger sums and unified cache invalidation (`invalidateFeeOverviewMemoryCache`, `invalidateServerCache('fees')`, `invalidateServerCache('overview')`).
- **Reports Engine Accuracy**:
  - Rewired all 4 standard fee reports (`month_class_collection`, `receipt_register`, `payment_mode_summary`, `annual_fee_pending`) directly through `FeesService.executeReport` with 100% mathematical consistency with active receipts.

### 8.3 Migration & Verification
- **Unified Data Migration Script (`scripts/migrate-unified-data.ts`)**:
  - Created and applied canonical database indexes on `attendance`, `fee_ledger`, and `fee_receipts`.
  - Re-synchronized student fee status fields across all 505 student records.
  - Exported migration backup snapshot to `D:\Private\ERP\backups\unified-migration-*.json`.
- **Consistency Test Suite (`scripts/consistency-test.ts`)**:
  - **13/13 (100%) tests passed** across all attendance and fee calculation vectors.
- **Build & Compilation**:
  - `npx tsc --noEmit`: 0 errors.
  - `npm run build`: 0 errors (all 55 Next.js App Router routes compiled cleanly).

---

## 9. Phase 4 — High-Performance Engine & Latency Optimization (2026-09-22)

### 9.1 Infrastructure & Regional Co-location
- **Vercel Mumbai (`bom1`) Configuration**: Added `"regions": ["bom1"]` to `vercel.json` to co-locate serverless execution adjacent to MongoDB Atlas cluster (`ap-south-1`), cutting cross-continental network latency from ~250ms down to single digits per round-trip.
- **Connection Pool Tuning**: Configured `maxPoolSize: 50`, `minPoolSize: 1`, `maxIdleTimeMS: 60000`, `serverSelectionTimeoutMS: 30000` in `src/lib/mongodb.ts` for serverless container reuse.

### 9.2 Database Indexing & Pre-Aggregated Summaries
- **Added Compound Indexes**:
  - `fee_ledger`: `{ school_id: 1, academic_session: 1, is_cancelled: 1, line_type: 1 }`, `{ school_id: 1, student_id: 1, academic_session: 1 }`, `{ school_id: 1, academic_session: 1, fee_head: 1 }`
  - `fee_receipts`: `{ school_id: 1, receipt_no: 1 }`, `{ school_id: 1, academic_session: 1, is_cancelled: 1, payment_date: -1 }`
  - `attendance`: `{ school_id: 1, session: 1, date: -1 }`, `{ school_id: 1, session: 1, class_name: 1, section: 1, date: 1 }`
  - `students`: `{ school_id: 1, academic_session: 1, status: 1 }`, `{ school_id: 1, academic_session: 1, admission_no: 1 }`
  - `school_aggregates`: `{ school_id: 1, session: 1 }` (unique)
- **Pre-Aggregated Summary Service (`src/lib/services/aggregates.service.ts`)**:
  - Maintains atomic O(1) KPI document in `school_aggregates` collection.
  - Updated atomically via `recordFeeDelta` and `updateAttendanceSnapshot` on writes.
  - Full drift recovery / synchronization script created at `scripts/rebuild-aggregates.ts` (rebuilds entire school in 737ms).

### 9.3 Query & Server-Side Optimization
- **Attendance Single-Date Projection**: Replaced full-collection scans in `AttendanceService.getSchoolSummary` with targeted `{ school_id, session, date }` queries with `{ student_records: 0 }` projection, dropping payload from 831 KB to 0.45 KB.
- **Double-Entry Ledger O(1) Aggregates**: Rewired `Database.getSchoolOverview`, `FeesService.getSchoolFeeSummary`, and `getSchoolFinancialStats` to read pre-aggregated summary docs.
- **Instant Cache Revalidation**: Integrated Next.js `revalidateTag('fees', { expire: 0 })`, `revalidateTag('overview', { expire: 0 })`, and `revalidateTag('attendance', { expire: 0 })` across `/api/fees` and `/api/attendance` write endpoints.

### 9.4 Verification
- **Performance Benchmark**: Dashboard overview latency plummeted from **30,082 ms down to 726 ms (41x speedup)**; payload dropped by 59%.
- **Consistency Test**: **13/13 (100%) tests passed** on `scripts/consistency-test.ts`.
- **Builds**: Clean `npx tsc --noEmit` and `npm run build` with 55 routes.



