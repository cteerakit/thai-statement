import { describe, expect, it } from "vitest";
import { parseBankTable } from "@/lib/parse/banks/table-parser";
import type { TextItem } from "@/lib/parse/types";

function makeItems(lines: { page: number; y: number; parts: string[] }[]): TextItem[] {
  const items: TextItem[] = [];
  for (const line of lines) {
    line.parts.forEach((str, i) => {
      items.push({ str, x: 50 + i * 80, y: line.y, page: line.page });
    });
  }
  return items;
}

describe("parseBankTable", () => {
  it("parses synthetic transaction rows", () => {
    const items = makeItems([
      { page: 1, y: 700, parts: ["KASIKORNBANK", "Statement"] },
      { page: 1, y: 600, parts: ["Date", "Description", "Debit", "Credit", "Balance"] },
      { page: 1, y: 500, parts: ["15/01/2567", "Salary", "50,000.00", "150,000.00"] },
      { page: 1, y: 480, parts: ["16/01/2567", "ATM", "500.00", "149,500.00"] },
    ]);

    const result = parseBankTable(items, "kbank");
    expect(result.rows.length).toBeGreaterThanOrEqual(2);
    expect(result.rows[0].date).toBe("2024-01-15");
    expect(result.metadata.bank).toBe("kbank");
  });
});
