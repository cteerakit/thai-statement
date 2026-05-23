import type { TextItem } from "./types";
import { ParseError } from "./types";
import { getPasswordErrorCode } from "./pdf-password";
import {
  getPdfjsNodeDocumentOptions,
  getPdfjsNodeDocumentOptionsFallback,
  loadPdfJs,
  type PdfjsDocumentOptions,
} from "./pdfjs-node";

const MAX_PAGES = 20;

export { getPasswordErrorCode } from "./pdf-password";

function pdfErrorFromUnknown(err: unknown, phase: string): ParseError {
  const passwordCode = getPasswordErrorCode(err);
  if (passwordCode === 1) {
    return new ParseError(
      "This PDF is password-protected. Enter the password to unlock it.",
      "PDF_PASSWORD_REQUIRED",
    );
  }
  if (passwordCode === 2) {
    return new ParseError(
      "Incorrect PDF password. Please try again.",
      "PDF_PASSWORD_INVALID",
    );
  }

  const detail = err instanceof Error ? err.message : String(err);
  console.error(`PDF ${phase} failed:`, detail);

  return new ParseError("Could not read PDF file.", "INVALID_PDF");
}

async function openPdfDocument(
  pdfjs: Awaited<ReturnType<typeof loadPdfJs>>,
  buffer: Buffer,
  password: string | undefined,
  docOptions: PdfjsDocumentOptions | ReturnType<typeof getPdfjsNodeDocumentOptionsFallback>,
) {
  const loadingTask = pdfjs.getDocument({
    data: Uint8Array.from(buffer),
    ...docOptions,
    ...(password ? { password } : {}),
  });
  return loadingTask.promise;
}

export async function extractTextItems(
  buffer: Buffer,
  maxPages = MAX_PAGES,
  password?: string,
): Promise<TextItem[]> {
  const pdfjs = await loadPdfJs();

  let pdf;
  try {
    pdf = await openPdfDocument(pdfjs, buffer, password, getPdfjsNodeDocumentOptions());
  } catch (firstErr) {
    try {
      pdf = await openPdfDocument(
        pdfjs,
        buffer,
        password,
        getPdfjsNodeDocumentOptionsFallback(),
      );
    } catch (secondErr) {
      throw pdfErrorFromUnknown(secondErr, "open (with and without bundled fonts)");
    }
    console.warn(
      "PDF opened with fallback font options:",
      firstErr instanceof Error ? firstErr.message : firstErr,
    );
  }

  if (pdf.numPages > maxPages) {
    throw new ParseError(
      `PDF has ${pdf.numPages} pages; maximum is ${maxPages}.`,
      "TOO_MANY_PAGES",
    );
  }

  const items: TextItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
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
    } catch (err) {
      throw pdfErrorFromUnknown(err, `page ${pageNum} text`);
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
