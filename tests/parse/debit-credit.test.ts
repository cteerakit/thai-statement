import { describe, expect, it } from "vitest";
import { parseBankTable } from "@/lib/parse/banks/table-parser";
import type { TextItem } from "@/lib/parse/types";

function makeItems(lines: { page: number; y: number; parts: string[] }[]): TextItem[] {
  const items: TextItem[] = [];
  for (const line of lines) {
    line.parts.forEach((str, i) => {
      items.push({ str, x: 50 + i * 100, y: line.y, page: line.page });
    });
  }
  return items;
}

function expectExclusiveDebitCredit(
  row: { debit: number | null; credit: number | null },
) {
  const hasDebit = row.debit !== null && row.debit > 0;
  const hasCredit = row.credit !== null && row.credit > 0;
  expect(hasDebit && hasCredit).toBe(false);
  if (hasDebit && hasCredit) {
    throw new Error(
      `Both debit (${row.debit}) and credit (${row.credit}) are set`,
    );
  }
}

describe("debit/credit exclusivity", () => {
  it("withdrawal: debit only, not both columns", () => {
    const items = makeItems([
      { page: 1, y: 600, parts: ["Date", "Description", "Debit", "Credit", "Balance"] },
      {
        page: 1,
        y: 500,
        parts: ["16/01/2567", "ATM Withdrawal", "500.00", "", "149,500.00"],
      },
    ]);
    const result = parseBankTable(items, "kbank");
    expect(result.rows).toHaveLength(1);
    expectExclusiveDebitCredit(result.rows[0]);
    expect(result.rows[0].debit).toBe(500);
    expect(result.rows[0].credit).toBeNull();
    expect(result.rows[0].balance).toBe(149500);
  });

  it("deposit: credit only, not both columns", () => {
    const items = makeItems([
      { page: 1, y: 600, parts: ["Date", "Description", "Debit", "Credit", "Balance"] },
      {
        page: 1,
        y: 500,
        parts: ["15/01/2567", "Salary", "", "50,000.00", "150,000.00"],
      },
    ]);
    const result = parseBankTable(items, "kbank");
    expect(result.rows).toHaveLength(1);
    expectExclusiveDebitCredit(result.rows[0]);
    expect(result.rows[0].debit).toBeNull();
    expect(result.rows[0].credit).toBe(50000);
    expect(result.rows[0].balance).toBe(150000);
  });

  it("legacy two-amount row: credit for deposit, not debit", () => {
    const items = makeItems([
      { page: 1, y: 600, parts: ["Date", "Description", "Debit", "Credit", "Balance"] },
      { page: 1, y: 500, parts: ["15/01/2567", "Salary", "50,000.00", "150,000.00"] },
    ]);
    const result = parseBankTable(items, "kbank");
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    const row = result.rows[0];
    expectExclusiveDebitCredit(row);
    expect(row.credit).toBe(50000);
    expect(row.debit).toBeNull();
  });
});
