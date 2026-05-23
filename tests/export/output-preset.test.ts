import { describe, expect, it } from "vitest";
import {
  EXPORT_COLUMNS,
  getOutputCellValue,
  normalizeOutputTablePreset,
  projectOutputTable,
  signedAmount,
} from "@/lib/export/output-preset";
import type { StatementRow } from "@/lib/parse/types";

const labels = {
  date: "Date",
  description: "Description",
  withdrawal: "Withdrawal",
  deposit: "Deposit",
  amount: "Amount",
  balance: "Balance",
  reference: "Reference",
};

const sampleRow: StatementRow = {
  date: "2024-01-15",
  description: "Transfer in",
  debit: null,
  credit: 1500.5,
  balance: 10000,
  reference: "REF001",
};

describe("signedAmount", () => {
  it("returns deposit as positive", () => {
    expect(signedAmount(sampleRow)).toBe(1500.5);
  });

  it("returns withdrawal as negative", () => {
    expect(
      signedAmount({
        ...sampleRow,
        debit: 200,
        credit: null,
      }),
    ).toBe(-200);
  });

  it("returns null when neither withdrawal nor deposit", () => {
    expect(
      signedAmount({
        ...sampleRow,
        debit: null,
        credit: null,
      }),
    ).toBeNull();
  });
});

describe("normalizeOutputTablePreset", () => {
  it("maps legacy debit_credit to withdrawal_deposit", () => {
    expect(normalizeOutputTablePreset("debit_credit")).toBe("withdrawal_deposit");
  });
});

describe("projectOutputTable", () => {
  it("withdrawal_deposit preset uses withdrawal and deposit columns", () => {
    const { headers, rows } = projectOutputTable(
      [sampleRow],
      EXPORT_COLUMNS.withdrawal_deposit,
      labels,
    );
    expect(headers).toEqual([
      "Date",
      "Description",
      "Withdrawal",
      "Deposit",
      "Balance",
      "Reference",
    ]);
    expect(rows[0]).toEqual([
      "2024-01-15",
      "Transfer in",
      null,
      1500.5,
      10000,
      "REF001",
    ]);
    expect(getOutputCellValue(sampleRow, "deposit")).toBe(1500.5);
    expect(getOutputCellValue(sampleRow, "withdrawal")).toBeNull();
  });

  it("signed_amount preset uses a single signed amount column", () => {
    const { headers, rows } = projectOutputTable(
      [sampleRow],
      EXPORT_COLUMNS.signed_amount,
      labels,
    );
    expect(headers).toEqual([
      "Date",
      "Description",
      "Amount",
      "Balance",
      "Reference",
    ]);
    expect(rows[0][2]).toBe(1500.5);
    expect(getOutputCellValue(sampleRow, "amount")).toBe(1500.5);
  });
});
