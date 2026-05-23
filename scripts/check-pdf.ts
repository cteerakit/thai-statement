import { readFileSync } from "node:fs";
import { parseStatement } from "../src/lib/parse";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: npx tsx scripts/check-pdf.ts <path-to-pdf> [bank]");
  process.exit(1);
}

const bank = (process.argv[3] ?? "ktb") as "auto" | "scb" | "kbank" | "ktb";
const buffer = readFileSync(pdfPath);

async function main() {
const result = await parseStatement(buffer, bank);

console.log("--- meta ---");
console.log(JSON.stringify(result.metadata, null, 2));
console.log("--- warnings ---");
console.log(result.warnings);
console.log(`--- rows (${result.rows.length}) ---`);
for (const row of result.rows.slice(0, 15)) {
  console.log(
    [
      row.date,
      row.description.slice(0, 40),
      `W:${row.debit ?? "-"}`,
      `D:${row.credit ?? "-"}`,
      `Bal:${row.balance ?? "-"}`,
    ].join(" | "),
  );
}
if (result.rows.length > 15) {
  console.log(`... and ${result.rows.length - 15} more`);
}

const bad = result.rows.filter(
  (r) =>
    r.debit !== null &&
    r.credit !== null &&
    r.debit > 0 &&
    r.credit > 0,
);
if (bad.length) {
  console.log(`\nWARN: ${bad.length} rows with both withdrawal and deposit set`);
}
const creditLooksLikeBalance = result.rows.filter(
  (r) =>
    r.credit !== null &&
    r.balance !== null &&
    r.credit === r.balance &&
    r.debit === null,
);
if (creditLooksLikeBalance.length) {
  console.log(
    `\nWARN: ${creditLooksLikeBalance.length} rows where deposit equals balance`,
  );
}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
