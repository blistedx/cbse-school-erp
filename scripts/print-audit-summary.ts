import fs from "fs";
import path from "path";

const data = JSON.parse(fs.readFileSync("./scripts/phase1-analysis-raw.json", "utf8"));
const nonKeep = data.analysisResults.filter((r: any) => r.classification !== 'KEEP');

console.log("=== NON-KEEP FILES IN SRC (" + nonKeep.length + ") ===");
for (const item of nonKeep) {
  console.log(`- File: ${item.file} | Lines: ${item.lines} | Class: ${item.classification}`);
  console.log(`  Reasons: ${item.reasons.join("; ")}`);
  console.log(`  Evidence: ${item.evidence}`);
}

console.log("\n=== UNREFERENCED PUBLIC ASSETS ===");
for (const item of data.publicAssetResults.filter((r: any) => !r.referenced)) {
  console.log(`- Asset: ${item.asset}`);
}

console.log("\n=== DUPLICATE / TEMP FILES ===");
for (const item of data.duplicateOrTempFiles) {
  console.log(`- Temp/Dup: ${item}`);
}

console.log("\n=== EMPTY FOLDERS ===");
for (const item of data.emptyFolders) {
  console.log(`- Empty dir: ${item}`);
}
