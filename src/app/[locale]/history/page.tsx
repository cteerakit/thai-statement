import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { and, desc, eq, gt } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedPath } from "@/i18n/locale-path";

type HistoryPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dict = await getDictionary(locale);
  const t = dict.history;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(localizedPath(locale, "/"));
  }

  if (!db) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t.unavailableTitle}</CardTitle>
            <CardDescription>{t.unavailableDescription}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const items = await db
    .select({
      id: schema.conversions.id,
      bank: schema.conversions.bank,
      rowCount: schema.conversions.rowCount,
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

  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="uppercase">{item.bank}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.rowCount} {t.rows}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.createdAt.toLocaleString(dateLocale)} · {t.expires}{" "}
                      {item.expiresAt.toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/history/${item.id}/export?format=csv`}
                      download
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      CSV
                    </a>
                    <a
                      href={`/api/history/${item.id}/export?format=xlsx`}
                      download
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      Excel
                    </a>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm">
        <Link
          href={localizedPath(locale, "/")}
          className="underline text-muted-foreground hover:text-foreground"
        >
          {t.back}
        </Link>
      </p>
    </div>
  );
}
