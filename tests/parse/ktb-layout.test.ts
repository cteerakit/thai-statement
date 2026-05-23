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

/** KTB APR2026-style layout: header x-positions + amount | balance | branch rows */
function makeKtbRealisticItems(
  txns: {
    date: string;
    txn: string;
    desc: string;
    amount: string;
    amountX: number;
    balance: string;
    branch: string;
  }[],
): TextItem[] {
  const items: TextItem[] = [];
  const headerParts = [
    { t: "Date/Time", x: 40 },
    { t: "Transaction", x: 82 },
    { t: "Description/Cheque No.", x: 210 },
    { t: "Withdrawal", x: 342 },
    { t: "Deposit", x: 417 },
    { t: "Balance", x: 492 },
    { t: "Branch", x: 536 },
  ];
  for (const h of headerParts) {
    items.push({ str: h.t, x: h.x, y: 600, page: 1 });
  }
  let y = 500;
  for (const row of txns) {
    items.push({ str: row.date, x: 40, y, page: 1 });
    items.push({ str: row.txn, x: 82, y, page: 1 });
    items.push({ str: row.desc, x: 210, y, page: 1 });
    items.push({ str: row.amount, x: row.amountX, y, page: 1 });
    items.push({ str: row.balance, x: 484, y, page: 1 });
    items.push({ str: row.branch, x: 545, y, page: 1 });
    y -= 20;
  }
  return items;
}

describe("KTB withdrawal/deposit layout", () => {
  it("parses KTB amount | balance | branch rows via header x-positions", () => {
    const items = makeKtbRealisticItems([
      {
        date: "01/04/26",
        txn: "Transfer out (NBSWT)",
        desc: "TR to 6910493427",
        amount: "20,000.00",
        amountX: 349,
        balance: "127,804.12",
        branch: "691",
      },
      {
        date: "09/04/26",
        txn: "Transfer in (BSD22)",
        desc: "BPS/020/04/STRIPE PAYMENTS",
        amount: "141.58",
        amountX: 420,
        balance: "127,945.70",
        branch: "108682",
      },
    ]);

    const result = parseBankTable(items, "ktb");
    expect(result.rows).toHaveLength(2);

    expect(result.rows[0].debit).toBe(20000);
    expect(result.rows[0].credit).toBeNull();
    expect(result.rows[0].balance).toBe(127804.12);

    expect(result.rows[1].debit).toBeNull();
    expect(result.rows[1].credit).toBe(141.58);
    expect(result.rows[1].balance).toBe(127945.7);
  });

  it("parses 5-column row with withdrawal and balance (empty deposit slot)", () => {
    const items = makeItems([
      {
        page: 1,
        y: 600,
        parts: ["Date", "Description", "Withdrawal", "Deposit", "Balance"],
      },
      {
        page: 1,
        y: 500,
        parts: ["16/01/2567", "ATM", "500.00", "", "149,500.00"],
      },
    ]);
    const result = parseBankTable(items, "ktb");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].debit).toBe(500);
    expect(result.rows[0].credit).toBeNull();
    expect(result.rows[0].balance).toBe(149500);
  });
});
