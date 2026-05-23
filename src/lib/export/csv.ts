import {
  DEFAULT_OUTPUT_TABLE_PRESET,
  EXPORT_COLUMNS,
  normalizeOutputTablePreset,
  type OutputColumnKey,
  type OutputColumnLabels,
  projectOutputTable,
} from "@/lib/export/output-preset";
import { sanitizeSpreadsheetCell } from "@/lib/export/sanitize-cell";
import type { StatementRow } from "@/lib/parse/types";

const DEFAULT_LABELS: OutputColumnLabels = {
  date: "Date",
  description: "Description",
  withdrawal: "Withdrawal",
  deposit: "Deposit",
  amount: "Amount",
  balance: "Balance",
  reference: "Reference",
};

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

function formatCell(
  key: OutputColumnKey,
  value: string | number | null,
): string {
  if (value === null) return "";
  if (typeof value === "number") return formatAmount(value);
  if (key === "description" || key === "reference") {
    return escapeCsv(value);
  }
  return value;
}

export function rowsToCsv(
  rows: StatementRow[],
  preset: string = DEFAULT_OUTPUT_TABLE_PRESET,
  labels: OutputColumnLabels = DEFAULT_LABELS,
): string {
  const columns = EXPORT_COLUMNS[normalizeOutputTablePreset(preset)];
  const { headers, rows: projected } = projectOutputTable(
    rows,
    columns,
    labels,
  );
  const lines = [headers.join(",")];
  for (const row of projected) {
    lines.push(
      row.map((value, i) => formatCell(columns[i], value)).join(","),
    );
  }
  return lines.join("\r\n");
}

export function csvBlob(rows: StatementRow[], preset?: string): Blob {
  const bom = "\uFEFF";
  return new Blob([bom + rowsToCsv(rows, preset)], {
    type: "text/csv;charset=utf-8",
  });
}
