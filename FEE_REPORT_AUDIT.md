# FEE REPORT AUDIT & ROOT CAUSE ANALYSIS

## 1. Executive Summary & Core Diagnoses

This document details the comprehensive root-cause audit for all reports in **Fee Master → "3. Reports Engine"**, explains the exact reasons for the observed UI bugs (A, B, C, D), and defines the architectural contract for single-source metrics and report registries.

---

## 2. Root Cause of Bug C: Discrepancy in Pending Dues

### Symptom:
- **Reports Engine Header / Full Balance:** ₹1,18,60,400
- **Main Dashboard / Overdue Balance:** ₹89,85,980 (legacy) vs ₹62,72,200 (actual dues as of today)

### Mathematical Proof of Discrepancy:
1. **Full Session Billed Demand (Apr 2026 – Mar 2027):**
   - Total Gross: ₹1,75,50,300
   - Sibling Discounts: ₹1,46,400
   - **Net Full Session Billed:** **₹1,74,03,900**
2. **Total Collected Across All Months to Date:** **₹55,43,500**
3. **Full Year Remaining Balance:**
   $$\text{Full Year Balance} = ₹1,74,03,900 - ₹55,43,500 = \mathbf{₹1,18,60,400}$$
4. **Billed Demands Due on or Before Today (`dueDate <= '2026-09-20'`):**
   - Periods: APR (Apr+Annual), MAY_JUN, JUL, AUG, SEP_FEB.
   - **Billed Due to Date:** **₹1,18,15,700**
5. **Upcoming Demands Due in Future (`dueDate > '2026-09-20'`):**
   - Periods: OCT, NOV, DEC_MAR.
   - **Upcoming Future Demands:** **₹55,88,200**
6. **Statutory Pending Dues (`Balance(asOf today)`):**
   $$\text{Pending Dues (Today)} = \text{Billed Due to Date} - \text{Total Paid} = ₹1,18,15,700 - ₹55,43,500 = \mathbf{₹62,72,200}$$

### Why the values diverged:
- The **Reports Engine** was reporting the **Full Session Outstanding Balance** (₹1,18,60,400), mixing future unbilled months (Oct–Mar: ₹55.88L) into "Pending".
- The **Main Dashboard** was reading from a legacy un-migrated aggregation key which had an older snapshot (₹89,85,980).
- **The Golden Rule Solution:**
  - **`Pending Dues` (or `Outstanding Dues`)** must strictly equal $\text{Balance}(\text{today}) = \text{Billed}(\text{dueDate} \le \text{today}) - \text{Paid}$.
  - **`Upcoming Dues`** must be tracked separately as $\text{Demands}(\text{dueDate} > \text{today}) - \text{Advance Paid}$.
  - Future demands must **never** be mixed into "Pending Dues".

---

## 3. Root Cause of Bugs A, B, and D: "Month-wise Class-wise Collection"

### Symptom:
- "Class" column is blank.
- "Total Students", "Submitted", "Not Submitted" show 0.
- Table shows individual student rows (₹15,000 / ₹25,500 / ₹7,800) instead of one row per Class-Section.
- Collected shows ₹0 in every row and in Total.
- Realization % is empty.

### Root Cause:
1. **Fallback to Default:** In `src/lib/fees/fee-service.ts`, `queryReport()` did not have an explicit `case 'month_class_collection':` handler. It fell through to `default:`.
2. **Schema Mismatch:**
   - The `default:` case emitted **student-level rows**:
     `{ studentName, admissionNo, classSection, demandPaise, discountPaise, paidPaise, pendingPaise, status }`
   - The report column configuration (`REPORT_CONFIGS` in `report-configs.ts`) expected **class-level aggregated rows**:
     - `className` (Missing in student row $\rightarrow$ column showed blank)
     - `totalStudents` (Missing $\rightarrow$ showed 0)
     - `submittedCount` (Missing $\rightarrow$ showed 0)
     - `notSubmittedCount` (Missing $\rightarrow$ showed 0)
     - `realizationRate` (Missing $\rightarrow$ column was empty)
3. **Month Filter Ignored:** In `default:`, the month parameter was not filtered, so whole-session numbers were returned per student rather than September specific class-wise collection.

---

## 4. Comprehensive Audit Table for All 20 Reports

