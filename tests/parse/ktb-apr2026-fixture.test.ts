import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseStatement } from "@/lib/parse";

const PDF_PATH =
  "c:/Users/cteer/Downloads/Statement_APR2026_19ef145a-5b50-40c9-b40e-87b194db7d54_unlocked.pdf";

describe("KTB APR2026 statement PDF", () => {
  it("maps withdrawal, deposit, and balance from column positions", async () => {
    let buffer: Buffer;
    try {
      buffer = readFileSync(PDF_PATH);
    } catch {
      return; // skip when fixture not present (CI)
    }

    const result = await parseStatement(buffer, "ktb");
    expect(result.rows.length).toBeGreaterThan(0);

    const first = result.rows[0];
    expect(first.description).toContain("Transfer out");
    expect(first.debit).toBe(20000);
    expect(first.credit).toBeNull();
    expect(first.balance).toBeCloseTo(127804.12, 2);

    const transferIn = result.rows.find((r) =>
      r.description.includes("STRIPE"),
    );
    expect(transferIn?.credit).toBeCloseTo(141.58, 2);
    expect(transferIn?.debit).toBeNull();
    expect(transferIn?.balance).toBeCloseTo(127945.7, 2);

    const bothSet = result.rows.filter(
      (r) => r.debit !== null && r.credit !== null,
    );
    expect(bothSet).toHaveLength(0);

    const balanceIsBranch = result.rows.filter((r) => r.balance === 691);
    expect(balanceIsBranch.length).toBeLessThan(result.rows.length);
  });
});
