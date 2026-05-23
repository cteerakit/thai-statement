/** pdfjs PasswordResponses: NEED_PASSWORD = 1, INCORRECT_PASSWORD = 2 */
export function getPasswordErrorCode(err: unknown): 1 | 2 | null {
  if (
    err &&
    typeof err === "object" &&
    "name" in err &&
    err.name === "PasswordException" &&
    "code" in err &&
    (err.code === 1 || err.code === 2)
  ) {
    return err.code;
  }
  return null;
}

export type PdfPasswordState = "ok" | "required" | "invalid";

/** Opens the PDF locally to detect password protection (browser-safe build). */
export async function detectPdfPassword(
  data: Uint8Array,
  password?: string,
): Promise<PdfPasswordState> {
  const pdfjs = await import("pdfjs-dist/webpack.mjs");

  try {
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      standardFontDataUrl: undefined,
      disableFontFace: true,
      ...(password ? { password } : {}),
    });
    await loadingTask.promise;
    return "ok";
  } catch (err) {
    const code = getPasswordErrorCode(err);
    if (code === 1) return "required";
    if (code === 2) return "invalid";
    return "ok";
  }
}
