import type { Metadata } from "next";
import { OG_IMAGE_SRC, PRODUCT_NAME } from "@/i18n/brand";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/locale-path";
import { getSiteUrl } from "@/lib/site-url";

type PageMetadataInput = {
  locale: Locale;
  /** Path without locale prefix, e.g. `/`, `/privacy`, `/terms`. */
  pathname: string;
  title: string;
  description: string;
};

function absoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}

function openGraphLocale(locale: Locale): string {
  return locale === "th" ? "th_TH" : "en_US";
}

export function createPageMetadata({
  locale,
  pathname,
  title,
  description,
}: PageMetadataInput): Metadata {
  const canonicalPath = localizedPath(locale, pathname);
  const canonicalUrl = absoluteUrl(canonicalPath);

  const languages: Record<string, string> = {};
  for (const pageLocale of locales) {
    languages[pageLocale] = absoluteUrl(localizedPath(pageLocale, pathname));
  }
  languages["x-default"] = absoluteUrl(
    localizedPath(defaultLocale, pathname),
  );

  const alternateLocales = locales
    .filter((pageLocale) => pageLocale !== locale)
    .map(openGraphLocale);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: PRODUCT_NAME,
      locale: openGraphLocale(locale),
      alternateLocale: alternateLocales,
      type: "website",
      images: [
        {
          url: OG_IMAGE_SRC,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_SRC],
    },
  };
}
