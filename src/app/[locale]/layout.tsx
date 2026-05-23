import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedPath } from "@/i18n/locale-path";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "th" }];
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader locale={locale} dict={dict.nav} />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          {dict.footer.processed}{" "}
          <a
            href={localizedPath(locale, "/privacy")}
            className="underline hover:text-foreground"
          >
            {dict.footer.privacy}
          </a>
          {" · "}
          <a
            href={localizedPath(locale, "/terms")}
            className="underline hover:text-foreground"
          >
            {dict.footer.terms}
          </a>
        </p>
      </footer>
    </>
  );
}
