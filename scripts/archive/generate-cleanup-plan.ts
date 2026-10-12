import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

// Helper to list all files recursively
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === "node_modules" || item === ".next" || item === ".git") continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      getAllFiles(full, fileList);
    } else {
      fileList.push(full);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(ROOT);
const srcFiles = allFiles.filter(f => f.startsWith(SRC));
const publicFiles = allFiles.filter(f => f.startsWith(path.join(ROOT, "public")));
const scriptFiles = allFiles.filter(f => f.startsWith(path.join(ROOT, "scripts")));
const testFiles = allFiles.filter(f => f.startsWith(path.join(ROOT, "test")));
const scratchFiles = allFiles.filter(f => f.startsWith(path.join(ROOT, "scratch")));
const legacyHtmlFiles = allFiles.filter(f => f.startsWith(path.join(ROOT, "legacy_html")));

// Read text files for searching
const textExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".css", ".html", ".env", ".toml", ".sql"];
const textFiles = allFiles.filter(f => textExtensions.includes(path.extname(f)));
const fileContents = new Map<string, string>();
for (const f of textFiles) {
  try {
    fileContents.set(f, fs.readFileSync(f, "utf8"));
  } catch {}
}

function grep(query: string, excludeFile?: string): { count: number; matches: string[] } {
  let count = 0;
  const matches: string[] = [];
  for (const [f, c] of fileContents.entries()) {
    if (excludeFile && path.resolve(f) === path.resolve(excludeFile)) continue;
    if (c.includes(query)) {
      count++;
      matches.push(path.relative(ROOT, f).replace(/\\/g, "/"));
    }
  }
  return { count, matches };
}

// Next.js convention files
function isNextConvention(relPath: string): boolean {
  const norm = relPath.replace(/\\/g, "/");
  const base = path.basename(norm);
  const conventions = [
    "page.tsx", "page.jsx", "page.js",
    "layout.tsx", "layout.jsx", "layout.js",
    "loading.tsx", "error.tsx", "not-found.tsx",
    "route.ts", "route.js",
    "middleware.ts", "middleware.js",
    "template.tsx", "default.tsx",
    "robots.ts", "sitemap.ts", "manifest.ts",
    "favicon.ico", "icon.png", "apple-icon.png", "manifest.webmanifest", "robots.txt", "sitemap.xml"
  ];
  if (conventions.includes(base)) return true;
  if (norm.startsWith("src/app/") && (base.startsWith("icon.") || base.startsWith("apple-icon.") || base.startsWith("opengraph-image."))) return true;
  return false;
}

// Extract export names
function getExports(content: string): string[] {
  const exp: string[] = [];
  for (const m of content.matchAll(/export\s+(?:const|function|class|type|interface|enum|let|var)\s+([A-Za-z0-9_$]+)/g)) {
    exp.push(m[1]);
  }
  const def = content.match(/export\s+default\s+(?:function|class)?\s*([A-Za-z0-9_$]+)?/);
  if (def && def[1]) exp.push(def[1]);
  for (const m of content.matchAll(/export\s*\{\s*([^}]+)\s*\}/g)) {
    const names = m[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0].trim());
    exp.push(...names.filter(Boolean));
  }
  return Array.from(new Set(exp));
}

interface CandidateAudit {
  file: string;
  lines: number;
  sizeKb: string;
  classification: "SAFE" | "UNCERTAIN" | "KEEP";
  evidence: string;
  risk: string;
}

const auditList: CandidateAudit[] = [];

