import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface CandidateResult {
  file: string;
  sizeBytes: number;
  lines: number;
  classification: "SAFE" | "UNCERTAIN" | "KEEP";
  reasons: string[];
  evidence: string;
  risk: "None (Zero references)" | "Low" | "Medium" | "High" | "Preserve (Convention / System)";
  exports: string[];
  importCount: number;
}

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const SCRIPTS_DIR = path.join(ROOT_DIR, "scripts");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === "node_modules" || item === ".next" || item === ".git") continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// 1. Collect all repo files
const allRepoFiles = getAllFiles(ROOT_DIR);
const srcFiles = allRepoFiles.filter((f) => f.startsWith(SRC_DIR));
const scriptFiles = allRepoFiles.filter((f) => f.startsWith(SCRIPTS_DIR));
const publicFiles = allRepoFiles.filter((f) => f.startsWith(PUBLIC_DIR));

// Read all repo text files into memory for grep/search
const textExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".css", ".html", ".env", ".toml"];
const repoTextFiles = allRepoFiles.filter((f) => textExtensions.includes(path.extname(f)));
const fileContentsMap = new Map<string, string>();

for (const file of repoTextFiles) {
  try {
    fileContentsMap.set(file, fs.readFileSync(file, "utf8"));
  } catch {}
}

// Helper to check references
function searchInRepo(target: string, excludeFile?: string): { count: number; matches: string[] } {
  let count = 0;
  const matches: string[] = [];
  
  for (const [file, content] of fileContentsMap.entries()) {
    if (excludeFile && path.resolve(file) === path.resolve(excludeFile)) continue;
    
    // Check if target appears in content
    if (content.includes(target)) {
      count++;
      matches.push(path.relative(ROOT_DIR, file).replace(/\\/g, "/"));
    }
  }
  return { count, matches };
}

// Extract export names from TS/TSX file
function getExportedNames(content: string): string[] {
  const exports: string[] = [];
  const exportConstMatch = content.matchAll(/export\s+(?:const|function|class|type|interface|enum|let|var)\s+([A-Za-z0-9_$]+)/g);
  for (const match of exportConstMatch) {
    exports.push(match[1]);
  }
  const exportDefaultMatch = content.match(/export\s+default\s+(?:function|class)?\s*([A-Za-z0-9_$]+)?/);
  if (exportDefaultMatch && exportDefaultMatch[1]) {
    exports.push(exportDefaultMatch[1]);
  }
  const namedExportsMatch = content.matchAll(/export\s*\{\s*([^}]+)\s*\}/g);
  for (const match of namedExportsMatch) {
    const names = match[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim());
    exports.push(...names.filter(Boolean));
  }
  return Array.from(new Set(exports));
}

// Check Next.js conventions
function isNextConventionFile(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  const base = path.basename(normalized);
  if (
    [
      "page.tsx",
      "page.jsx",
      "page.js",
      "layout.tsx",
      "layout.jsx",
      "layout.js",
      "loading.tsx",
      "error.tsx",
      "not-found.tsx",
      "route.ts",
      "route.js",
      "middleware.ts",
      "middleware.js",
      "template.tsx",
      "default.tsx",
      "robots.ts",
      "sitemap.ts",
      "manifest.ts",
    ].includes(base)
  ) {
    return true;
  }
  if (normalized.startsWith("src/app/") && (base.startsWith("icon.") || base.startsWith("apple-icon.") || base.startsWith("opengraph-image."))) {
    return true;
  }
  return false;
}

// Analyze all src files
const analysisResults: CandidateResult[] = [];

