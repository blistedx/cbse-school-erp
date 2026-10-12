import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Let's inspect root directories and all candidate files
const rootEntries = fs.readdirSync(ROOT).filter(f => !f.startsWith(".") && f !== "node_modules");

const report: any = {
  rootStructure: {},
  candidateDeepDive: [],
  rootFilesAudit: [],
};

for (const entry of rootEntries) {
  const full = path.join(ROOT, entry);
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const children = fs.readdirSync(full);
    report.rootStructure[entry] = {
      isDir: true,
      count: children.length,
      sample: children.slice(0, 10),
    };
  } else {
    report.rootStructure[entry] = {
      isDir: false,
      sizeBytes: stat.size,
    };
  }
}

// Deep dive on specific candidates in src and outside
const candidates = [
  "src/components/app-info-modal.tsx",
  "src/components/blocks/dashboard-cbse-report-card.tsx",
  "src/components/mobile/erp-adaptive-mobile.tsx",
  "src/components/ui/dev-agent-indicator.tsx",
  "src/lib/cockroach.ts",
  "src/lib/fees-engine/collection.ts",
  "src/lib/fees-engine/config.ts",
  "src/lib/fees-engine/index.ts",
  "src/lib/fees-engine/seed.ts",
  "src/lib/use-mobile-detection.ts",
  "src/models/fees/index.ts",
  "src/models/finance/index.ts",
  "src/models/index.ts",
  "src/scripts/migrate-media-to-blob.ts",
  "src/scripts/test-security-fixes.ts",
  "lib/db.js",
  "server.js",
  "test/test_online_db.js",
  "test/test-fee-ledger.ts",
  "test/test-fees-engine-comprehensive.ts",
];

// Read all repo files into memory
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

const allFiles = getAllFiles(ROOT);
const textFiles = allFiles.filter(f => [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".css", ".html"].includes(path.extname(f)));
const fileContents = new Map<string, string>();
for (const f of textFiles) {
  try {
    fileContents.set(f, fs.readFileSync(f, "utf8"));
  } catch {}
}

function grepRepo(query: string, excludePath?: string): { count: number; matches: string[] } {
  let count = 0;
  const matches: string[] = [];
  for (const [file, content] of fileContents.entries()) {
    if (excludePath && path.resolve(file) === path.resolve(excludePath)) continue;
    if (content.includes(query)) {
      count++;
      matches.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    }
  }
  return { count, matches };
}

for (const cand of candidates) {
  const full = path.join(ROOT, cand);
  if (!fs.existsSync(full)) {
    report.candidateDeepDive.push({ file: cand, exists: false });
    continue;
  }
  const content = fs.readFileSync(full, "utf8");
  const stat = fs.statSync(full);
  const baseName = path.basename(cand);
  const baseNoExt = path.basename(cand, path.extname(cand));

  // Grep for baseName, baseNoExt, relative import path
  const relImport = cand.replace(/^src\//, "@/").replace(/\.(tsx|ts|js|jsx)$/, "");
  const grepImport = grepRepo(relImport, full);
  const grepBaseName = grepRepo(baseName, full);
  const grepBaseNoExt = grepRepo(baseNoExt, full);

  // Extract exports
  const exportConstMatch = Array.from(content.matchAll(/export\s+(?:const|function|class|type|interface|enum|let|var)\s+([A-Za-z0-9_$]+)/g)).map(m => m[1]);
  const exportDefault = content.includes("export default");
  const exportSummary: any = {};
  for (const exp of exportConstMatch) {
    const expGrep = grepRepo(exp, full);
    exportSummary[exp] = { count: expGrep.count, matches: expGrep.matches.slice(0, 5) };
  }

  report.candidateDeepDive.push({
    file: cand,
    exists: true,
    sizeBytes: stat.size,
    lines: content.split("\n").length,
    importPathGrep: { count: grepImport.count, matches: grepImport.matches },
    fileNameGrep: { count: grepBaseName.count, matches: grepBaseName.matches },
    baseNoExtGrep: { count: grepBaseNoExt.count, matches: grepBaseNoExt.matches },
    exportDefault,
    exports: exportSummary,
  });
}

fs.writeFileSync(path.join(ROOT, "scripts/deep-audit-report.json"), JSON.stringify(report, null, 2));
console.log("Deep audit written to scripts/deep-audit-report.json");
