import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { createPageMetadata } from "@/i18n/metadata";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = await getDictionary(localeParam);

  return createPageMetadata({
    locale: localeParam,
    pathname: "/privacy",
    title: dict.privacy.title,
    description: dict.privacy.metaDescription,
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const t = (await getDictionary(locale)).privacy;

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>{t.title}</h1>
      <p className="text-muted-foreground text-sm">{t.updated}</p>

      <h2>{t.collectTitle}</h2>
      <p>{t.collectBody}</p>

      <h2>{t.notTitle}</h2>
      <ul>
        <li>{t.notSell}</li>
        <li>{t.notAds}</li>
        <li>{t.notScanned}</li>
      </ul>

      <h2>{t.limitsTitle}</h2>
      <p>{t.limitsBody}</p>

      <h2>{t.contactTitle}</h2>
      <p>{t.contactBody}</p>
    </article>
  );
}
