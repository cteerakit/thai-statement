import { describe, expect, it } from "vitest";
import {
  getPdfjsNodeDocumentOptions,
  loadPdfJs,
  pdfjsAssetDir,
  resolvePdfjsDistRoot,
} from "@/lib/parse/pdfjs-node";

describe("pdfjs-node", () => {
  it("resolves pdfjs-dist on disk", () => {
    const root = resolvePdfjsDistRoot();
    expect(root).toMatch(/pdfjs-dist[\\/]?$/);
  });

  it("uses filesystem paths for cmap/fonts (not file:// URLs)", () => {
    const opts = getPdfjsNodeDocumentOptions();
    expect(opts.cMapUrl).not.toMatch(/^file:/i);
    expect(opts.standardFontDataUrl).not.toMatch(/^file:/i);
    expect(opts.cMapUrl.endsWith("/")).toBe(true);
    expect(pdfjsAssetDir("cmaps")).toBe(opts.cMapUrl);
  });

  it("loads pdf.js with worker handler available", async () => {
    const pdfjs = await loadPdfJs();
    expect(pdfjs.getDocument).toBeTypeOf("function");
    expect(globalThis.pdfjsWorker?.WorkerMessageHandler).toBeDefined();
  });

  it("opens a minimal PDF", async () => {
    const pdfjs = await loadPdfJs();
    const buf = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
    );
    const task = pdfjs.getDocument({
      data: Uint8Array.from(buf),
      ...getPdfjsNodeDocumentOptions(),
    });
    const pdf = await task.promise;
    expect(pdf.numPages).toBe(1);
  });
});
