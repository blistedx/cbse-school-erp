import fs from "fs";
import { execSync } from "child_process";

function sh(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (e: any) {
    return e.stdout ? e.stdout.toString().trim() : "(no matches / error)";
  }
}

console.log("================================================================================");
console.log("1. GREP FOR RELATIVE IMPORTS & EXPORTED FUNCTIONS: collection.ts & config.ts");
console.log("================================================================================");
console.log("--- Imports of collection ---");
console.log(sh("git grep -n \"collection\" -- \"*.ts\" \"*.tsx\" \"*.js\" \"*.json\""));

console.log("\n--- Imports of config ---");
console.log(sh("git grep -n \"fees-engine/config\" -- \"*.ts\" \"*.tsx\" \"*.js\""));
console.log(sh("git grep -n \"\\./config\" -- \"src/lib/fees-engine/*\""));

console.log("\n--- collection.ts Exports Search ---");
const collContent = fs.readFileSync("src/lib/fees-engine/collection.ts", "utf8");
const collExports = Array.from(collContent.matchAll(/export\s+(?:const|function|class|type|interface|enum|let|var)\s+([A-Za-z0-9_$]+)/g)).map(m => m[1]);
console.log("Exports in collection.ts:", collExports);
for (const exp of collExports) {
  console.log(`\n> Grep for export: ${exp}`);
  console.log(sh(`git grep -n "${exp}"`));
}

console.log("\n--- config.ts Exports Search ---");
const cfgContent = fs.readFileSync("src/lib/fees-engine/config.ts", "utf8");
const cfgExports = Array.from(cfgContent.matchAll(/export\s+(?:const|function|class|type|interface|enum|let|var)\s+([A-Za-z0-9_$]+)/g)).map(m => m[1]);
console.log("Exports in config.ts:", cfgExports);
for (const exp of cfgExports) {
  console.log(`\n> Grep for export: ${exp}`);
  console.log(sh(`git grep -n "${exp}"`));
}

console.log("\n================================================================================");
console.log("2. WHERE ARE collect_payment, cancel_receipt, AND receipt listing IMPLEMENTED NOW?");
console.log("================================================================================");
console.log(sh("git grep -n \"collectPayment\" src/"));
console.log(sh("git grep -n \"cancelReceipt\" src/"));
console.log(sh("git grep -n \"getStudentReceipts\" src/"));
console.log(sh("git grep -n \"getSchoolReceipts\" src/"));
console.log("\n--- Route implementations in src/app/api/fee-master/route.ts ---");
console.log(sh("git grep -n -C 5 \"action === 'collect_payment'\" src/app/api/fee-master/route.ts"));
console.log(sh("git grep -n -C 5 \"action === 'cancel_receipt'\" src/app/api/fee-master/route.ts"));
console.log(sh("git grep -n -C 5 \"action === 'receipts'\" src/app/api/fee-master/route.ts"));

console.log("\n--- Git Log for ledger migration ---");
console.log(sh("git log -n 5 --oneline -- src/app/api/fee-master/route.ts src/lib/fees-engine/ledger.ts"));

console.log("\n================================================================================");
console.log("3. COCKROACH DB REFERENCES AUDIT");
console.log("================================================================================");
console.log("--- Grep for COCKROACH ---");
console.log(sh("git grep -n -i \"cockroach\""));

console.log("--- Grep for pg / postgres in src/ and package.json ---");
console.log(sh("git grep -n \"from 'pg'\" src/"));
console.log(sh("git grep -n 'from \"pg\"' src/"));
console.log(sh("git grep -n \"pg\" package.json"));

console.log("--- Grep for DATABASE_URL ---");
console.log(sh("git grep -n \"DATABASE_URL\""));

console.log("\n================================================================================");
console.log("4. CBSE REPORT CARD COMPONENT VERIFICATION");
console.log("================================================================================");
console.log("--- Where is report card rendered now? ---");
console.log(sh("git grep -n -i \"reportcard\\|report-card\\|cbse.*report\" src/app src/components"));

