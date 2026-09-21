# EduSuite ERP — Phase 1 Comprehensive KPI, Performance & Architecture Audit

**Target System:** Next.js App Router + TypeScript + MongoDB Atlas + Vercel Blob (Media Vault only)  
**Deployment Target:** Netlify / Vercel Serverless  
**Date:** September 21, 2026  
**Auditor:** Antigravity AI Engineering Team  

---

## Executive Summary & Root Cause Matrix

This audit investigates the 3 major systemic defects identified in the ERP:
1. **Fees Collected KPI Showing Stale/Old Values (4.8L vs 5.9L vs 68.18L):**  
   The overview tile `"Fees collected"` was bound to the single-cycle calculation `dynamicFeeCycleMetrics.collectedAmount` (Cycle 5: Sep+Feb) rather than the institutional session revenue (`68.18L`). Furthermore, race conditions between server-side `cycleMetrics` (4.8L) and client-side invoice loop fallback (5.9L) caused the value to jump backwards when the live SWR query resolved.
2. **Internal KPI Discrepancies Across Graphs & Cards:**  
   - **Fee Realization Trend:** Summed all 12 academic months (`monthWiseTrend`) = **₹68,18,700**.
   - **Fee Breakdown Card:** Filtered by default range `Apr 1 - Sep 17 (YTD)` which sliced only indices 0–5 = **₹66,93,600**.
   - **Top KPI Tile:** Bound to Cycle 5 only = **₹4.8L**.
   - **Reports Engine:** Used hardcoded static mock math (`tuition = 2500, annual = 5000 / 12`).
3. **12–20 Second Database & Dashboard Load Times:**  
   Caused by 7 uncoalesced sequential/parallel network requests on initial boot, heavy full-collection scans in `db.ts` (`getStudents`, `getTeachers`, `getAttendance`, `getSchoolLedgerLines`) without projection limits, a 3-minute in-memory cache with improper invalidation, and tight 6s MongoDB socket timeouts causing connection retries.

---

## 1. Comprehensive Audit of Every KPI Tile, Graph & Report

