import ExcelJS from "exceljs";
import { PRODUCT_NAME } from "@/i18n/brand";
import { sanitizeSpreadsheetCell } from "@/lib/export/sanitize-cell";
import type { StatementRow } from "@/lib/parse/types";

export async function rowsToXlsxBuffer(
  rows: StatementRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = PRODUCT_NAME;
  const sheet = workbook.addWorksheet("Transactions");

  sheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Description", key: "description", width: 40 },
    { header: "Debit", key: "debit", width: 14 },
    { header: "Credit", key: "credit", width: 14 },
    { header: "Balance", key: "balance", width: 14 },
    { header: "Reference", key: "reference", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      date: row.date,
      description: sanitizeSpreadsheetCell(row.description),
      debit: row.debit ?? "",
      credit: row.credit ?? "",
      balance: row.balance ?? "",
      reference: row.reference
        ? sanitizeSpreadsheetCell(row.reference)
        : "",
    });
  }

  ["debit", "credit", "balance"].forEach((key) => {
    sheet.getColumn(key).numFmt = "#,##0.00";
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
