import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const t = (await getDictionary(locale)).terms;

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>{t.title}</h1>
      <p className="text-muted-foreground text-sm">{t.updated}</p>

      <h2>{t.serviceTitle}</h2>
      <p>{t.serviceBody}</p>

      <h2>{t.warrantyTitle}</h2>
      <p>{t.warrantyBody}</p>

      <h2>{t.useTitle}</h2>
      <p>{t.useBody}</p>
    </article>
  );
}
