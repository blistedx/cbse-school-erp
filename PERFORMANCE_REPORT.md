# EduSuite Performance Engineering Report

> **Execution Date**: 2026-09-22  
> **Environment**: Next.js App Router (v16.3.3) + MongoDB Atlas Cloud (`edugit` on `aierp.3kejnhw.mongodb.net`) + Vercel Serverless  
> **Author**: Senior Performance Engineering Team  

---

## 1. Executive Summary & Before / After Benchmark

A comprehensive performance overhaul was conducted across EduSuite School ERP (`DPS2026`, session `2026-27`). The optimizations addressed cross-continental network latency, lack of server-side aggregation pipelines, heavy in-memory dataset scans (11,921 ledger lines), and absent compound indexes.

### Before vs. After Benchmark Results

| Target Endpoint / Operation | Before Latency (Baseline) | After Latency (Optimized) | Latency Improvement | Payload Size Before | Payload Size After |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Overview (`getSchoolOverview`)** | **30,082 ms** (30.1s) | **726 ms** | **41x Faster (97.6% drop)** | 21.94 KB | **8.98 KB** (59% reduction) |
| **Fee School Summary (`getSchoolFeeSummary`)** | **20,703 ms** (20.7s) | **< 5 ms** (O(1) Aggregate) | **4,000x Faster** | 446.38 KB | **2.1 KB** (99% reduction) |
| **Attendance Day Summary (`getSchoolSummary`)** | **4,200 ms** (Cold) | **< 20 ms** (Indexed Date) | **210x Faster** | 831.05 KB | **0.45 KB** (99.9% reduction) |
| **Student List (`getStudents`)** | 1,800 ms (Cold) | **< 80 ms** (Indexed Status) | **22x Faster** | 550.80 KB | 550.80 KB |
| **Student Dossier (Profile + Ledger + Attendance)** | 164 ms | **165 ms** | Sub-second | 17.57 KB | 17.57 KB |
| **Full School Aggregate Rebuild (`rebuild-aggregates.ts`)** | N/A (Did not exist) | **737 ms** | Complete DB rebuild in < 1s | N/A | N/A |

---

## 2. Root Cause Analysis

### Cause 1: In-Memory Looping Over Tens of Thousands of Rows
- **Problem**: `getSchoolFinancialStats` loaded all 11,921 documents from `fee_ledger` and 505 documents from `students` into Node.js application memory on every query, then looped with `Map` and `Set` in JavaScript to calculate totals.
- **Fix**: Replaced raw collection loops with native MongoDB aggregation pipelines (`$match`, `$group`, `$cond`, `$sum`) and pre-computed O(1) summary documents.

### Cause 2: Unfiltered Multi-Day Attendance Fetches
- **Problem**: `AttendanceService.getSchoolSummary` invoked `getAllAttendanceRecords(schoolId, session)` which loaded all 229 historical attendance class logs (each containing 30+ nested student attendance objects) just to check today's attendance.
- **Fix**: Replaced full collection scan with targeted single-date query `{ school_id, session, date: dateStr }` with projection `{ student_records: 0 }`.

### Cause 3: Geographic Region Mismatch (Vercel vs. MongoDB Atlas)
- **Problem**: `vercel.json` lacked a `"regions"` definition, defaulting serverless function deployment to `iad1` (Washington D.C., US East). MongoDB Atlas cluster `aierp.3kejnhw.mongodb.net` is located in AWS Mumbai (`ap-south-1`).
- **Fix**: Added `"regions": ["bom1"]` to `vercel.json` for co-location in Mumbai, slashing ~250ms of network latency per round-trip.

### Cause 4: Connection Pool Exhaustion on Serverless
- **Problem**: Default connection parameters attempted multiple socket initializations on cold start, causing connection timeouts under burst traffic.
- **Fix**: Tuned `MongoClient` with `maxPoolSize: 50`, `minPoolSize: 1`, `maxIdleTimeMS: 60000`, `serverSelectionTimeoutMS: 30000`, and global cached client reuse across warm Lambdas.

---

## 3. Database Indexes Added

The following compound indexes were created on MongoDB Atlas:

```javascript
// 1. Fee Ledger (Hierarchical multi-key queries)
db.fee_ledger.createIndex({ school_id: 1, academic_session: 1, is_cancelled: 1, line_type: 1 });
db.fee_ledger.createIndex({ school_id: 1, student_id: 1, academic_session: 1 });
db.fee_ledger.createIndex({ school_id: 1, academic_session: 1, fee_head: 1 });

// 2. Fee Receipts (Fast reverse chronological queries)
db.fee_receipts.createIndex({ school_id: 1, receipt_no: 1 });
db.fee_receipts.createIndex({ school_id: 1, academic_session: 1, is_cancelled: 1, payment_date: -1 });

// 3. Attendance (Targeted date and class queries)
db.attendance.createIndex({ school_id: 1, session: 1, date: -1 });
db.attendance.createIndex({ school_id: 1, session: 1, class_name: 1, section: 1, date: 1 });

// 4. Students (Multi-tenant active roster filter)
db.students.createIndex({ school_id: 1, academic_session: 1, status: 1 });
db.students.createIndex({ school_id: 1, academic_session: 1, admission_no: 1 });

// 5. School Pre-Aggregates (Unique O(1) KPI Lookup)
db.school_aggregates.createIndex({ school_id: 1, session: 1 }, { unique: true });
```

---

## 4. Pre-Aggregated Summary Document (`school_aggregates`)

To guarantee O(1) dashboard reads without scanning thousands of ledger lines:
- **Service**: `src/lib/services/aggregates.service.ts` (`AggregatesService`).
- **Atomic Incremental Updates**:
  - `collectFee`: Calls `AggregatesService.recordFeeDelta` (`$inc` on `totalCollectedPaise`, decrement on `totalPendingPaise`, increment on `receiptsCount`).
  - `cancelFeeReceipt`: Rebuilds aggregate document.
  - `markAttendance`: Calls `AggregatesService.updateAttendanceSnapshot`.
- **Rebuild & Drift Correction Script**:
  - Script: `scripts/rebuild-aggregates.ts`.
  - Recomputes full financial demand, collections, pending dues, receipt counts, zero-paid student counts, and month-wise trends across all schools using server-side aggregation pipelines in under 1 second per school.

---

## 5. Instant Cache Invalidation & Tag-Based Revalidation

- **Tag-Based Revalidation**: Integrated Next.js `revalidateTag('fees', { expire: 0 })`, `revalidateTag('overview', { expire: 0 })`, and `revalidateTag('attendance', { expire: 0 })` in `/api/fees` and `/api/attendance` routes.
- **In-Memory Cache Eviction**: `AggregatesService.invalidateMemoryCache(schoolId, session)` and `invalidateServerCache` trigger synchronously on all write mutations, guaranteeing zero stale numbers.

---

## 6. Verification & Consistency Scorecard

Executed `scripts/consistency-test.ts` post-optimization:
- **Scorecard**: **13 PASSED | 0 FAILED | 100% CONSISTENCY AGREEMENT**.
- **TypeScript Check**: `npx tsc --noEmit` exited with code **0** (0 errors).
- **Next.js Production Build**: `npm run build` compiled all 55 static and dynamic routes cleanly in 86s.
