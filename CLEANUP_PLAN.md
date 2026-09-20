# Dead-Code Cleanup Plan (Phase 1 Audit Report)

**Date**: 2026-09-20T06:50:08.932Z  
**Branch**: `chore/dead-code-cleanup`  
**Baseline Status**: Clean (0 TypeScript errors, 53 routes built successfully)  
**Safety Protocol**: No files will be deleted until explicit user approval ("go") is received.

---

## Executive Summary

| Category | Count | Total Lines | Total Size | Action |
| :--- | :--- | :--- | :--- | :--- |
| **SAFE (Zero References)** | **12** | **1558** | **~61.7 KB** | **Recommended for Small-Batch Deletion** (Pending Approval) |
| **UNCERTAIN (Under Review)** | **3** | **631** | **~24.5 KB** | **Preserve / User Decision Needed** |
| **KEEP (Active / Framework)** | **146** | **—** | **—** | **Preserved (Active Code & Conventions)** |
| **Total `src/` Files** | **161** | **—** | **—** | **100% Accounted For** |

---

## 1. SAFE Candidates for Deletion (Batch-Grouped)

These files have **zero static imports, zero dynamic imports, zero export references, zero package.json references, and zero URL routing references** in active application code.

### Batch 1: Unused UI Components & Hooks (5 files, 987 lines)

| File | Size / Lines | Classification | Evidence & Grep Results | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/app-info-modal.tsx` | 7.9 KB (172 lines) | `SAFE` | Zero code imports. Grep '@/components/app-info-modal' -> 0 matches in code. Grep 'AppInfoModal' -> 0 matches in code. | None (Zero references across entire codebase) |
| `src/components/blocks/dashboard-cbse-report-card.tsx` | 22.8 KB (466 lines) | `SAFE` | Zero code imports. Grep 'DashboardCbseReportCard' -> 0 matches in active code. Grep '@/components/blocks/dashboard-cbse-report-card' -> 0 matches. Superseded by unified report card views in student profile. | None (Zero references across entire codebase) |
| `src/components/mobile/erp-adaptive-mobile.tsx` | 2.4 KB (68 lines) | `SAFE` | Zero code imports. Grep '@/components/mobile/erp-adaptive-mobile' -> 0 matches. Grep 'ERPAdaptiveMobile' -> 0 matches in code. Mobile view handled directly via responsive layouts. | None (Zero references across entire codebase) |
| `src/components/ui/dev-agent-indicator.tsx` | 10.7 KB (251 lines) | `SAFE` | Zero code imports. Grep '@/components/ui/dev-agent-indicator' -> 0 matches. Grep 'DevAgentIndicator' -> 0 matches. | None (Zero references across entire codebase) |
| `src/lib/use-mobile-detection.ts` | 0.8 KB (30 lines) | `SAFE` | Zero code imports. Grep '@/lib/use-mobile-detection' -> 0 matches. Grep 'useMobileDetection' -> 0 matches. | None (Zero references across entire codebase) |

### Batch 2: Unused Fees Engine & Database Legacy Files (4 files, 535 lines)

| File | Size / Lines | Classification | Evidence & Grep Results | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/cockroach.ts` | 2.2 KB (56 lines) | `SAFE` | Zero code imports. Grep '@/lib/cockroach' -> 0 matches. MongoDB is the single source of truth for all DB operations. | None (Zero references across active code) |
| `src/lib/fees-engine/collection.ts` | 9.6 KB (334 lines) | `SAFE` | Zero code imports. Payment collection is handled by ledger.ts and /api/fee-master. Grep '@/lib/fees-engine/collection' -> 0 matches. | None (Zero references across active code) |
| `src/lib/fees-engine/config.ts` | 4.1 KB (131 lines) | `SAFE` | Zero code imports. Superseded by ledger configurations and database fee heads. Grep '@/lib/fees-engine/config' -> 0 matches. | None (Zero references across active code) |
| `src/lib/fees-engine/index.ts` | 0.3 KB (14 lines) | `SAFE` | Barrel file with 0 imports. All modules import directly from specific files (e.g. '@/lib/fees-engine/ledger', '@/lib/fees-engine/types'). Grep '@/lib/fees-engine' (exact) -> 0 imports. | None (Zero references across entire codebase) |

### Batch 3: Unused Barrel Files (3 files, 36 lines)

