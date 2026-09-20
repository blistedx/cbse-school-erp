# Cleanup Baseline Snapshot (Phase 0)

**Date**: 2026-09-20T06:46:50.294Z  
**Branch**: `chore/dead-code-cleanup`  
**TypeScript Baseline**: 0 errors (`tsc --noEmit`)  
**Production Build Baseline**: 53 routes (0 errors)  
**Total `src/` Files**: 161

---

## 1. Production Build Routes (53 Routes Total)

| Index | Route | Type |
| :--- | :--- | :--- |
| 1 | `/` | Dynamic (ƒ) |
| 2 | `/_not-found` | Static (○) |
| 3 | `/agency` | Static (○) |
| 4 | `/api/agency/approve-demo` | Dynamic (ƒ) |
| 5 | `/api/agency/purge-school` | Dynamic (ƒ) |
| 6 | `/api/app-info` | Dynamic (ƒ) |
| 7 | `/api/attendance` | Dynamic (ƒ) |
| 8 | `/api/attendance/scan` | Dynamic (ƒ) |
| 9 | `/api/audit-logs` | Dynamic (ƒ) |
| 10 | `/api/auth/forgot-passcode` | Dynamic (ƒ) |
| 11 | `/api/auth/login` | Dynamic (ƒ) |
| 12 | `/api/auth/logout` | Dynamic (ƒ) |
| 13 | `/api/auth/profile` | Dynamic (ƒ) |
| 14 | `/api/auth/session` | Dynamic (ƒ) |
| 15 | `/api/classes` | Dynamic (ƒ) |
| 16 | `/api/classes/subjects` | Dynamic (ƒ) |
| 17 | `/api/exams` | Dynamic (ƒ) |
| 18 | `/api/fee-master` | Dynamic (ƒ) |
| 19 | `/api/finance` | Dynamic (ƒ) |
| 20 | `/api/finance/reports/pl` | Dynamic (ƒ) |
| 21 | `/api/health` | Dynamic (ƒ) |
| 22 | `/api/holidays` | Dynamic (ƒ) |
| 23 | `/api/media/[id]` | Dynamic (ƒ) |
| 24 | `/api/media/upload` | Dynamic (ƒ) |
| 25 | `/api/notices` | Dynamic (ƒ) |
| 26 | `/api/notifications/broadcasts` | Dynamic (ƒ) |
| 27 | `/api/notifications/send` | Dynamic (ƒ) |
| 28 | `/api/notifications/subscribe` | Dynamic (ƒ) |
| 29 | `/api/notifications/vapid-key` | Dynamic (ƒ) |
| 30 | `/api/overview` | Dynamic (ƒ) |
| 31 | `/api/request-demo` | Dynamic (ƒ) |
| 32 | `/api/school/permissions` | Dynamic (ƒ) |
| 33 | `/api/school/settings` | Dynamic (ƒ) |
| 34 | `/api/schools` | Dynamic (ƒ) |
| 35 | `/api/students` | Dynamic (ƒ) |
| 36 | `/api/students/promote` | Dynamic (ƒ) |
| 37 | `/api/students/search` | Dynamic (ƒ) |
| 38 | `/api/sync/live` | Dynamic (ƒ) |
| 39 | `/api/sync/mongodb` | Dynamic (ƒ) |
| 40 | `/api/teachers` | Dynamic (ƒ) |
| 41 | `/api/transport/telemetry` | Dynamic (ƒ) |
| 42 | `/api/verify/id` | Dynamic (ƒ) |
| 43 | `/app` | Static (○) |
| 44 | `/apple-icon.png` | Static (○) |
| 45 | `/attendance/scan` | Static (○) |
| 46 | `/faq` | Static (○) |
| 47 | `/fees/heads` | Static (○) |
| 48 | `/icon.png` | Static (○) |
| 49 | `/login` | Static (○) |
| 50 | `/manifest.webmanifest` | Static (○) |
| 51 | `/mobile` | Static (○) |
| 52 | `/privacy` | Static (○) |
| 53 | `/request-demo` | Static (○) |
| 54 | `/robots.txt` | Static (○) |
| 55 | `/sitemap.xml` | Static (○) |
| 56 | `/terms` | Static (○) |
| 57 | `/verify/id` | Static (○) |

---

## 2. All `src/` Files Snapshot (161 Files)

