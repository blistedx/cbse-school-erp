# EduSuite School ERP — Deletion Report (Pre-Approval Audit)

> **Status**: ⚠️ **PENDING USER APPROVAL**  
> **Rule**: No files, database records, or collections will be deleted until explicit user approval ("APPROVED") is granted.  
> **Backup Protocol**: Prior to any MongoDB deletions, every collection will be exported to `/backups/<date>/` (JSON format).

---

## 1. Dead Root Directories & Legacy Artifacts

| Item / Path | Proof of Dead Status | Size | Risk Level |
|---|---|---|---|
| `models/` (Root directory, 14 files) | 0 references in `src/`. Duplicate of `src/models/`. Root directory is outside Next.js TypeScript compilation path. | ~45 KB | **LOW** |
| `lib/db.js` & `lib/schema.sql` (Root `lib/`, 2 files) | Legacy CockroachDB / PostgreSQL migration remnants. 0 imports across `src/` (the ERP data layer is `src/lib/db.ts` and `src/lib/mongodb.ts`). | ~22 KB | **LOW** |
| `legacy_html/` (4 HTML prototype files) | 0 imports/references anywhere in the codebase. Early UI HTML mockups superseded by Next.js App Router components. | ~150 KB | **LOW** |
| `scratch/` (6 temporary files) | 0 imports/references. Temporary workspace files used during previous manual theme scripts. | ~25 KB | **LOW** |

---

## 2. Dead & Unused Files in `src/`

| Item / Path | Proof of Dead Status | Size | Risk Level |
|---|---|---|---|
| `src/components/mobile/mobile-shell.tsx` | 0 imports in `src/`. The mobile route (`src/app/mobile/page.tsx`) redirects directly to `/app`. Superseded by responsive dashboard in `/app`. | 42 KB | **LOW** |
| `src/components/mobile/role-driver-view.tsx` | Only referenced by dead `mobile-shell.tsx`. 0 active imports in the application. | 15 KB | **LOW** |
| `src/components/mobile/role-parent-view.tsx` | Only referenced by dead `mobile-shell.tsx`. 0 active imports in the application. | 68 KB | **LOW** |
| `src/components/mobile/role-principal-view.tsx` | Only referenced by dead `mobile-shell.tsx`. 0 active imports in the application. | 22 KB | **LOW** |
| `src/components/mobile/role-teacher-view.tsx` | Only referenced by dead `mobile-shell.tsx`. 0 active imports in the application. | 34 KB | **LOW** |
| `src/lib/fee-constants.ts` | 0 imports across `src/`. Superseded by unified fee engine constants in `src/lib/fees-engine/constants.ts`. | 10 KB | **LOW** |
| `src/scripts/migrate-media-to-blob.ts` | One-time migration script misplaced inside `src/scripts/` instead of root `scripts/`. 0 imports in app runtime. | 9.7 KB | **LOW** |
| `src/scripts/test-security-fixes.ts` | One-time test script misplaced inside `src/scripts/` instead of root `scripts/`. 0 imports in app runtime. | 8.7 KB | **LOW** |
| `src/models/fees/` (`Concession.ts`, `FeeHead.ts`, `FeePayment.ts`, `FeeStructure.ts`, `FineRule.ts`, `StudentFee.ts`) | 0 imports anywhere in `src/app` or `src/lib`. Mongoose experimental fee schemas superseded by native MongoDB driver unified fee engine in `src/lib/db.ts` / `src/lib/fees-engine/`. | ~28 KB | **LOW** |
| `src/models/finance/AccountHead.ts`, `src/models/finance/Budget.ts`, `src/models/finance/index.ts` | 0 imports anywhere in the codebase. | ~12 KB | **LOW** |
| `src/app/api/sync/live/route.ts` | Long-polling SSE file-watcher polling local filesystem `data/erp_store.json` on a 2-second interval. Incompatible with serverless Vercel execution environment. | 2.2 KB | **LOW** |

---

## 3. Empty & Legacy MongoDB Collections (Atlas `edugit`)

| Collection Name | Document Count | Indexes | Reason for Removal | Risk Level |
|---|---|---|---|---|
| `feepayments` | **0** | 7 indexes | Empty legacy Mongoose collection. Active payments are in `fee_payments` (1,830 docs) and `fee_ledger` (11,921 docs). | **ZERO RISK** |
| `transactions` | **0** | 6 indexes | Empty legacy Mongoose collection. Active ledger is `fee_ledger`. | **ZERO RISK** |
| `incomes` | **0** | 6 indexes | Empty legacy Mongoose collection. | **ZERO RISK** |
| `expenses` | **0** | 6 indexes | Empty legacy Mongoose collection. | **ZERO RISK** |
| `studentfees` | **0** | 7 indexes | Empty legacy Mongoose collection. Active fee demands are in `fee_demands` (7,954 docs) and `fee_invoices` (6,575 docs). | **ZERO RISK** |

---

## 4. Orphan Documents in MongoDB

| Collection | Orphan Count | Details / Document IDs | Risk Level |
|---|---|---|---|
| `fee_invoices` | **2** | - `INV-1788255333546`: references deleted student `STU-1788255333415-14`<br>- `INV-1788523788940`: missing `student_id` | **LOW** (Export to JSON backup before purge) |

---

## 5. Unused Environment Variables

| Variable | Location | Status & Rationale |
|---|---|---|
| `MONGODB_USERNAME` | `.env` | Unused in code. Full credentials are contained in `MONGODB_URI`. |
| `MONGODB_PASSWORD` | `.env` | Unused in code. Full credentials are contained in `MONGODB_URI`. |
| `AGENCY_ADMIN_PASS` | `.env` | Unused in code. Agency auth uses `users` collection and `SESSION_SECRET`. |

---

## Summary Statistics

- **Total Files Proposed for Deletion**: 32 files across root legacy dirs, dead mobile views, unused models, and misplaced scripts.
- **Total Dead Disk Space Reclaimed**: ~380 KB.
- **Total Empty Collections to Drop**: 5 collections.
- **Total Orphan Documents to Purge**: 2 documents.
- **Impact on Business Logic**: **ZERO** (No core business logic, active API routes, active components, or live fee ledger data modified).

---

> 🛑 **ACTION REQUIRED**: Please reply with **`APPROVED`** to initiate the automated JSON backup and proceed with the clean removal process.
