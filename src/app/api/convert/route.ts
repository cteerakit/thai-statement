import { NextResponse } from "next/server";
import { z } from "zod";
import { rowsToCsv } from "@/lib/export/csv";
import { rowsToXlsxBuffer } from "@/lib/export/xlsx";
import {
  MAX_FILE_BYTES,
  MAX_PASSWORD_LENGTH,
  checkRateLimit,
} from "@/lib/limits";
import { ParseError, parseStatement, type BankHint } from "@/lib/parse";
import { hasConvertApiHeader } from "@/lib/security/api";
import { getTrustedClientIp } from "@/lib/security/client-ip";
import { validatePdfBuffer } from "@/lib/security/validate-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const bankSchema = z.enum(["auto", "scb", "kbank", "ktb"]);
const formatSchema = z.enum(["json", "csv", "xlsx"]);

export async function POST(request: Request) {
  if (!hasConvertApiHeader(request)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }

  const ip = getTrustedClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are supported." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 10 MB limit." },
      { status: 400 },
    );
  }

  const bankRaw = String(formData.get("bank") ?? "auto");
  const formatRaw = String(formData.get("format") ?? "json");

  const bankParsed = bankSchema.safeParse(bankRaw);
  const formatParsed = formatSchema.safeParse(formatRaw);

  if (!bankParsed.success || !formatParsed.success) {
    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  }

  const passwordRaw = formData.get("password");
  const password =
    typeof passwordRaw === "string" && passwordRaw.length > 0
      ? passwordRaw
      : undefined;

  if (password && password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "PDF password is too long." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfCheck = validatePdfBuffer(buffer);
  if (!pdfCheck.ok) {
    return NextResponse.json({ error: pdfCheck.error }, { status: 400 });
  }

  try {
    const result = await parseStatement(
      buffer,
      bankParsed.data as BankHint,
      password,
    );

    const meta = {
      ...result.metadata,
      bank: result.detectedBank,
      confidence: result.confidence,
      rowCount: result.rows.length,
    };

    if (formatParsed.data === "csv") {
      const csv = rowsToCsv(result.rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="statement.csv"',
        },
      });
    }

    if (formatParsed.data === "xlsx") {
      const xlsx = await rowsToXlsxBuffer(result.rows);
      return new NextResponse(new Uint8Array(xlsx), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="statement.xlsx"',
        },
      });
    }

    return NextResponse.json({
      rows: result.rows,
      warnings: result.warnings,
      meta,
    });
  } catch (err) {
    if (err instanceof ParseError) {
      const status =
        err.code === "UNSUPPORTED_BANK" ||
        err.code === "NO_TRANSACTIONS" ||
        err.code === "TOO_MANY_ROWS"
          ? 422
          : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error(
      "Convert error:",
      err instanceof Error ? err.stack ?? err.message : err,
    );
    return NextResponse.json(
      { error: "Failed to process PDF." },
      { status: 500 },
    );
  }
}
