import { NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { checkRateLimit } from "@/lib/limits";
import { getTrustedClientIp } from "@/lib/security/client-ip";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
      { error: "History is not configured. Set DATABASE_URL." },
      { status: 503 },
    );
  }

  const now = new Date();
  const history = await db
    .select({
      id: schema.conversions.id,
      bank: schema.conversions.bank,
      rowCount: schema.conversions.rowCount,
      metadata: schema.conversions.metadata,
      createdAt: schema.conversions.createdAt,
      expiresAt: schema.conversions.expiresAt,
    })
    .from(schema.conversions)
    .where(
      and(
        eq(schema.conversions.userId, session.user.id),
        gt(schema.conversions.expiresAt, now),
      ),
    )
    .orderBy(desc(schema.conversions.createdAt))
    .limit(50);

  return NextResponse.json({ items: history });
}
