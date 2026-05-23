import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

let configured = false;

function getPdfjsDistRoot(): string {
  return path.dirname(require.resolve("pdfjs-dist/package.json"));
}

/** Paths and flags for pdf.js in Node / Vercel serverless. */
export function getPdfjsNodeDocumentOptions() {
  const distRoot = getPdfjsDistRoot();
  return {
    standardFontDataUrl: pathToFileURL(
      path.join(distRoot, "standard_fonts/"),
    ).href,
    cMapUrl: pathToFileURL(path.join(distRoot, "cmaps/")).href,
    cMapPacked: true as const,
    useWorkerFetch: false as const,
    useSystemFonts: false as const,
    disableFontFace: true as const,
    useWasm: false as const,
  };
}

/** Configure worker + load pdf.js once per process (required on Vercel). */
export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!configured) {
    const distRoot = getPdfjsDistRoot();
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
      path.join(distRoot, "legacy/build/pdf.worker.mjs"),
    ).href;
    configured = true;
  }

  return pdfjs;
}
