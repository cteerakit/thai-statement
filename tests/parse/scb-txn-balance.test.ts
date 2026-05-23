import { describe, expect, it } from "vitest";
import { parseBankTable } from "@/lib/parse/banks/table-parser";
import type { TextItem } from "@/lib/parse/types";

function scbItems(
  lines: { y: number; cells: { x: number; text: string }[] }[],
): TextItem[] {
  const items: TextItem[] = [];
  for (const line of lines) {
    for (const cell of line.cells) {
      items.push({ str: cell.text, x: cell.x, y: line.y, page: 1 });
    }
  }
  return items;
}

describe("SCB txn+balance layout", () => {
  const headerY = 400;
  const broughtForwardY = 385;
  const row1Y = 370;

  const baseItems = scbItems([
    {
      y: headerY,
      cells: [
        { x: 36, text: "Date" },
        { x: 65, text: "Time" },
        { x: 91, text: "Code" },
        { x: 122, text: "Channel" },
        { x: 210, text: "Debit/Credit" },
        { x: 327, text: "Balance/Baht" },
        { x: 469, text: "Description" },
      ],
    },
    {
      y: broughtForwardY,
      cells: [
        { x: 70, text: "ยอดเงินคงเหลือยกมา (BALANCE BROUGHT FORWARD)" },
        { x: 356, text: "219,474.59" },
      ],
    },
    {
      y: row1Y,
      cells: [
        { x: 30, text: "13/04/26 08:50" },
        { x: 95, text: "X1" },
        { x: 126, text: "ENET" },
        { x: 270, text: "50,000.00" },
        { x: 356, text: "269,474.59" },
        { x: 394, text: "รับโอนจาก KBANK x6042" },
      ],
    },
    {
      y: 355,
      cells: [
        { x: 30, text: "15/04/26 15:21" },
        { x: 95, text: "X2" },
        { x: 126, text: "ENET" },
        { x: 200, text: "5,487.88" },
        { x: 356, text: "263,986.71" },
        { x: 394, text: "จ่ายบิล REVENUE DEPARTMENT" },
      ],
    },
  ]);

  it("maps withdrawal, deposit, balance, and description", () => {
    const result = parseBankTable(baseItems, "scb", { columnGap: 22 });
    expect(result.metadata.amountColumnLayout).toBe("txn_balance");
    expect(result.rows).toHaveLength(2);

    expect(result.rows[0].date).toBe("2026-04-13");
    expect(result.rows[0].credit).toBe(50_000);
    expect(result.rows[0].debit).toBeNull();
    expect(result.rows[0].balance).toBeCloseTo(269_474.59, 2);
    expect(result.rows[0].description).toContain("รับโอนจาก KBANK");

    expect(result.rows[1].debit).toBeCloseTo(5_487.88, 2);
    expect(result.rows[1].credit).toBeNull();
    expect(result.rows[1].balance).toBeCloseTo(263_986.71, 2);
    expect(result.rows[1].description).toContain("จ่ายบิล");
  });
});