for (const file of srcFiles) {
  const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
  const content = fileContentsMap.get(file) || "";
  const lines = content.split("\n").length;
  const sizeBytes = fs.statSync(file).size;
  const ext = path.extname(file);
  const baseNameNoExt = path.basename(file, ext);
  const exports = getExportedNames(content);

  // 1. Next.js convention file check
  if (isNextConventionFile(relPath)) {
    // If it's an API route or page, check route usage
    if (relPath.includes("/api/")) {
      analysisResults.push({
        file: relPath,
        sizeBytes,
        lines,
        classification: "KEEP",
        reasons: ["Next.js App Router API Route"],
        evidence: "App Router convention: " + relPath,
        risk: "Preserve (Convention / System)",
        exports,
        importCount: 1,
      });
    } else {
      analysisResults.push({
        file: relPath,
        sizeBytes,
        lines,
        classification: "KEEP",
        reasons: ["Next.js App Router Page / Layout / Convention"],
        evidence: "App Router convention: " + relPath,
        risk: "Preserve (Convention / System)",
        exports,
        importCount: 1,
      });
    }
    continue;
  }

  // 2. Check import references across entire repo
  // Possible import paths: "@/...", relative path, basename
  const importRelPath1 = relPath.replace(/^src\//, "@/").replace(/\.(tsx|ts|js|jsx)$/, "");
  const importRelPath2 = relPath.replace(/^src\//, "@/");
  const importBase = baseNameNoExt;

  const search1 = searchInRepo(importRelPath1, file);
  const search2 = searchInRepo(importRelPath2, file);
  const searchBase = searchInRepo(`/${importBase}`, file);
  const searchDirectBase = searchInRepo(`"${importBase}"`, file);
  const searchDirectBase2 = searchInRepo(`'${importBase}'`, file);

  const directImportMatches = Array.from(new Set([...search1.matches, ...search2.matches]));
  const baseMatches = Array.from(new Set([...searchBase.matches, ...searchDirectBase.matches, ...searchDirectBase2.matches]));

  // Check export references
  let anyExportReferenced = false;
  const exportMatches: string[] = [];
  for (const exp of exports) {
    if (exp === "default") continue;
    const expSearch = searchInRepo(exp, file);
    if (expSearch.count > 0) {
      anyExportReferenced = true;
      exportMatches.push(`${exp} in [${expSearch.matches.slice(0, 3).join(", ")}]`);
    }
  }

  // Check if filename itself is mentioned in config or package.json
  const fileNameSearch = searchInRepo(path.basename(file), file);

  if (directImportMatches.length === 0 && !anyExportReferenced && fileNameSearch.count === 0) {
    // Truly zero references anywhere
    analysisResults.push({
      file: relPath,
      sizeBytes,
      lines,
      classification: "SAFE",
      reasons: ["Zero direct imports", "Zero export references in other files", "Zero filename mentions"],
      evidence: `0 references across all files. Grep for '${importRelPath1}' -> 0 matches.`,
      risk: "None (Zero references)",
      exports,
      importCount: 0,
    });
  } else if (directImportMatches.length === 0 && !anyExportReferenced && fileNameSearch.count > 0) {
    analysisResults.push({
      file: relPath,
      sizeBytes,
      lines,
      classification: "UNCERTAIN",
      reasons: [`Zero direct imports, but filename referenced in: ${fileNameSearch.matches.join(", ")}`],
      evidence: `Filename match in: ${fileNameSearch.matches.join(", ")}`,
      risk: "Low",
      exports,
      importCount: 0,
    });
  } else {
    analysisResults.push({
      file: relPath,
      sizeBytes,
      lines,
      classification: "KEEP",
      reasons: [
        directImportMatches.length > 0 ? `Imported by ${directImportMatches.length} file(s): ${directImportMatches.slice(0, 3).join(", ")}` : "",
        anyExportReferenced ? `Exports used: ${exportMatches.slice(0, 2).join("; ")}` : "",
      ].filter(Boolean),
      evidence: directImportMatches.length > 0 ? `Imported by: ${directImportMatches.join(", ")}` : `Export usage: ${exportMatches.join(", ")}`,
      risk: "Preserve (Convention / System)",
      exports,
      importCount: directImportMatches.length,
    });
  }
}

// 3. Unused Public Assets Detection
const publicAssetResults: { asset: string; referenced: boolean; matches: string[] }[] = [];
for (const pubFile of publicFiles) {
  const relPub = path.relative(ROOT_DIR, pubFile).replace(/\\/g, "/");
  const pubPath = relPub.replace(/^public\//, "/");
  const pubBase = path.basename(pubFile);
  
  const searchPub = searchInRepo(pubPath, pubFile);
  const searchBase = searchInRepo(pubBase, pubFile);
  const allMatches = Array.from(new Set([...searchPub.matches, ...searchBase.matches]));

  publicAssetResults.push({
    asset: relPub,
    referenced: allMatches.length > 0,
    matches: allMatches,
  });
}

// 4. Duplicate / Backup / Temp files
const duplicateOrTempFiles: string[] = [];
for (const f of allRepoFiles) {
  const base = path.basename(f);
  if (
    base.includes("_old") ||
    base.includes("_backup") ||
    base.includes(".bak") ||
    base.includes(" copy") ||
    base.includes("Copy") ||
    base.endsWith(".orig") ||
    base.endsWith(".swp") ||
    base.endsWith(".log") ||
    base.endsWith(".tmp")
  ) {
    duplicateOrTempFiles.push(path.relative(ROOT_DIR, f).replace(/\\/g, "/"));
  }
}

// 5. Empty Folders
function findEmptyFolders(dir: string, emptyList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return emptyList;
  const items = fs.readdirSync(dir);
  if (items.length === 0 && dir !== ROOT_DIR) {
    emptyList.push(path.relative(ROOT_DIR, dir).replace(/\\/g, "/"));
    return emptyList;
  }
  for (const item of items) {
    if (item === "node_modules" || item === ".next" || item === ".git") continue;
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findEmptyFolders(fullPath, emptyList);
    }
  }
  return emptyList;
}
const emptyFolders = findEmptyFolders(ROOT_DIR);

// Output summary
console.log("=== PHASE 1 ANALYSIS SUMMARY ===");
console.log(`Total src files evaluated: ${srcFiles.length}`);
console.log(`SAFE candidates for deletion: ${analysisResults.filter((r) => r.classification === "SAFE").length}`);
console.log(`UNCERTAIN candidates: ${analysisResults.filter((r) => r.classification === "UNCERTAIN").length}`);
console.log(`KEEP files: ${analysisResults.filter((r) => r.classification === "KEEP").length}`);
console.log(`Unused public assets: ${publicAssetResults.filter((r) => !r.referenced).length}`);
console.log(`Duplicate / Temp files: ${duplicateOrTempFiles.length}`);
console.log(`Empty folders: ${emptyFolders.length}`);

fs.writeFileSync(
  path.join(ROOT_DIR, "scripts/phase1-analysis-raw.json"),
  JSON.stringify(
    {
      analysisResults,
      publicAssetResults,
      duplicateOrTempFiles,
      emptyFolders,
      scriptFiles: scriptFiles.map((s) => path.relative(ROOT_DIR, s).replace(/\\/g, "/")),
    },
    null,
    2
  )
);
console.log("Wrote scripts/phase1-analysis-raw.json");
