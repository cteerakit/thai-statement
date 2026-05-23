import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle pdf.js with the convert route (worker pre-imported in pdfjs-node.ts).
  serverExternalPackages: ["exceljs"],
  outputFileTracingIncludes: {
    "/api/convert": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.mjs",
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/pdfjs-dist/package.json",
    ],
  },
};

export default nextConfig;