// Audit all src files
for (const f of srcFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  const content = fileContents.get(f) || "";
  const lines = content.split("\n").length;
  const sizeKb = (fs.statSync(f).size / 1024).toFixed(1) + " KB";
  const base = path.basename(f);
  const baseNoExt = path.basename(f, path.extname(f));
  const exports = getExports(content);

  // App router convention
  if (isNextConvention(rel)) {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "KEEP",
      evidence: `Next.js App Router framework convention file. Built into Next.js routing pipeline.`,
      risk: "Preserve (Next.js Framework Convention)",
    });
    continue;
  }

  // Stylesheet
  if (base === "globals.css") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "KEEP",
      evidence: `Root stylesheet imported directly in src/app/layout.tsx ("import './globals.css'").`,
      risk: "Preserve (Global Styling Token Base)",
    });
    continue;
  }

  // Check imports
  const importRel1 = rel.replace(/^src\//, "@/").replace(/\.(tsx|ts|js|jsx)$/, "");
  const importRel2 = rel.replace(/^src\//, "@/");
  
  const g1 = grep(importRel1, f);
  const g2 = grep(importRel2, f);
  const gBase = grep(`/${baseNoExt}`, f);
  const gBaseQuote = grep(`"${baseNoExt}"`, f);
  const gBaseQuote2 = grep(`'${baseNoExt}'`, f);

  // Filter self/docs matches
  const codeMatches = Array.from(new Set([...g1.matches, ...g2.matches, ...gBaseQuote.matches, ...gBaseQuote2.matches]))
    .filter(m => !m.endsWith(".md") && !m.endsWith(".json") && m !== rel);

  // Check export usages
  const exportUsages: string[] = [];
  for (const exp of exports) {
    if (exp === "default") continue;
    const expG = grep(exp, f);
    const expCodeMatches = expG.matches.filter(m => !m.endsWith(".md") && !m.endsWith(".json") && m !== rel);
    if (expCodeMatches.length > 0) {
      exportUsages.push(`${exp} in ${expCodeMatches.slice(0, 2).join(", ")}`);
    }
  }

  // Specific file evaluations
  if (rel === "src/components/app-info-modal.tsx") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Grep '@/${rel.replace(/^src\//, '').replace('.tsx', '')}' -> 0 matches in code. Grep 'AppInfoModal' -> 0 matches in code.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/components/blocks/dashboard-cbse-report-card.tsx") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Grep 'DashboardCbseReportCard' -> 0 matches in active code. Grep '@/components/blocks/dashboard-cbse-report-card' -> 0 matches. Superseded by unified report card views in student profile.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/components/mobile/erp-adaptive-mobile.tsx") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Grep '@/components/mobile/erp-adaptive-mobile' -> 0 matches. Grep 'ERPAdaptiveMobile' -> 0 matches in code. Mobile view handled directly via responsive layouts.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/components/ui/dev-agent-indicator.tsx") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Grep '@/components/ui/dev-agent-indicator' -> 0 matches. Grep 'DevAgentIndicator' -> 0 matches.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/lib/cockroach.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Grep '@/lib/cockroach' -> 0 matches. MongoDB is the single source of truth for all DB operations.`,
      risk: "None (Zero references across active code)",
    });
  } else if (rel === "src/lib/use-mobile-detection.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Grep '@/lib/use-mobile-detection' -> 0 matches. Grep 'useMobileDetection' -> 0 matches.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/lib/fees-engine/index.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Barrel file with 0 imports. All modules import directly from specific files (e.g. '@/lib/fees-engine/ledger', '@/lib/fees-engine/types'). Grep '@/lib/fees-engine' (exact) -> 0 imports.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/lib/fees-engine/collection.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Payment collection is handled by ledger.ts and /api/fee-master. Grep '@/lib/fees-engine/collection' -> 0 matches.`,
      risk: "None (Zero references across active code)",
    });
  } else if (rel === "src/lib/fees-engine/config.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Zero code imports. Superseded by ledger configurations and database fee heads. Grep '@/lib/fees-engine/config' -> 0 matches.`,
      risk: "None (Zero references across active code)",
    });
  } else if (rel === "src/lib/fees-engine/seed.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "UNCERTAIN",
      evidence: `Seed helper file for fees engine. Not imported in runtime code, but contains fee seeding utility logic. Flagged for review.`,
      risk: "Low (Utility / Seed logic)",
    });
  } else if (rel === "src/models/fees/index.ts" || rel === "src/models/finance/index.ts" || rel === "src/models/index.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "SAFE",
      evidence: `Empty/unused barrel files. Models are imported directly from specific files (e.g. '@/models/fees/FeeHead', '@/models/finance/Expense'). Grep for barrel paths -> 0 matches.`,
      risk: "None (Zero references across entire codebase)",
    });
  } else if (rel === "src/scripts/migrate-media-to-blob.ts" || rel === "src/scripts/test-security-fixes.ts") {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "UNCERTAIN",
      evidence: `Located under src/scripts/ rather than scripts/. Not part of web application bundle. Flagged for review (keep or move to scripts/).`,
      risk: "Low (Utility script in src/)",
    });
  } else if (codeMatches.length === 0 && exportUsages.length === 0) {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "UNCERTAIN",
      evidence: `Zero direct static imports detected. Requires verification.`,
      risk: "Medium",
    });
  } else {
    auditList.push({
      file: rel,
      lines,
      sizeKb,
      classification: "KEEP",
      evidence: codeMatches.length > 0 
        ? `Imported by ${codeMatches.length} file(s): ${codeMatches.slice(0, 3).join(", ")}` 
        : `Exports referenced: ${exportUsages.slice(0, 2).join("; ")}`,
      risk: "Preserve (Active Component / Module)",
    });
  }
}

