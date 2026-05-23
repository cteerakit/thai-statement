import { describe, expect, it } from "vitest";
import { sanitizeSpreadsheetCell } from "@/lib/export/sanitize-cell";

describe("sanitizeSpreadsheetCell", () => {
  it("prefixes formula-like values", () => {
    expect(sanitizeSpreadsheetCell("=1+1")).toBe("'=1+1");
    expect(sanitizeSpreadsheetCell("+123")).toBe("'+123");
    expect(sanitizeSpreadsheetCell("-cmd")).toBe("'-cmd");
    expect(sanitizeSpreadsheetCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitizeSpreadsheetCell("Transfer to savings")).toBe(
      "Transfer to savings",
    );
    expect(sanitizeSpreadsheetCell("123.45")).toBe("123.45");
  });
});
