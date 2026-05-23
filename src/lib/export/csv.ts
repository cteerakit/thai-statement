import { sanitizeSpreadsheetCell } from "@/lib/export/sanitize-cell";
import type { StatementRow } from "@/lib/parse/types";

const HEADERS = [
  "Date",
  "Description",
  "Debit",
  "Credit",
  "Balance",
  "Reference",
] as const;

function escapeCsv(value: string): string {
  const safe = sanitizeSpreadsheetCell(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function formatAmount(n: number | null): string {
  if (n === null) return "";
  return n.toFixed(2);
}

export function rowsToCsv(rows: StatementRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        escapeCsv(row.description),
        formatAmount(row.debit),
        formatAmount(row.credit),
        formatAmount(row.balance),
        row.reference ? escapeCsv(row.reference) : "",
      ].join(","),
    );
  }
  return lines.join("\r\n");
}

export function csvBlob(rows: StatementRow[]): Blob {
  const bom = "\uFEFF";
  return new Blob([bom + rowsToCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
}
