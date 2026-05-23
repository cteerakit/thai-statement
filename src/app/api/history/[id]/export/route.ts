import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { rowsToCsv } from "@/lib/export/csv";
import { rowsToXlsxBuffer } from "@/lib/export/xlsx";
import { db, schema } from "@/lib/db";
import { checkRateLimit } from "@/lib/limits";
import { getTrustedClientIp } from "@/lib/security/client-ip";

export const runtime = "nodejs";

const idSchema = z.string().uuid();
const formatSchema = z.enum(["csv", "xlsx"]);

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const ip = getTrustedClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "History is not configured." },
      { status: 503 },
    );
  }

  const { id: idParam } = await params;
  const idParsed = idSchema.safeParse(idParam);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const formatParsed = formatSchema.safeParse(
    searchParams.get("format") ?? "csv",
  );
  if (!formatParsed.success) {
    return NextResponse.json({ error: "Invalid format." }, { status: 400 });
  }

  const now = new Date();
  const [record] = await db
    .select()
    .from(schema.conversions)
    .where(
      and(
        eq(schema.conversions.id, idParsed.data),
        eq(schema.conversions.userId, session.user.id),
        gt(schema.conversions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const id = idParsed.data;
  const format = formatParsed.data;

  if (format === "xlsx") {
    const xlsx = await rowsToXlsxBuffer(record.rows);
    return new NextResponse(new Uint8Array(xlsx), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="statement-${id}.xlsx"`,
      },
    });
  }

  const csv = rowsToCsv(record.rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="statement-${id}.csv"`,
    },
  });
}
