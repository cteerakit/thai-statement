import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/limits";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(checkRateLimit(key)).toBe(true);
    expect(checkRateLimit(key)).toBe(true);
  });
});
