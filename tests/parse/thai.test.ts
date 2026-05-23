import { describe, expect, it } from "vitest";
import {
  extractAmounts,
  extractDateFromLine,
  parseAmount,
  parseThaiDate,
  toChristianYear,
} from "@/lib/parse/thai";

describe("toChristianYear", () => {
  it("converts Buddhist era years", () => {
    expect(toChristianYear(2567)).toBe(2024);
  });

  it("leaves CE years unchanged", () => {
    expect(toChristianYear(2024)).toBe(2024);
  });
});

describe("parseThaiDate", () => {
  it("parses DD/MM/YYYY with Buddhist year", () => {
    expect(parseThaiDate("15/01/2567")).toBe("2024-01-15");
  });

  it("parses ISO with CE year", () => {
    expect(parseThaiDate("2024-03-20")).toBe("2024-03-20");
  });
});

describe("parseAmount", () => {
  it("parses comma amounts", () => {
    expect(parseAmount("1,234.56")).toBe(1234.56);
  });

  it("parses parenthetical negatives", () => {
    expect(parseAmount("(500.00)")).toBe(-500);
  });
});

describe("extractAmounts", () => {
  it("finds multiple amounts on a line", () => {
    const amounts = extractAmounts("Transfer 500.00 10,234.56");
    expect(amounts).toEqual([500, 10234.56]);
  });
});

describe("extractDateFromLine", () => {
  it("extracts date from transaction line", () => {
    expect(extractDateFromLine("15/01/2567 ATM Withdrawal 500.00")).toBe(
      "2024-01-15",
    );
  });
});