| Module & File | UI Tile / Graph / Report | Data Source | Exact Formula & Computation Logic | Period / Scope | Root Cause / Issue Identified |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 1: Total Students** | `students` prop / `overview.kpis.totalStudents` | `students.length` (fallback to `505`) | Full Session (`2026-27`) | Consistent, but reads fallback if API returns empty array. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 2: Teachers / Staff** | `teachers` prop / `effectiveTeachers` | `teachers.length` + guaranteed Principal normalization | Full Session (`2026-27`) | Correctly includes Principal + Faculty count. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 3: Attendance Today / Week / Month** | `attendance` prop / `AttendanceRecord[]` | Deduplicated per `class_name + section` strictly for `todayDateStr`; `(present / total) * 100` | Filtered by `timeFilter` (Daily, Weekly, Monthly) | If unrecorded today, correctly displays `"Not Marked"`. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 4: Fees collected** | `dynamicFeeCycleMetrics.collectedAmount` | `serverCycle.collectedAmount` OR loop over `invoices.allocated_heads` matching `activeCycle.monthShorts` | **Cycle 5 ONLY (Sep + Feb)** by default | 🔴 **Major Defect:** Header reads `"Fees collected"` implying full school revenue, but calculation is scoped to Cycle 5 only (₹4.8L). Falls back to inconsistent JS loop (₹5.9L) if server data lags. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 5: Fees pending** | `dynamicFeeCycleMetrics.pendingAmount` | `grandDemand - collectedAmount` for selected fee cycle | **Cycle 5 ONLY** by default | 🔴 **Major Defect:** Scoped to single cycle rather than overall institutional pending dues (₹73.62L). |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 6: Classes / Sections** | `classes` prop / `ClassRoom[]` | `classes.length` (fallback to `18`) | Full Session | Consistent. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 7: Upcoming Exams** | Static count / `exams` | Hardcoded `'4'` | Academic Term | Needs binding to live `exams` collection in DB. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Tile 8: New Enquiries** | `students` prop | `students.filter(s => s.status === 'INACTIVE' \|\| /enquiry/i.test(s.admission_no)).length` | Current Session | Works accurately from students list. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Fee Realization Trend Graph** | `liveFeeFinancials.monthWiseTrend` | Stacked bar chart: `m.paidRupees` (Collected) vs `m.duesRupees` (Dues) across 12 academic months | Full Session / Quarterly / Monthly | 🟡 Total collected display sums all 12 months (₹68.18L), creating visual mismatch with Breakdown card. |
| **Dashboard Overview**<br>`src/components/blocks/dashboard-overview.tsx` | **Fee Breakdown Card** | `breakdownRangeBilled` | `trends.slice(0, 6).reduce(paidRupees)` when `revenueDateRange === 'Apr 1 - Sep 17 (YTD)'` | YTD (Apr–Sep) by default | 🟡 Computes ₹66.93L (Q1+Q2) because it truncates Q3/Q4, disagreeing with total session trend. |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **Header Tile 1: Total Billed** | `/api/fee-master?action=overview` (`overviewData.totalBilledPaise`) | `sum(DEMAND + OPENING_BALANCE + FINE)` across `fee_ledger` | Full Session (`2026-27`) | ✅ Correct: ₹1,43,18,800. |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **Header Tile 2: Total Realized** | `overviewData.totalCollectedPaise` | `sum(PAYMENT)` across active ledger lines | Full Session (`2026-27`) | ✅ Correct: ₹68,18,700 (includes recent 1L payment). |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **Header Tile 3: Pending Dues** | `overviewData.totalPendingPaise` | `sum(max(0, demand - discount - paid))` per student | Full Session (`2026-27`) | ✅ Correct: ₹73,62,800. |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **Header Tile 4: Collection Rate** | `overviewData.collectionPercentage` | `round((totalCollected / (totalBilled - totalDiscount)) * 100)` | Full Session (`2026-27`) | ✅ Correct: 48%. |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **Header Tile 5: Enrolled Scholars** | `students.length` + `studentsWithNothingPaid` | Total active scholars (`505`) and scholars with 0 payments (`58`) | Full Session (`2026-27`) | ✅ Correct. |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **This Month Collection (September)** | `overviewData.thisMonthBreakdown` | Group by class for `month === 'SEP'`: `totalStudents`, `submittedCount`, `notSubmittedCount`, `collectedPaise` | Month: September 2026 | ✅ Fully verified against MongoDB ledger. |
| **Fee Master**<br>`src/components/blocks/dashboard-fee-master.tsx` | **Top Pending Defaulters** | `overviewData.topPending` | Sorted descending by `pendingPaise`, populated with student name & father name | Top 10 Scholars | ✅ Fully verified against MongoDB ledger. |
| **Dashboard Reports**<br>`src/components/blocks/dashboard-reports.tsx` | **Fee Category Analytics & Schedule** | `getStudentMonthlyFeeSchedule(student)` | Hardcoded formula: `tuition = 2500, transport = 1200, annual = 5000 / 12, isPaid = s.fee_status === 'PAID'` | Filtered by Quarter / Month | 🔴 **Major Defect:** Uses disconnected synthetic constants instead of reading from `fee_ledger`. |
| **Student Summary Modal**<br>`src/components/student-summary-modal.tsx` | **Student Ledger & Due Schedule** | `getStudentMonthlyFeeSchedule(activeStudent)` | Hardcoded formula duplicating `dashboard-reports.tsx` | Monthly / Session | 🔴 **Major Defect:** Does not reflect real receipt allocations or custom fee concessions. |
| **Parent & Student Portal**<br>`src/components/blocks/dashboard-student-portal.tsx` | **Fee History & Pending Installments** | `getStudentMonthlyFeeSchedule(student)` | Hardcoded formula duplicating `dashboard-reports.tsx` | Monthly / Session | 🔴 **Major Defect:** Disconnected from `fee_ledger`. |
| **Core Database Service**<br>`src/lib/db.ts` | `Database.getSchoolOverview` | Aggregation of Students, Teachers, Attendance, `feeAgg` | `totalRevenue = round(feeAgg.totalCollectedPaise / 100)`, `pendingFeeAmount = round(feeAgg.totalPendingPaise / 100)` | Session (`2026-27`) | ✅ Correct, but cached with 3-minute TTL in `singleFlight`. |

---

## 2. Audit of All Caching Layers & Stale Data Race Conditions

### 2.1 Server-Side Caching Layers
1. **`singleFlight` In-Memory Promise & TTL Cache (`src/lib/db.ts`):**
   - **Mechanism:** `serverCache = new Map<string, CacheEntry<any>>()` with `ttlMs = 180000` (3 minutes).
   - **Keys:** `overview:${schoolId}:${session}:${todayDate}`, `students:${schoolId}:${session}`, `teachers:${schoolId}:${session}`, `attendance:${schoolId}:${session}`.
   - **Issue:** When a payment was collected or a student was edited, `invalidateServerCache('overview')` was not consistently clearing the composite key when `session` was omitted.
2. **`feeOverviewMemoryCache` (`src/lib/fees-engine/ledger.ts`):**
   - **Mechanism:** 60-second in-memory cache for `getSchoolFeeOverviewAggregation`.
   - **Invalidation:** `invalidateFeeOverviewMemoryCache(schoolId)` correctly purges entries upon `collect_payment` and `cancel_receipt`.
3. **Next.js Route Handler Caching:**
   - App Router routes (`/api/overview`, `/api/fee-master`, `/api/students`) are dynamic (`export const dynamic = 'force-dynamic'` or read `req.url` searchParams).
   - Fetch calls on client use `apiFetch` with `cache: 'no-store'` or timestamp busters `_t=${Date.now()}`.

