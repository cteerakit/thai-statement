import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * pdf.js references DOMMatrix at module load time on Node.
 * Install globals from @napi-rs/canvas before importing pdfjs-dist.
 */
export function ensurePdfJsDomPolyfills(): void {
  if (globalThis.DOMMatrix) return;

  const canvas = require("@napi-rs/canvas") as {
    DOMMatrix: typeof DOMMatrix;
    ImageData: typeof ImageData;
    Path2D: typeof Path2D;
  };

  globalThis.DOMMatrix = canvas.DOMMatrix;
  globalThis.ImageData = canvas.ImageData;
  globalThis.Path2D = canvas.Path2D;

  if (!globalThis.navigator?.language) {
    globalThis.navigator = {
      language: "en-US",
      platform: "",
      userAgent: "",
    } as Navigator;
  }
}
