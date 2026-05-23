import { describe, expect, it } from "vitest";
import { parseBankTable } from "@/lib/parse/banks/table-parser";
import type { TextItem } from "@/lib/parse/types";

function kbankItems(
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

describe("KBank txn+balance layout", () => {
  it("maps withdrawal, balance, and description from column positions", () => {
    const items = kbankItems([
      {
        y: 300,
        cells: [
          { x: 101, text: "เวลา/" },
          { x: 286, text: "ยอดคงเหลือ" },
        ],
      },
      {
        y: 285,
        cells: [
          { x: 74, text: "วันที่" },
          { x: 153, text: "รายการ" },
          { x: 213, text: "ถอนเงิน / ฝากเงิน" },
          { x: 358, text: "ช่องทาง" },
          { x: 455, text: "รายละเอียด" },
        ],
      },
      {
        y: 270,
        cells: [
          { x: 68, text: "01-05-26" },
          { x: 123, text: "ยอดยกมา" },
          { x: 303, text: "23,799.90" },
        ],
      },
      {
        y: 255,
        cells: [
          { x: 68, text: "11-05-26" },
          { x: 101, text: "22:30" },
          { x: 123, text: "ชำระเงิน" },
          { x: 234, text: "200.00" },
          { x: 303, text: "23,599.90" },
          { x: 333, text: "K PLUS" },
          { x: 404, text: "เพื่อชำระ Ref X9745 บริษัท ทรู มันนี จำกัด" },
        ],
      },
    ]);

    const result = parseBankTable(items, "kbank", { columnGap: 20 });
    expect(result.metadata.amountColumnLayout).toBe("kbank_txn_balance");
    expect(result.rows).toHaveLength(1);

    expect(result.rows[0].debit).toBeCloseTo(200, 2);
    expect(result.rows[0].credit).toBeNull();
    expect(result.rows[0].balance).toBeCloseTo(23_599.9, 2);
    expect(result.rows[0].description).toContain("ชำระเงิน");
    expect(result.rows[0].description).toContain("ทรู");
  });
});