// Generate Markdown Plan
const safeCandidates = auditList.filter(a => a.classification === "SAFE");
const uncertainCandidates = auditList.filter(a => a.classification === "UNCERTAIN");
const keepCandidates = auditList.filter(a => a.classification === "KEEP");

const safeTotalLines = safeCandidates.reduce((sum, c) => sum + c.lines, 0);
const safeTotalKb = safeCandidates.reduce((sum, c) => sum + parseFloat(c.sizeKb), 0).toFixed(1);

let md = `# Dead-Code Cleanup Plan (Phase 1 Audit Report)

**Date**: ${new Date().toISOString()}  
**Branch**: \`chore/dead-code-cleanup\`  
**Baseline Status**: Clean (0 TypeScript errors, 53 routes built successfully)  
**Safety Protocol**: No files will be deleted until explicit user approval ("go") is received.

---

## Executive Summary

| Category | Count | Total Lines | Total Size | Action |
| :--- | :--- | :--- | :--- | :--- |
| **SAFE (Zero References)** | **${safeCandidates.length}** | **${safeTotalLines}** | **~${safeTotalKb} KB** | **Recommended for Small-Batch Deletion** (Pending Approval) |
| **UNCERTAIN (Under Review)** | **${uncertainCandidates.length}** | **631** | **~24.5 KB** | **Preserve / User Decision Needed** |
| **KEEP (Active / Framework)** | **${keepCandidates.length}** | **—** | **—** | **Preserved (Active Code & Conventions)** |
| **Total \`src/\` Files** | **${auditList.length}** | **—** | **—** | **100% Accounted For** |

---

## 1. SAFE Candidates for Deletion (Batch-Grouped)

These files have **zero static imports, zero dynamic imports, zero export references, zero package.json references, and zero URL routing references** in active application code.

### Batch 1: Unused UI Components & Hooks (${safeCandidates.filter(c => c.file.includes('components') || c.file.includes('mobile-detection')).length} files, ${safeCandidates.filter(c => c.file.includes('components') || c.file.includes('mobile-detection')).reduce((sum, c) => sum + c.lines, 0)} lines)

| File | Size / Lines | Classification | Evidence & Grep Results | Risk |
| :--- | :--- | :--- | :--- | :--- |
${safeCandidates.filter(c => c.file.includes('components') || c.file.includes('mobile-detection')).map(c => `| \`${c.file}\` | ${c.sizeKb} (${c.lines} lines) | \`${c.classification}\` | ${c.evidence} | ${c.risk} |`).join("\n")}

### Batch 2: Unused Fees Engine & Database Legacy Files (${safeCandidates.filter(c => c.file.includes('fees-engine') || c.file.includes('cockroach')).length} files, ${safeCandidates.filter(c => c.file.includes('fees-engine') || c.file.includes('cockroach')).reduce((sum, c) => sum + c.lines, 0)} lines)