| Index | File Path | Lines | Size (KB) |
| :--- | :--- | :--- | :--- |
| 1 | `src/app/(dashboard)/fees/heads/page.tsx` | 433 | 17.5 KB |
| 2 | `src/app/agency/page.tsx` | 11 | 0.2 KB |
| 3 | `src/app/api/agency/approve-demo/route.ts` | 82 | 4.2 KB |
| 4 | `src/app/api/agency/purge-school/route.ts` | 120 | 4.2 KB |
| 5 | `src/app/api/app-info/route.ts` | 14 | 0.3 KB |
| 6 | `src/app/api/attendance/route.ts` | 110 | 4.8 KB |
| 7 | `src/app/api/attendance/scan/route.ts` | 235 | 8.7 KB |
| 8 | `src/app/api/audit-logs/route.ts` | 148 | 4.5 KB |
| 9 | `src/app/api/auth/forgot-passcode/route.ts` | 265 | 9.3 KB |
| 10 | `src/app/api/auth/login/route.ts` | 68 | 2.2 KB |
| 11 | `src/app/api/auth/logout/route.ts` | 33 | 0.8 KB |
| 12 | `src/app/api/auth/profile/route.ts` | 262 | 10.4 KB |
| 13 | `src/app/api/auth/session/route.ts` | 58 | 1.8 KB |
| 14 | `src/app/api/classes/route.ts` | 96 | 3.8 KB |
| 15 | `src/app/api/classes/subjects/route.ts` | 196 | 7.4 KB |
| 16 | `src/app/api/exams/route.ts` | 156 | 6.8 KB |
| 17 | `src/app/api/fee-master/route.ts` | 290 | 11.3 KB |
| 18 | `src/app/api/finance/reports/pl/route.ts` | 170 | 6.3 KB |
| 19 | `src/app/api/finance/route.ts` | 676 | 28.4 KB |
| 20 | `src/app/api/health/route.ts` | 13 | 0.4 KB |
| 21 | `src/app/api/holidays/route.ts` | 69 | 2.9 KB |
| 22 | `src/app/api/media/upload/route.ts` | 158 | 5.2 KB |
| 23 | `src/app/api/media/[id]/route.ts` | 192 | 6.9 KB |
| 24 | `src/app/api/notices/route.ts` | 77 | 3.2 KB |
| 25 | `src/app/api/notifications/broadcasts/route.ts` | 77 | 2.0 KB |
| 26 | `src/app/api/notifications/send/route.ts` | 51 | 1.3 KB |
| 27 | `src/app/api/notifications/subscribe/route.ts` | 39 | 1.2 KB |
| 28 | `src/app/api/notifications/vapid-key/route.ts` | 12 | 0.3 KB |
| 29 | `src/app/api/overview/route.ts` | 23 | 1.0 KB |
| 30 | `src/app/api/request-demo/route.ts` | 79 | 2.8 KB |
| 31 | `src/app/api/school/permissions/route.ts` | 82 | 3.2 KB |
| 32 | `src/app/api/school/settings/route.ts` | 81 | 2.2 KB |
| 33 | `src/app/api/schools/route.ts` | 53 | 2.0 KB |
| 34 | `src/app/api/students/promote/route.ts` | 46 | 1.8 KB |
| 35 | `src/app/api/students/route.ts` | 151 | 6.1 KB |
| 36 | `src/app/api/students/search/route.ts` | 92 | 3.5 KB |
| 37 | `src/app/api/sync/live/route.ts` | 69 | 2.2 KB |
| 38 | `src/app/api/sync/mongodb/route.ts` | 162 | 5.9 KB |
| 39 | `src/app/api/teachers/route.ts` | 151 | 6.1 KB |
| 40 | `src/app/api/transport/telemetry/route.ts` | 170 | 5.1 KB |
| 41 | `src/app/api/verify/id/route.ts` | 126 | 5.0 KB |
| 42 | `src/app/app/page.tsx` | 14539 | 782.0 KB |
| 43 | `src/app/apple-icon.png` | 139 | 40.8 KB |
| 44 | `src/app/attendance/scan/page.tsx` | 746 | 31.8 KB |
| 45 | `src/app/error.tsx` | 76 | 2.9 KB |
| 46 | `src/app/faq/page.tsx` | 138 | 6.4 KB |
| 47 | `src/app/favicon.ico` | 139 | 40.8 KB |
| 48 | `src/app/globals.css` | 1311 | 34.4 KB |
| 49 | `src/app/icon.png` | 139 | 40.8 KB |
| 50 | `src/app/layout.tsx` | 119 | 4.9 KB |
| 51 | `src/app/login/layout.tsx` | 28 | 0.8 KB |
| 52 | `src/app/login/page.tsx` | 765 | 31.1 KB |
| 53 | `src/app/manifest.ts` | 80 | 2.0 KB |
| 54 | `src/app/mobile/page.tsx` | 41 | 1.3 KB |
| 55 | `src/app/not-found.tsx` | 140 | 6.3 KB |
| 56 | `src/app/page.tsx` | 440 | 25.0 KB |
| 57 | `src/app/privacy/layout.tsx` | 28 | 0.8 KB |
| 58 | `src/app/privacy/page.tsx` | 907 | 49.7 KB |
| 59 | `src/app/request-demo/layout.tsx` | 28 | 0.8 KB |
| 60 | `src/app/request-demo/page.tsx` | 267 | 9.5 KB |
| 61 | `src/app/robots.ts` | 29 | 0.5 KB |
| 62 | `src/app/sitemap.ts` | 40 | 0.9 KB |
| 63 | `src/app/terms/layout.tsx` | 28 | 0.8 KB |
| 64 | `src/app/terms/page.tsx` | 721 | 38.8 KB |
| 65 | `src/app/verify/id/page.tsx` | 310 | 13.4 KB |
| 66 | `src/components/app-info-modal.tsx` | 172 | 7.9 KB |
| 67 | `src/components/blocks/dashboard-agency.tsx` | 1112 | 52.1 KB |
| 68 | `src/components/blocks/dashboard-approvals.tsx` | 1218 | 59.8 KB |
| 69 | `src/components/blocks/dashboard-attendance.tsx` | 4543 | 247.1 KB |
| 70 | `src/components/blocks/dashboard-audit-logs.tsx` | 581 | 27.1 KB |
| 71 | `src/components/blocks/dashboard-broadcast.tsx` | 729 | 33.1 KB |
| 72 | `src/components/blocks/dashboard-cbse-report-card.tsx` | 466 | 22.8 KB |
| 73 | `src/components/blocks/dashboard-certificates.tsx` | 2210 | 126.0 KB |
| 74 | `src/components/blocks/dashboard-data-hub.tsx` | 1393 | 63.8 KB |
| 75 | `src/components/blocks/dashboard-exams.tsx` | 5838 | 312.1 KB |
| 76 | `src/components/blocks/dashboard-fee-master.tsx` | 2258 | 114.8 KB |
| 77 | `src/components/blocks/dashboard-homework.tsx` | 1462 | 67.3 KB |
| 78 | `src/components/blocks/dashboard-hostel.tsx` | 1225 | 60.2 KB |
| 79 | `src/components/blocks/dashboard-library.tsx` | 1067 | 48.1 KB |
| 80 | `src/components/blocks/dashboard-overview.tsx` | 2306 | 110.2 KB |
| 81 | `src/components/blocks/dashboard-permissions.tsx` | 1058 | 47.6 KB |
| 82 | `src/components/blocks/dashboard-reports.tsx` | 1869 | 100.9 KB |
| 83 | `src/components/blocks/dashboard-siblings.tsx` | 414 | 18.8 KB |
| 84 | `src/components/blocks/dashboard-student-portal.tsx` | 1466 | 80.4 KB |
| 85 | `src/components/blocks/dashboard-subjects.tsx` | 1023 | 51.5 KB |
| 86 | `src/components/blocks/dashboard-transport.tsx` | 4455 | 228.1 KB |
| 87 | `src/components/blocks/dashboard-visitor-gate.tsx` | 1267 | 60.0 KB |
| 88 | `src/components/broadcast-inbox-modal.tsx` | 708 | 32.6 KB |
| 89 | `src/components/institutional-report-modal.tsx` | 432 | 17.5 KB |
| 90 | `src/components/landing/clear-cta.tsx` | 165 | 8.8 KB |
| 91 | `src/components/landing/faq-section.tsx` | 387 | 16.5 KB |
| 92 | `src/components/mobile/erp-adaptive-mobile.tsx` | 68 | 2.4 KB |
| 93 | `src/components/mobile/mobile-shell.tsx` | 956 | 41.1 KB |
| 94 | `src/components/mobile/role-driver-view.tsx` | 306 | 14.7 KB |
| 95 | `src/components/mobile/role-parent-view.tsx` | 1264 | 66.0 KB |
| 96 | `src/components/mobile/role-principal-view.tsx` | 446 | 21.2 KB |
| 97 | `src/components/mobile/role-teacher-view.tsx` | 691 | 33.1 KB |
| 98 | `src/components/omni-search-modal.tsx` | 453 | 18.7 KB |
| 99 | `src/components/pwa-provider.tsx` | 414 | 18.0 KB |
| 100 | `src/components/student-attendance-history.tsx` | 629 | 24.3 KB |
| 101 | `src/components/student-summary-modal.tsx` | 1236 | 66.5 KB |
| 102 | `src/components/task-completion-overlay.tsx` | 243 | 8.5 KB |
| 103 | `src/components/ui/cookie-consent.tsx` | 235 | 10.0 KB |
| 104 | `src/components/ui/cookie-preferences-button.tsx` | 27 | 0.7 KB |
| 105 | `src/components/ui/dev-agent-indicator.tsx` | 251 | 10.7 KB |
| 106 | `src/components/ui/thinking-orbs.tsx` | 220 | 6.8 KB |
| 107 | `src/lib/analytics.ts` | 38 | 1.1 KB |
| 108 | `src/lib/api-client.ts` | 129 | 4.3 KB |
| 109 | `src/lib/app-info.ts` | 31 | 0.9 KB |
| 110 | `src/lib/audit-logger.ts` | 280 | 8.9 KB |
| 111 | `src/lib/auth-guard.ts` | 272 | 9.3 KB |
| 112 | `src/lib/auth.ts` | 56 | 1.4 KB |
| 113 | `src/lib/cbse-subjects.ts` | 189 | 11.6 KB |
| 114 | `src/lib/client-audit.ts` | 113 | 2.9 KB |
| 115 | `src/lib/cockroach.ts` | 56 | 2.2 KB |
| 116 | `src/lib/db.ts` | 3087 | 124.0 KB |
| 117 | `src/lib/email.ts` | 303 | 15.9 KB |
| 118 | `src/lib/fee-constants.ts` | 300 | 9.6 KB |
| 119 | `src/lib/fees-engine/collection.ts` | 334 | 9.6 KB |
| 120 | `src/lib/fees-engine/config.ts` | 131 | 4.1 KB |
| 121 | `src/lib/fees-engine/constants.ts` | 394 | 12.6 KB |
| 122 | `src/lib/fees-engine/export.ts` | 156 | 4.4 KB |
| 123 | `src/lib/fees-engine/index.ts` | 14 | 0.3 KB |
| 124 | `src/lib/fees-engine/ledger.ts` | 869 | 26.9 KB |
| 125 | `src/lib/fees-engine/mapper.ts` | 488 | 16.3 KB |
| 126 | `src/lib/fees-engine/rates.ts` | 156 | 4.9 KB |
| 127 | `src/lib/fees-engine/report-configs.ts` | 366 | 17.4 KB |
| 128 | `src/lib/fees-engine/reports.ts` | 535 | 18.0 KB |
| 129 | `src/lib/fees-engine/seed.ts` | 150 | 5.2 KB |
| 130 | `src/lib/fees-engine/types.ts` | 341 | 7.7 KB |
| 131 | `src/lib/image-compress.ts` | 53 | 1.8 KB |
| 132 | `src/lib/json-ld.ts` | 165 | 6.7 KB |
| 133 | `src/lib/media.ts` | 373 | 11.6 KB |
| 134 | `src/lib/mongodb.ts` | 126 | 4.2 KB |
| 135 | `src/lib/mongoose.ts` | 58 | 1.5 KB |
| 136 | `src/lib/push-notifications.ts` | 237 | 8.0 KB |
| 137 | `src/lib/rate-limiter.ts` | 83 | 2.4 KB |
| 138 | `src/lib/student-helper.ts` | 352 | 13.0 KB |
| 139 | `src/lib/themes.ts` | 112 | 4.0 KB |
| 140 | `src/lib/types.ts` | 1373 | 50.7 KB |
| 141 | `src/lib/use-mobile-detection.ts` | 30 | 0.8 KB |
| 142 | `src/lib/utils.ts` | 200 | 6.2 KB |
| 143 | `src/lib/validation-schemas.ts` | 290 | 11.9 KB |
| 144 | `src/lib/web-push.ts` | 316 | 9.0 KB |
| 145 | `src/lib/whatsapp.ts` | 115 | 4.4 KB |
| 146 | `src/models/fees/Concession.ts` | 51 | 1.7 KB |
| 147 | `src/models/fees/FeeHead.ts` | 37 | 1.2 KB |
| 148 | `src/models/fees/FeePayment.ts` | 88 | 2.5 KB |
| 149 | `src/models/fees/FeeStructure.ts` | 45 | 1.6 KB |
| 150 | `src/models/fees/FineRule.ts` | 39 | 1.4 KB |
| 151 | `src/models/fees/index.ts` | 18 | 0.5 KB |
| 152 | `src/models/fees/StudentFee.ts` | 104 | 3.1 KB |
| 153 | `src/models/finance/AccountHead.ts` | 37 | 1.2 KB |
| 154 | `src/models/finance/Budget.ts` | 49 | 1.7 KB |
| 155 | `src/models/finance/Expense.ts` | 59 | 2.0 KB |
| 156 | `src/models/finance/Income.ts` | 51 | 1.8 KB |
| 157 | `src/models/finance/index.ts` | 15 | 0.4 KB |
| 158 | `src/models/finance/Transaction.ts` | 42 | 1.5 KB |
| 159 | `src/models/index.ts` | 3 | 0.0 KB |
| 160 | `src/scripts/migrate-media-to-blob.ts` | 259 | 9.5 KB |
| 161 | `src/scripts/test-security-fixes.ts` | 222 | 8.5 KB |
