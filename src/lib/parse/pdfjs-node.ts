import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsReady: Promise<PdfJsModule> | null = null;

/** Resolve pdfjs-dist root via package.json (works when traced on Vercel). */
export function resolvePdfjsDistRoot(): string {
  return path.dirname(require.resolve("pdfjs-dist/package.json"));
}

function assetUrl(...segments: string[]): string {
  return pathToFileURL(path.join(resolvePdfjsDistRoot(), ...segments)).href;
}

/** Paths and flags for pdf.js in Node / Vercel serverless. */
export function getPdfjsNodeDocumentOptions() {
  return {
    standardFontDataUrl: assetUrl("standard_fonts/"),
    cMapUrl: assetUrl("cmaps/"),
    cMapPacked: true as const,
    useWorkerFetch: false as const,
    useSystemFonts: false as const,
    disableFontFace: true as const,
    useWasm: false as const,
  };
}

/**
 * Load pdf.js for server-side parsing.
 * Pre-imports the worker module so Node uses globalThis.pdfjsWorker instead of
 * dynamic-importing workerSrc (which breaks on Vercel when paths differ).
 */
export function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsReady) {
    pdfjsReady = (async () => {
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      return import("pdfjs-dist/legacy/build/pdf.mjs");
    })();
  }
  return pdfjsReady;
}
