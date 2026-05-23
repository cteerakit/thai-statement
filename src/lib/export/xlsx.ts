import ExcelJS from "exceljs";
import { PRODUCT_NAME } from "@/i18n/brand";
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

const COLUMN_WIDTHS: Partial<Record<OutputColumnKey, number>> = {
  date: 12,
  description: 40,
  withdrawal: 14,
  deposit: 14,
  amount: 14,
  balance: 14,
  reference: 18,
};

const AMOUNT_COLUMNS = new Set<OutputColumnKey>([
  "withdrawal",
  "deposit",
  "amount",
  "balance",
]);

function sanitizeCell(
  key: OutputColumnKey,
  value: string | number | null,
): string | number {
  if (value === null) return "";
  if (typeof value === "number") return value;
  if (key === "description" || key === "reference") {
    return sanitizeSpreadsheetCell(value);
  }
  return value;
}

export async function rowsToXlsxBuffer(
  rows: StatementRow[],
  preset: string = DEFAULT_OUTPUT_TABLE_PRESET,
  labels: OutputColumnLabels = DEFAULT_LABELS,
): Promise<Buffer> {
  const columns = EXPORT_COLUMNS[normalizeOutputTablePreset(preset)];
  const { headers, rows: projected } = projectOutputTable(
    rows,
    columns,
    labels,
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = PRODUCT_NAME;
  const sheet = workbook.addWorksheet("Transactions");

  sheet.columns = columns.map((key, i) => ({
    header: headers[i],
    key,
    width: COLUMN_WIDTHS[key] ?? 14,
  }));

  sheet.getRow(1).font = { bold: true };

  for (const row of projected) {
    const record: Record<string, string | number> = {};
    columns.forEach((key, i) => {
      record[key] = sanitizeCell(key, row[i]);
    });
    sheet.addRow(record);
  }

  for (const key of columns) {
    if (AMOUNT_COLUMNS.has(key)) {
      sheet.getColumn(key).numFmt = "#,##0.00";
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