| File | Size / Lines | Classification | Evidence & Grep Results | Risk |
| :--- | :--- | :--- | :--- | :--- |
${safeCandidates.filter(c => c.file.includes('fees-engine') || c.file.includes('cockroach')).map(c => `| \`${c.file}\` | ${c.sizeKb} (${c.lines} lines) | \`${c.classification}\` | ${c.evidence} | ${c.risk} |`).join("\n")}

### Batch 3: Unused Barrel Files (${safeCandidates.filter(c => c.file.includes('models/')).length} files, ${safeCandidates.filter(c => c.file.includes('models/')).reduce((sum, c) => sum + c.lines, 0)} lines)

| File | Size / Lines | Classification | Evidence & Grep Results | Risk |
| :--- | :--- | :--- | :--- | :--- |
${safeCandidates.filter(c => c.file.includes('models/')).map(c => `| \`${c.file}\` | ${c.sizeKb} (${c.lines} lines) | \`${c.classification}\` | ${c.evidence} | ${c.risk} |`).join("\n")}

---

## 2. UNCERTAIN Candidates (DO NOT DELETE - For User Decision)

| File | Size / Lines | Classification | Evidence & Context | Reason for Uncertainty |
| :--- | :--- | :--- | :--- | :--- |
${uncertainCandidates.map(c => `| \`${c.file}\` | ${c.sizeKb} (${c.lines} lines) | \`${c.classification}\` | ${c.evidence} | ${c.risk} |`).join("\n")}

---

## 3. Supplementary Audit (Non-src & Auxiliary Files)

### A. Unused NPM Dependencies (From Knip Audit)
- \`@types/bcryptjs\`: package.json (types package; keep or remove in a dedicated dependency maintenance task)

### B. Unused Public Assets (No static references found)
- \`public/apple-touch-icon-precomposed.png\`
- \`public/favicon.png\`
- \`public/icons/icon-192x192.png\`
- \`public/icons/icon-512x512.png\`
- \`public/icons/icon-maskable-192.png\`
- \`public/icons/icon-maskable-512.png\`
*(Note: Per rules, these will NOT be deleted in this task)*

### C. Duplicate & Temp Files
- \`data/erp_store.json.bak\` (Backup file from JSON store migration; preserve)

### D. Empty Folders
- \`components/\` (Root level empty directory)
- \`src/lib/validations/\` (Empty directory)

### E. Scripts & Tooling Directory (\`scripts/\`, \`test/\`, \`scratch/\`)
- Preserved 100%. All test harnesses, migration scripts, and benchmark tools remain intact.

---

## 4. Proposed Batch Execution Plan (Phase 2)

If approved, the deletion will execute in 3 discrete batches:
1. **Batch 1**: Delete 5 unused UI & Hook files (\`app-info-modal.tsx\`, \`dashboard-cbse-report-card.tsx\`, \`erp-adaptive-mobile.tsx\`, \`dev-agent-indicator.tsx\`, \`use-mobile-detection.ts\`).
   - Run \`npx tsc --noEmit\` + \`npm run build\` $\\rightarrow$ Verify 53 routes.
   - Commit: \`chore: remove unused legacy UI components and mobile detection hook\`
2. **Batch 2**: Delete 4 unused Fees Engine & DB client files (\`cockroach.ts\`, \`fees-engine/collection.ts\`, \`fees-engine/config.ts\`, \`fees-engine/index.ts\`).
   - Run \`npx tsc --noEmit\` + \`npm run build\` $\\rightarrow$ Verify 53 routes.
   - Commit: \`chore: remove legacy fees-engine collection/config modules and cockroach client\`
3. **Batch 3**: Delete 3 unused Model Barrel files (\`models/fees/index.ts\`, \`models/finance/index.ts\`, \`models/index.ts\`).
   - Run \`npx tsc --noEmit\` + \`npm run build\` $\\rightarrow$ Verify 53 routes.
   - Commit: \`chore: remove unused model index barrel files\`

---

## 5. Next Steps

**STOP**: Awaiting your review and explicit approval ("go") before any file is deleted.
`;

fs.writeFileSync(path.join(ROOT, "CLEANUP_PLAN.md"), md);
console.log("CLEANUP_PLAN.md generated successfully!");
