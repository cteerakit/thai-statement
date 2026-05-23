const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Prevent CSV/XLSX formula injection when opened in Excel. */
export function sanitizeSpreadsheetCell(value: string): string {
  if (FORMULA_PREFIX.test(value)) {
    return `'${value}`;
  }
  return value;
}
