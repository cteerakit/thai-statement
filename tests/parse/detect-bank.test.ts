import { describe, expect, it } from "vitest";
import { detectBank } from "@/lib/parse/detect-bank";

describe("detectBank", () => {
  it("detects SCB", () => {
    const result = detectBank(
      "Siam Commercial Bank Statement ธนาคารไทยพาณิชย์",
    );
    expect(result.bank).toBe("scb");
    expect(result.scores.scb).toBeGreaterThan(0);
  });

  it("detects KBank", () => {
    const result = detectBank("KASIKORNBANK ธนาคารกสิกรไทย");
    expect(result.bank).toBe("kbank");
  });

  it("detects KTB", () => {
    const result = detectBank("Krungthai Bank ธนาคารกรุงไทย");
    expect(result.bank).toBe("ktb");
  });

  it("returns null for unknown", () => {
    const result = detectBank("Generic Bank Statement");
    expect(result.bank).toBeNull();
  });
});
