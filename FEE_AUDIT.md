# Comprehensive Fee Architecture & Engine Audit (FEE_AUDIT.md)

**Generated:** 2026-09-20T23:14:00+05:30  
**Target Academic Session:** 2026-27  
**School Scope:** Delhi Public School (DPS2026) — 505 Enrolled Scholars  

---

## 1. Trace of All Fee Computation Sites

| File Path | Function / Component | Purpose | Issue / Defect Found |
|---|---|---|---|
| `src/lib/db.ts` | `Database.getSchoolOverview()` | Aggregates dashboard header KPIs (Billed, Paid, Pending, %) | Used mixed aggregation and cached overview; didn't link directly to unified demand/payment ledger. |
| `src/lib/fees-engine/ledger.ts` | `getSchoolFeeOverviewAggregation()`, `buildStudentLedgerView()` | Generates per-student DCB ledger item view | Relied on mixed line types (`DEMAND`, `PAYMENT`) where duplicate heads (`PROSPECTUS` vs `REGISTRATION`, `ADMISSION` APR vs ONE_TIME) caused balance skew. |
| `src/lib/fees-engine/reports.ts` | `executeReport(schoolId, reportId, filters, students)` | Generates 16 Fee Master reports | `annual_fee_pending` filtered on `fee_head === 'ANNUAL'` balance. Because April payments were bulk-updated to `ANNUAL` across 504 scholars, only 1 scholar had balance > 0. |
| `src/components/student-summary-modal.tsx` | `totalPending` & Hero Banner | Displays scholar fee account status (`Clear` vs `Dues Pending`) | Computed `totalPending` from legacy `invoices` array instead of active ledger summary, showing "Clear" even with ₹22,500 due. *(Fixed in previous step)* |
| `src/components/blocks/dashboard-reports.tsx` | `getStudentFeeSummary(student, invoices)` | Legacy report rendering | Uses obsolete `invoices` structure instead of unified ledger service. |
| `src/components/blocks/dashboard-overview.tsx` | Overview KPI cards | Renders school-level fee overview | Needs direct invocation of unified Fee Service. |

---

## 2. Root Cause Analysis: Why "Annual Fee Pending Report" Showed Only 1 Row

1. **Synthetic April Payment Overwrite:**
   - In earlier iterations, April receipts for all non-defaulter students were bulk-mapped to `fee_head: 'ANNUAL'` with amount ₹5,000 / ₹6,000.
   - This marked 504 out of 505 students as having paid their Annual Fee in full.
   - Only **Tanmay Tripathi** (Class 8-A, ₹5,000) was left as unpaid in the entire database.
2. **Lack of Realistic Defaulter Cohort in Annual Fee:**
   - In a realistic 505-student institution, ~10-12% of scholars (50-60 students) have overdue annual development fees.
   - The seed script did not establish a distinct cohort of annual fee defaulters.
3. **Head Discrepancy & Duplicate Demands:**
   - `PROSPECTUS` (505 demands) and `REGISTRATION` (504 demands) existed simultaneously.
   - `ADMISSION` was billed both as an April monthly head and as a One-Time head.
   - This created double billing (Total Demand inflated to ₹1.62 Cr) while April payments were applied unevenly.

---

## 3. Database State Analysis (Session 2026-27, 505 Scholars)

```
====================================================
                 DATABASE AUDIT STATS               
====================================================
Total Enrolled Scholars        : 505
Total Active Fee Ledger Lines  : 13,674

DEMAND LINES PER FEE HEAD:
- TUITION                      : 5,551 lines
- ANNUAL                       : 505 lines
- PROSPECTUS                   : 505 lines (Duplicate with REGISTRATION)
- REGISTRATION                 : 504 lines
- ADMISSION                    : 504 lines
- EXAM                         : 1,514 lines
- LAB                          : 168 lines
- FILE_MISC                    : 43 lines
- TRANSPORT                    : 14 lines (Only 2 scholars opted in DB)

PAYMENT LINES PER FEE HEAD:
- TUITION                      : 2,294 lines
- ANNUAL                       : 554 lines (Exceeds 505 demands due to duplicates)
- PROSPECTUS                   : 504 lines
- EXAM                         : 434 lines
- ADMISSION                    : 53 lines
- REGISTRATION                 : 53 lines
- LATE_FEE                     : 37 lines

FINANCIAL SUMMARY:
- Total Gross Demand           : ₹1,62,80,150
- Total Discounts              : ₹93,600
- Net Billed Demand            : ₹1,61,86,550
- Total Collected              : ₹72,53,570
- Outstanding Dues             : ₹89,32,980
- Realization Rate             : 44.8%

ANNUAL FEE AUDIT:
- Annual Fee Demand            : ₹26,93,000
- Annual Fee Collected         : ₹29,39,170 (Over-collected due to duplicates)
- Annual Fee Pending Scholars  : 1 (Tanmay Tripathi, ₹5,000)
```

---

## 4. Single Source of Truth Architectural Plan (Steps 2 to 7)

1. **Unified Schema (`fee_demands` & `fee_payments` / clean `fee_ledger`):**
   - Clean canonical fee heads: `TUITION`, `ANNUAL`, `TRANSPORT`, `EXAM`, `HOSTEL`, `ADMISSION`, `REGISTRATION`, `LAB`, `MISC`.
   - Demand attributes: `studentId`, `feeHead`, `period`, `grossAmount`, `discountAmount`, `netAmount`, `dueDate`.
   - Payment attributes: `receiptNo`, `studentId`, `demandKey`, `amountPaid`, `mode`, `paidOn`, `isCancelled`.
   - Derived demand status: `paidAmount = sum(active payments)`, `balance = netAmount - paidAmount`, `status = PAID | PARTIAL | DUE | OVERDUE`.

2. **Unified Fee Service (`src/lib/fees/fee-service.ts`):**
   - `generateDemandsForStudent(student, session)`
   - `generateDemandsForSession(schoolId, session)`
   - `getStudentLedger(schoolId, studentId, session)`
   - `queryReport(reportKey, filters)`
   - `getSchoolFeeOverview(schoolId, session)`

3. **Deterministic Backfill with Clean Cohorts:**
   - 505 students across PG to Class 12.
   - ~70% Fully Paid through August 2026.
   - ~15% Partially Paid.
   - ~10% Defaulters (50-60 scholars with pending Annual Fee and Tuition dues).
   - ~5% Advance Payers (full year or advance credit).

4. **All 16 Reports Re-wired to Unified Query Engine:**
   - Grand totals, KPI summaries, and export formats strictly match the row sum.