| File | Size / Lines | Classification | Evidence & Grep Results | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `src/models/fees/index.ts` | 0.5 KB (18 lines) | `SAFE` | Empty/unused barrel files. Models are imported directly from specific files (e.g. '@/models/fees/FeeHead', '@/models/finance/Expense'). Grep for barrel paths -> 0 matches. | None (Zero references across entire codebase) |
| `src/models/finance/index.ts` | 0.4 KB (15 lines) | `SAFE` | Empty/unused barrel files. Models are imported directly from specific files (e.g. '@/models/fees/FeeHead', '@/models/finance/Expense'). Grep for barrel paths -> 0 matches. | None (Zero references across entire codebase) |
| `src/models/index.ts` | 0.0 KB (3 lines) | `SAFE` | Empty/unused barrel files. Models are imported directly from specific files (e.g. '@/models/fees/FeeHead', '@/models/finance/Expense'). Grep for barrel paths -> 0 matches. | None (Zero references across entire codebase) |

---

## 2. UNCERTAIN Candidates (DO NOT DELETE - For User Decision)

| File | Size / Lines | Classification | Evidence & Context | Reason for Uncertainty |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/fees-engine/seed.ts` | 5.2 KB (150 lines) | `UNCERTAIN` | Seed helper file for fees engine. Not imported in runtime code, but contains fee seeding utility logic. Flagged for review. | Low (Utility / Seed logic) |
| `src/scripts/migrate-media-to-blob.ts` | 9.5 KB (259 lines) | `UNCERTAIN` | Located under src/scripts/ rather than scripts/. Not part of web application bundle. Flagged for review (keep or move to scripts/). | Low (Utility script in src/) |
| `src/scripts/test-security-fixes.ts` | 8.5 KB (222 lines) | `UNCERTAIN` | Located under src/scripts/ rather than scripts/. Not part of web application bundle. Flagged for review (keep or move to scripts/). | Low (Utility script in src/) |

---

## 3. Supplementary Audit (Non-src & Auxiliary Files)

### A. Unused NPM Dependencies (From Knip Audit)
- `@types/bcryptjs`: package.json (types package; keep or remove in a dedicated dependency maintenance task)

### B. Unused Public Assets (No static references found)
- `public/apple-touch-icon-precomposed.png`
- `public/favicon.png`
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`
- `public/icons/icon-maskable-192.png`
- `public/icons/icon-maskable-512.png`
*(Note: Per rules, these will NOT be deleted in this task)*

### C. Duplicate & Temp Files
- `data/erp_store.json.bak` (Backup file from JSON store migration; preserve)

### D. Empty Folders
- `components/` (Root level empty directory)
- `src/lib/validations/` (Empty directory)

### E. Scripts & Tooling Directory (`scripts/`, `test/`, `scratch/`)
- Preserved 100%. All test harnesses, migration scripts, and benchmark tools remain intact.

---

## 4. Proposed Batch Execution Plan (Phase 2)

If approved, the deletion will execute in 3 discrete batches:
1. **Batch 1**: Delete 5 unused UI & Hook files (`app-info-modal.tsx`, `dashboard-cbse-report-card.tsx`, `erp-adaptive-mobile.tsx`, `dev-agent-indicator.tsx`, `use-mobile-detection.ts`).
   - Run `npx tsc --noEmit` + `npm run build` $\rightarrow$ Verify 53 routes.
   - Commit: `chore: remove unused legacy UI components and mobile detection hook`
2. **Batch 2**: Delete 4 unused Fees Engine & DB client files (`cockroach.ts`, `fees-engine/collection.ts`, `fees-engine/config.ts`, `fees-engine/index.ts`).
   - Run `npx tsc --noEmit` + `npm run build` $\rightarrow$ Verify 53 routes.
   - Commit: `chore: remove legacy fees-engine collection/config modules and cockroach client`
3. **Batch 3**: Delete 3 unused Model Barrel files (`models/fees/index.ts`, `models/finance/index.ts`, `models/index.ts`).
   - Run `npx tsc --noEmit` + `npm run build` $\rightarrow$ Verify 53 routes.
   - Commit: `chore: remove unused model index barrel files`

---

## 5. Next Steps

**STOP**: Awaiting your review and explicit approval ("go") before any file is deleted.
