import type { TextItem } from "./types";
import { ParseError } from "./types";

const MAX_PAGES = 20;

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

export async function extractTextItems(
  buffer: Buffer,
  maxPages = MAX_PAGES,
  password?: string,
): Promise<TextItem[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  let pdf;
  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: undefined,
      disableFontFace: true,
      ...(password ? { password } : {}),
    });
    pdf = await loadingTask.promise;
  } catch (err) {
    const passwordCode = getPasswordErrorCode(err);
    if (passwordCode === 1) {
      throw new ParseError(
        "This PDF is password-protected. Enter the password to unlock it.",
        "PDF_PASSWORD_REQUIRED",
      );
    }
    if (passwordCode === 2) {
      throw new ParseError(
        "Incorrect PDF password. Please try again.",
        "PDF_PASSWORD_INVALID",
      );
    }
    throw new ParseError("Could not read PDF file.", "INVALID_PDF");
  }

  if (pdf.numPages > maxPages) {
    throw new ParseError(
      `PDF has ${pdf.numPages} pages; maximum is ${maxPages}.`,
      "TOO_MANY_PAGES",
    );
  }

  const items: TextItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const transform = item.transform;
      items.push({
        str: item.str,
        x: transform[4],
        y: transform[5],
        page: pageNum,
      });
    }
  }

  return items;
}

export function itemsToPlainText(items: TextItem[]): string {
  const byPage = new Map<number, TextItem[]>();
  for (const item of items) {
    const list = byPage.get(item.page) ?? [];
    list.push(item);
    byPage.set(item.page, list);
  }

  const pages: string[] = [];
  for (const pageNum of [...byPage.keys()].sort((a, b) => a - b)) {
    const pageItems = byPage.get(pageNum)!;
    pageItems.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });
    pages.push(pageItems.map((i) => i.str).join(" "));
  }
  return pages.join("\n");
}
