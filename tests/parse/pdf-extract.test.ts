import { describe, expect, it } from "vitest";
import { getPasswordErrorCode } from "@/lib/parse/pdf-password";

describe("getPasswordErrorCode", () => {
  it("returns 1 for NEED_PASSWORD", () => {
    const err = { name: "PasswordException", code: 1, message: "password" };
    expect(getPasswordErrorCode(err)).toBe(1);
  });

  it("returns 2 for INCORRECT_PASSWORD", () => {
    const err = { name: "PasswordException", code: 2, message: "password" };
    expect(getPasswordErrorCode(err)).toBe(2);
  });

  it("returns null for other errors", () => {
    expect(getPasswordErrorCode(new Error("fail"))).toBeNull();
    expect(getPasswordErrorCode({ name: "PasswordException", code: 3 })).toBeNull();
    expect(getPasswordErrorCode(null)).toBeNull();
  });
});
