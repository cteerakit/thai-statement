import { createRequire } from "node:module";
import path from "node:path";
import { ensurePdfJsDomPolyfills } from "./pdfjs-dom-polyfill";

const require = createRequire(import.meta.url);

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsReady: Promise<PdfJsModule> | null = null;

/** Resolve pdfjs-dist root via package.json (works when traced on Vercel). */
export function resolvePdfjsDistRoot(): string {
  return path.dirname(require.resolve("pdfjs-dist/package.json"));
}

/** Directory path with trailing `/` (pdf.js validates with endsWith("/"); Node fs accepts `/` on Windows). */
export function pdfjsAssetDir(...segments: string[]): string {
  const dir = path.join(resolvePdfjsDistRoot(), ...segments).replace(/\\/g, "/");
  return dir.endsWith("/") ? dir : `${dir}/`;
}

export type PdfjsDocumentOptions = {
  standardFontDataUrl: string;
  cMapUrl: string;
  cMapPacked: true;
  useWorkerFetch: false;
  useSystemFonts: false;
  disableFontFace: true;
  useWasm: false;
};

/** Paths and flags for pdf.js in Node / Vercel serverless. */
export function getPdfjsNodeDocumentOptions(): PdfjsDocumentOptions {
  return {
    standardFontDataUrl: pdfjsAssetDir("standard_fonts"),
    cMapUrl: pdfjsAssetDir("cmaps"),
    cMapPacked: true,
    useWorkerFetch: false,
    useSystemFonts: false,
    disableFontFace: true,
    useWasm: false,
  };
}

/** Minimal options when bundled font/cmap dirs are unavailable. */
export function getPdfjsNodeDocumentOptionsFallback(): Pick<
  PdfjsDocumentOptions,
  "useWorkerFetch" | "useSystemFonts" | "disableFontFace" | "useWasm"
> {
  return {
    useWorkerFetch: false,
    useSystemFonts: false,
    disableFontFace: true,
    useWasm: false,
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
      ensurePdfJsDomPolyfills();
      await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      return import("pdfjs-dist/legacy/build/pdf.mjs");
    })();
  }
  return pdfjsReady;
}