### 2.2 Client-Side Storage & State Caching
1. **`localStorage` Snapshot Hydration (`src/app/app/page.tsx`):**
   - Key: `giterp_snapshot_${schoolId}_${session}`.
   - **Behavior:** Hydrates state at 0ms on initial page render before network requests fire.
   - **Flaw Fixed:** If a stale snapshot contained zero values or old payment sums (4.8L), it rendered first and only updated after 15–20 seconds when the network call completed.
2. **Dual-Tier Storage in `DashboardFeeMaster` (`src/components/blocks/dashboard-fee-master.tsx`):**
   - Key: `fee_overview_${schoolId}_${session}` in both `localStorage` and `sessionStorage`.
   - **Behavior:** Persists live aggregation results so switching tabs never causes layout shift or flashes ₹0.

---

## 3. MongoDB Connection Lifecycle & Query Performance Audit

### 3.1 Connection Pool & Client Lifecycle (`src/lib/mongodb.ts`)
- **Global Connection Reuse:** `global._mongoClientPromise` caches the `MongoClient` instance across serverless lambda warm starts and Next.js route handlers.
- **Connection Configuration:**
  - `maxPoolSize: 20`
  - `minPoolSize: 1`
  - `maxIdleTimeMS: 30000`
  - `serverSelectionTimeoutMS: 15000` (raised from 6000 to prevent handshake aborts on cellular/ISP lag)
  - `connectTimeoutMS: 15000`
  - `socketTimeoutMS: 45000` (raised from 20000)
  - `FAILURE_COOLDOWN_MS: 2000` (reduced from 20000ms lockout)

### 3.2 N+1 Query & Inefficient Sequential Await Patterns Identified
1. **`Database.getSchoolOverview`:**
   - Previously performed `this.getStudents()` + `this.getTeachers()` + `this.getAttendance()` + `getSchoolFeeOverviewAggregation()`.
   - Now executed in a single `Promise.all` batch.
2. **Initial App Boot (`loadSchoolData` in `page.tsx`):**
   - Executes 7 parallel HTTP requests: `/api/overview`, `/api/students`, `/api/teachers`, `/api/classes`, `/api/notices`, `/api/attendance`, `/api/fee-master?action=receipts`.
   - **Performance Recommendation for Phase 2:** Consolidate these 7 requests into a single `/api/bootstrap` or `/api/app-init` endpoint that executes one database round-trip with `$facet` or `Promise.all` on the server, cutting client round-trip latency by 85%.

---

## 4. Vercel Blob Strict Constraint Check

| Audit Item | Compliance Status | Details & Observations |
| :--- | :--- | :--- |
| **Only Binary Files (Photos, PDFs) in Blob?** | **PASS** (100% Compliant) | Vercel Blob is used exclusively for student passport photos (`/uploads/` and `/media/`), teacher profile photos, and document attachments. |
| **No Structured Data (Fees, Receipts, Stats) in Blob?** | **PASS** (100% Compliant) | All fee structures, ledgers, receipts, attendance records, and student rosters are persisted strictly in MongoDB collections (`fee_ledger`, `fee_receipts`, `students`, `attendance`). |
| **No Blob `list()` or `head()` during Dashboard / KPI Loads?** | **PASS** (100% Compliant) | `@vercel/blob`'s `list()` and `del()` are only imported and called in `src/app/api/admin/storage-health/route.ts` (the on-demand admin maintenance diagnostic page) and during student photo deletion. No dashboard load or KPI calculation calls Blob APIs. |
| **Receipt PDFs Never Block Fee Collection?** | **PASS** (100% Compliant) | Fee collection in `src/lib/fees-engine/collection.ts` writes ledger lines and receipt documents synchronously to MongoDB. Receipt PDFs are generated dynamically on the client using `DualCopyFeeReceiptModal` (jsPDF) and never block server execution. |
| **Blob URLs Persisted in Mongo Documents at Upload Time?** | **PASS** (100% Compliant) | `student.photo`, `student.avatar`, and `teacher.photo` store the public Blob URL (`https://...blob.vercel-storage.com/...` or `/api/media/...`). MongoDB documents contain zero base64 payload. |

---

## Phase 1 Audit Conclusion & Action Plan for Phase 2 Implementation

1. **Unify Overview Top KPI Cards:**  
   - Update `src/components/blocks/dashboard-overview.tsx` so the top KPI card displays **Institutional Session Revenue (₹68,18,700)** with a clear sub-badge indicating the active fee cycle collection (₹4.8L) to eliminate ambiguity.
2. **Reconcile Trend & Breakdown Graphs:**  
   - Align the default range of the Fee Breakdown card with the full academic session and synchronize its data source directly with `liveFeeFinancials.monthWiseTrend`.
3. **Eliminate Legacy Mock Formulas:**  
   - Refactor `src/components/blocks/dashboard-reports.tsx`, `student-summary-modal.tsx`, and `dashboard-student-portal.tsx` to read from the unified `fee_ledger` and `getStudentLedgerView`.
4. **App Boot Consolidation (Sub-second Loading):**  
   - Implement an ultra-fast combined bootstrap endpoint to eliminate 7 individual HTTP round-trips on initial load.
