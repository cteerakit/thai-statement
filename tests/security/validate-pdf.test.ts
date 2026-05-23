import { describe, expect, it } from "vitest";
import { validatePdfBuffer } from "@/lib/security/validate-pdf";

describe("validatePdfBuffer", () => {
  it("accepts buffers starting with %PDF-", () => {
    const buf = Buffer.from("%PDF-1.4 fake content");
    expect(validatePdfBuffer(buf)).toEqual({ ok: true });
  });

  it("rejects non-PDF content", () => {
    const buf = Buffer.from("not a pdf");
    expect(validatePdfBuffer(buf)).toEqual({
      ok: false,
      error: "Only PDF files are supported.",
    });
  });

  it("rejects tiny buffers", () => {
    expect(validatePdfBuffer(Buffer.from("%PD"))).toEqual({
      ok: false,
      error: "File is too small to be a valid PDF.",
    });
  });
});