| # | Report Key | Group | Expected Aggregation Level | Required Output Columns / Keys | Previous State & Defect |
|---|---|---|---|---|---|
| 1 | `month_class_collection` | Collection | **Class-Section Group** (1 row per Class-Sec) | `className`, `totalStudents`, `submittedCount`, `notSubmittedCount`, `demandPaise`, `collectedPaise`, `pendingPaise`, `realizationRate` | Fell into `default:`, returned student rows, wrong column keys, blank class, 0 counts. |
| 2 | `daily_collection` | Collection | **Payment Voucher** (1 row per receipt) | `txnDate`, `receiptNo`, `studentName`, `className`, `paymentMode`, `collectedBy`, `amountPaise` | Worked for all dates, but did not filter by chosen month/date range. |
| 3 | `receipt_register` | Collection | **Receipt Record** (Active & Cancelled) | `receiptNo`, `paymentDate`, `studentName`, `admissionNo`, `className`, `paymentMode`, `amountPaise`, `status`, `cancelledReason` | Partially working; cancelled receipts lacked proper filter toggle. |
| 4 | `payment_mode_summary` | Collection | **Payment Mode Group** (CASH, UPI, NEFT, CHEQUE) | `mode`, `receiptCount`, `amountPaise`, `percentage` | Fell into `default:`, returned individual student rows. |
| 5 | `pending_fees_list` | Pending | **Student Level** | `srNo`, `studentName`, `admissionNo`, `classSection`, `fatherName`, `mobile`, `monthsPending`, `pendingPaise`, `lastPaidDate` | Calculated full-year pending instead of as-of-today pending. |
| 6 | `never_paid_defaulters` | Pending | **Student Level** | `studentName`, `admissionNo`, `classSection`, `fatherName`, `mobile`, `totalDemandPaise`, `pendingPaise`, `status` | Verified, but needed exact sorting by class/admission number. |
| 7 | `annual_fee_pending` | Pending | **Student Level** | `studentName`, `admissionNo`, `classSection`, `fatherName`, `mobile`, `annualDuePaise`, `status` | Working (86 scholars, ₹4,60,000 dues). |
| 8 | `admission_fee_pending` | Pending | **Student Level** | `studentName`, `admissionNo`, `classSection`, `fatherName`, `mobile`, `admissionDuePaise`, `registrationDuePaise`, `totalOneTimeDuePaise`, `status` | Working (504 scholars, ₹30,24,000). |
| 9 | `advance_payers` | Pending | **Student Level** | `studentName`, `admissionNo`, `classSection`, `fatherName`, `mobile`, `billedToDatePaise`, `paidPaise`, `advancePaise` | Fell into `default:`, missing advance calculation. |
| 10 | `exam_fee_report` | Head-wise | **Student Level** | `studentName`, `admissionNo`, `classSection`, `demandPaise`, `paidPaise`, `duePaise`, `status` | Fell into `default:`, returned combined demand instead of EXAM head. |
| 11 | `transport_fee_report` | Head-wise | **Student Level** (Opted only) | `studentName`, `admissionNo`, `classSection`, `slab`, `monthlyRate`, `demandPaise`, `paidPaise`, `duePaise`, `status` | Fell into `default:`, returned all students instead of transport-opted. |
| 12 | `hostel_fee_report` | Head-wise | **Student Level** (Opted only) | `studentName`, `admissionNo`, `classSection`, `roomNo`, `demandPaise`, `paidPaise`, `duePaise`, `status` | Fell into `default:`, returned all students instead of hostel-opted. |
| 13 | `annual_fee_head_report` | Head-wise | **Student Level** (All Scholars) | `studentName`, `admissionNo`, `classSection`, `grossPaise`, `discountPaise`, `netPaise`, `paidPaise`, `duePaise`, `status` | Fell into `default:`, returned combined demand. |
| 14 | `sibling_discount_report` | Discounts | **Student Level** (Discount recipients) | `studentName`, `admissionNo`, `classSection`, `siblingOrder`, `fatherName`, `grossTuitionPaise`, `discountPaise`, `netTuitionPaise` | Fell into `default:`, did not display sibling discount breakdown. |
| 15 | `month_wise_discount` | Discounts | **Period/Month Group** | `month`, `totalStudents`, `grossPaise`, `discountPaise`, `netPaise` | Fell into `default:`, returned student rows instead of month summary. |
| 16 | `manual_concessions` | Discounts | **Student Level** | `studentName`, `admissionNo`, `classSection`, `concessionType`, `reason`, `amountPaise`, `approvedBy` | Fell into `default:`. |
| 17 | `class_wise_summary` | Summaries | **Class Level** (DCB) | `className`, `totalStudents`, `demandPaise`, `discountPaise`, `collectedPaise`, `pendingPaise`, `realizationRate` | Working, but needed exact canonical class order PG $\rightarrow$ XII and section granularity. |
| 18 | `student_statement` | Summaries | **Student Ledger** | `studentName`, `admissionNo`, `classSection`, `demandPaise`, `discountPaise`, `paidPaise`, `pendingPaise`, `status` | Handled by fallback. |

---

## 5. Standard Metric Contract to be Implemented

```typescript
// src/lib/fees/metrics.ts
export function computeMetrics(demands: FeeDemandRecord[], payments: FeePaymentRecord[], asOfDate: string = '2026-09-20') {
  // 1. Billed Due to Date (Demands with dueDate <= asOfDate)
  const billedDueToDate = demands.filter(d => d.dueDate <= asOfDate).reduce((s, d) => s + d.netAmount, 0);
  
  // 2. Upcoming Billed (Demands with dueDate > asOfDate)
  const upcomingBilled = demands.filter(d => d.dueDate > asOfDate).reduce((s, d) => s + d.netAmount, 0);
  
  // 3. Collected (Non-cancelled payments)
  const totalCollected = payments.filter(p => !p.cancelled).reduce((s, p) => s + p.amountPaid, 0);
  
  // 4. Pending / Outstanding Dues (Statutory definition)
  const pendingDues = Math.max(0, billedDueToDate - totalCollected);
  
  // 5. Advance Collected
  const advanceAmount = Math.max(0, totalCollected - billedDueToDate);
  
  // 6. Realization Rate
  const realizationRate = billedDueToDate > 0 ? Math.round((totalCollected / billedDueToDate) * 100) : 0;

  return { billedDueToDate, upcomingBilled, totalCollected, pendingDues, advanceAmount, realizationRate };
}
```
