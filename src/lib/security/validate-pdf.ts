import { MAX_FILE_BYTES } from "@/lib/limits";

const PDF_MAGIC = Buffer.from("%PDF-");

export function validatePdfBuffer(
  buffer: Buffer,
): { ok: true } | { ok: false; error: string } {
  if (buffer.length > MAX_FILE_BYTES) {
    return { ok: false, error: "File exceeds 10 MB limit." };
  }

  if (buffer.length < 5) {
    return { ok: false, error: "File is too small to be a valid PDF." };
  }

  if (!buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    return { ok: false, error: "Only PDF files are supported." };
  }

  return { ok: true };
}
